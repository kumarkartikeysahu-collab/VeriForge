"""
SENTINEL-ID OCR & Document Parsing Engine
Uses EasyOCR to extract text, MRZ zones, Aadhaar numbers, and demographic fields.
"""

import re
import io
import numpy as np
from PIL import Image
from typing import Dict, Any, Optional

# Lazy-loaded EasyOCR reader to avoid startup delays
_reader = None

def get_ocr_reader():
    global _reader
    if _reader is None:
        import easyocr
        # Initialize EasyOCR (English) with CPU fallback
        _reader = easyocr.Reader(['en'], gpu=False)
    return _reader

def parse_mrz_dates(date_str: str) -> str:
    """Converts YYMMDD to DD/MM/20YY or DD/MM/19YY"""
    if len(date_str) != 6 or not date_str.isdigit():
        return date_str
    yy = int(date_str[0:2])
    mm = date_str[2:4]
    dd = date_str[4:6]
    # Standard pivot: >= 40 is 19xx, < 40 is 20xx
    year = f"19{yy:02d}" if yy >= 40 else f"20{yy:02d}"
    return f"{dd}/{mm}/{year}"

def preprocess_camera_image_for_ocr(img_np: np.ndarray) -> np.ndarray:
    """
    Applies adaptive contrast equalization (CLAHE) and bilateral edge preservation
    to enhance camera feeds with non-uniform ambient illumination, glare, or low contrast.
    """
    try:
        import cv2
        if len(img_np.shape) == 3:
            gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_np
        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        eq = clahe.apply(gray)
        filtered = cv2.bilateralFilter(eq, d=5, sigmaColor=35, sigmaSpace=35)
        return cv2.cvtColor(filtered, cv2.COLOR_GRAY2RGB)
    except Exception:
        return img_np

def extract_document_data(image_bytes: bytes, category_hint: Optional[str] = None) -> Dict[str, Any]:
    """
    Runs OCR on image bytes and parses document information.
    Includes adaptive contrast enhancement fallback for real-time camera captures.
    """
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_image)
    except Exception as e:
        return {
            "error": f"Failed to load image: {str(e)}",
            "holder_name": "N/A",
            "doc_number": "N/A",
            "dob": "N/A",
            "expiry": "N/A",
            "raw_text": []
        }

    reader = get_ocr_reader()
    results = reader.readtext(img_np)
    # results format: [ (bbox, text, confidence), ... ]

    # If camera capture has low contrast or shadow, run adaptive CLAHE pass
    if len(results) < 3:
        try:
            enhanced_np = preprocess_camera_image_for_ocr(img_np)
            enhanced_results = reader.readtext(enhanced_np)
            if len(enhanced_results) > len(results):
                results = enhanced_results
        except Exception:
            pass

    raw_lines = [res[1].strip() for res in results if res[1].strip()]
    full_text = " \n ".join(raw_lines)


    extracted = {
        "holder_name": None,
        "doc_number": None,
        "dob": None,
        "expiry": None,
        "mrz_line1": None,
        "mrz_line2": None,
        "category_detected": None,
        "raw_text": raw_lines
    }

    # 1. MRZ Detection (Passports & Visas)
    mrz_lines = []
    for line in raw_lines:
        clean = line.replace(" ", "").upper()
        # Clean common OCR misreads in MRZ
        clean = clean.replace("«", "<").replace("(", "<").replace("{", "<")
        if ("<" in clean and len(clean) >= 30) or clean.startswith("P<") or clean.startswith("V<"):
            mrz_lines.append(clean)

    if len(mrz_lines) >= 2:
        l1 = mrz_lines[-2]
        l2 = mrz_lines[-1]
        
        # Pad or trim to TD3 standard length (44)
        if len(l1) < 44:
            l1 = l1.ljust(44, "<")
        elif len(l1) > 44:
            l1 = l1[:44]

        if len(l2) < 44:
            l2 = l2.ljust(44, "<")
        elif len(l2) > 44:
            l2 = l2[:44]

        extracted["mrz_line1"] = l1
        extracted["mrz_line2"] = l2
        extracted["category_detected"] = "Passport" if l1.startswith("P") else ("Visa" if l1.startswith("V") else "Passport")

        # Parse Line 1 names: P<IND[SURNAME]<<[GIVEN_NAMES]<<<<
        parts = l1[5:].split("<<")
        if len(parts) >= 2:
            surname = parts[0].replace("<", " ").strip()
            given = parts[1].replace("<", " ").strip()
            extracted["holder_name"] = f"{given} {surname}".strip()
        elif len(parts) == 1:
            extracted["holder_name"] = parts[0].replace("<", " ").strip()

        # Parse Line 2 details:
        doc_num = l2[0:9].replace("<", "").strip()
        extracted["doc_number"] = doc_num
        extracted["dob"] = parse_mrz_dates(l2[13:19])
        extracted["expiry"] = parse_mrz_dates(l2[21:27])

    upper_text = full_text.upper()

    # 2. Passport text-based detection if no 2-line MRZ was extracted
    passport_keywords = ["PASSPORT", "REPUBLIC OF INDIA", "PASSEPORT", "DIPLOMATIC PASSPORT", "OFFICIAL PASSPORT", "REPUBLIC OF"]
    has_passport_kw = any(kw in upper_text for kw in passport_keywords)
    passport_no_match = re.search(r'\b([A-Z][0-9]{7,8})\b', full_text)
    if (has_passport_kw or (category_hint == "Passport" and (passport_no_match or "PASSPORT" in upper_text or "REPUBLIC" in upper_text))) and not extracted["category_detected"]:
        extracted["category_detected"] = "Passport"
        if not extracted["doc_number"] and passport_no_match:
            extracted["doc_number"] = passport_no_match.group(1)

    # 3. Visa text-based detection
    visa_keywords = ["ENTRY VISA", "TOURIST VISA", "BUSINESS VISA", "EMPLOYMENT VISA", "STUDENT VISA", "VISA NO", "SINGLE ENTRY", "MULTIPLE ENTRY", "REPUBLIC OF INDIA VISA", "VISA"]
    has_visa_kw = any(kw in upper_text for kw in visa_keywords) or (re.search(r'\bVISA\b', upper_text) and ("VALID" in upper_text or "ENTRY" in upper_text or "PASSPORT" in upper_text))
    if (has_visa_kw or (category_hint == "Visa" and "VISA" in upper_text)) and extracted["category_detected"] not in ["Passport"]:
        extracted["category_detected"] = "Visa"

    # 4. Voter ID (EPIC) Detection & Parsing
    voter_keywords = [
        "ELECTION COMMISSION OF INDIA", "BHARAT NIRVACHAN AAYOG",
        "ELECTORAL PHOTO IDENTITY CARD", "ELECTION COMMISSION",
        "VOTER ID", "EPIC NO", "EPIC", "ELECTOR'S NAME", "ELECTOR NAME",
        "NIRVACHAN", "BHARAT NIRVACHAN"
    ]
    has_voter_kw = any(kw in upper_text for kw in voter_keywords)
    epic_match = re.search(r'\b([A-Z]{3}\s?[0-9]{7})\b', full_text)

    if has_voter_kw or (epic_match and category_hint == "Voter ID") or (has_voter_kw and epic_match) or (epic_match and not extracted.get("category_detected")):
        extracted["category_detected"] = "Voter ID"
        if epic_match:
            extracted["doc_number"] = epic_match.group(1).replace(" ", "")

        # Extract elector name
        elector_match = re.search(r"(?:Elector'?s?\s*Name|Name)\s*[:]?\s*([A-Za-z\s]{3,30})", full_text, re.IGNORECASE)
        if elector_match and not extracted["holder_name"]:
            extracted["holder_name"] = elector_match.group(1).strip()

        # Extract relative name (Father/Husband)
        rel_match = re.search(r"(?:Father'?s?\s*Name|Husband'?s?\s*Name)\s*[:]?\s*([A-Za-z\s]{3,30})", full_text, re.IGNORECASE)
        if rel_match:
            extracted["relative_name"] = rel_match.group(1).strip()

        # Extract Gender/Sex
        sex_match = re.search(r'\b(MALE|FEMALE|TRANSGENDER)\b', upper_text)
        if sex_match:
            extracted["gender"] = sex_match.group(1)

    # 5. Aadhaar Parsing
    aadhaar_keywords = [
        "AADHAAR", "AADHAR", "UIDAI", "UNIQUE IDENTIFICATION",
        "MERA AADHAAR", "MERI PEHCHAN", "GOVERNMENT OF INDIA",
        "GOVT OF INDIA", "BHARAT SARKAR", "PEHCHAN", "AUTHORITY OF INDIA"
    ]
    has_aadhaar_kw = any(kw in upper_text for kw in aadhaar_keywords)
    aadhaar_12_match = re.search(r'\b(\d{4}\s\d{4}\s\d{4})\b', full_text)
    aadhaar_hyphen_match = re.search(r'\b(\d{4}-\d{4}-\d{4})\b', full_text)
    aadhaar_cont_match = re.search(r'\b(\d{12})\b', full_text)

    if (has_aadhaar_kw or (aadhaar_12_match and category_hint == "Aadhaar") or (aadhaar_cont_match and category_hint == "Aadhaar") or aadhaar_12_match or aadhaar_hyphen_match) and extracted["category_detected"] not in ["Passport", "Visa", "Voter ID"]:
        if aadhaar_12_match:
            extracted["doc_number"] = aadhaar_12_match.group(1)
            extracted["category_detected"] = "Aadhaar"
        elif aadhaar_hyphen_match:
            d = aadhaar_hyphen_match.group(1).replace("-", " ")
            extracted["doc_number"] = d
            extracted["category_detected"] = "Aadhaar"
        elif aadhaar_cont_match:
            d = aadhaar_cont_match.group(1)
            extracted["doc_number"] = f"{d[0:4]} {d[4:8]} {d[8:12]}"
            extracted["category_detected"] = "Aadhaar"
        elif has_aadhaar_kw:
            extracted["category_detected"] = "Aadhaar"

        # DOB Parsing
        dob_match = re.search(r'(?:DOB|Date of Birth|Year of Birth|DOB\s*:)\s*[:]?\s*([0-9]{2}[/-][0-9]{2}[/-][0-9]{4}|[0-9]{4})', full_text, re.IGNORECASE)
        if dob_match:
            extracted["dob"] = dob_match.group(1).replace("-", "/")
        else:
            date_match = re.search(r'\b([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})\b', full_text)
            if date_match and not extracted["dob"]:
                extracted["dob"] = date_match.group(1).replace("-", "/")

        # Aadhaar Name heuristic
        if not extracted["holder_name"]:
            for i, line in enumerate(raw_lines):
                if re.search(r'DOB|Date of Birth|Birth', line, re.IGNORECASE) and i > 0:
                    prev_line = raw_lines[i-1].strip()
                    if not any(w in prev_line.lower() for w in ['government', 'india', 'unique', 'uidai', 'authority', 'male', 'female']):
                        extracted["holder_name"] = prev_line
                        break

    # 6. Corroborate category_hint if not yet assigned
    if not extracted["category_detected"] and category_hint in ["Aadhaar", "Visa", "Voter ID", "Passport"]:
        if category_hint == "Passport" and (has_passport_kw or passport_no_match or "PASSPORT" in upper_text or "REPUBLIC" in upper_text):
            extracted["category_detected"] = "Passport"
        elif category_hint == "Aadhaar" and (has_aadhaar_kw or "GOVERNMENT OF INDIA" in upper_text or "GOVT OF INDIA" in upper_text or "UIDAI" in upper_text or "PEHCHAN" in upper_text):
            extracted["category_detected"] = "Aadhaar"
        elif category_hint == "Voter ID" and (has_voter_kw or "ELECTION" in upper_text or "COMMISSION" in upper_text or "ELECTOR" in upper_text or epic_match):
            extracted["category_detected"] = "Voter ID"
        elif category_hint == "Visa" and "VISA" in upper_text:
            extracted["category_detected"] = "Visa"

    # 7. Fallback checks for Document Number and Name
    if not extracted["doc_number"]:
        if epic_match and extracted["category_detected"] == "Voter ID":
            extracted["doc_number"] = epic_match.group(1)
        elif passport_no_match and extracted["category_detected"] == "Passport":
            extracted["doc_number"] = passport_no_match.group(1)

    if not extracted["holder_name"]:
        name_match = re.search(r'Name\s*[:]?\s*([A-Za-z\s]{3,30})', full_text, re.IGNORECASE)
        if name_match:
            extracted["holder_name"] = name_match.group(1).strip()
        elif raw_lines:
            for line in raw_lines[:6]:
                if line.isupper() and len(line.split()) in [2, 3] and not any(kw in line for kw in ['GOVERNMENT', 'INDIA', 'REPUBLIC', 'PASSPORT', 'AADHAAR', 'UNION', 'ELECTION', 'COMMISSION']):
                    extracted["holder_name"] = line
                    break

    # 8. Check for Unauthorized Document Signatures (PAN, Driving License, etc.)
    unauthorized_doc_type = None
    if any(kw in upper_text for kw in ["INCOME TAX DEPARTMENT", "PERMANENT ACCOUNT NUMBER", "P.A.N."]) or re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', full_text):
        unauthorized_doc_type = "PAN Card"
    elif any(kw in upper_text for kw in ["DRIVING LICENCE", "DRIVING LICENSE", "MOTOR VEHICLES ACT", "LICENCING AUTHORITY", "TRANSPORT DEPARTMENT", "UNION OF INDIA DRIVING"]) or re.search(r'\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b', full_text):
        unauthorized_doc_type = "Driving Licence"
    elif any(kw in upper_text for kw in ["RATION CARD", "FOOD CIVIL SUPPLIES"]):
        unauthorized_doc_type = "Ration Card"
    elif any(kw in upper_text for kw in ["TAX INVOICE", "INVOICE NO", "BILL TO", "BALANCE DUE", "SUBTOTAL"]):
        unauthorized_doc_type = "Invoice / Bill"

    if unauthorized_doc_type:
        extracted["category_detected"] = unauthorized_doc_type

    # 9. Verify if document belongs to the 4 strictly allowed types
    ALLOWED_CATEGORIES = ["Aadhaar", "Visa", "Voter ID", "Passport"]
    has_allowed_category = extracted["category_detected"] in ALLOWED_CATEGORIES and not unauthorized_doc_type
    word_count = len([w for line in raw_lines for w in line.split() if len(w) > 1])
    is_non_document_subject = (not has_allowed_category and not unauthorized_doc_type) or (word_count < 3 and not mrz_lines and not has_allowed_category)

    return {
        "holder_name": extracted["holder_name"] or "NOT DETECTED",
        "doc_number": extracted["doc_number"] or "NOT DETECTED",
        "dob": extracted["dob"] or "NOT DETECTED",
        "expiry": extracted["expiry"] or "N/A",
        "mrz_line1": extracted["mrz_line1"],
        "mrz_line2": extracted["mrz_line2"],
        "category_detected": extracted["category_detected"],
        "is_allowed_category": has_allowed_category,
        "unauthorized_doc_type": unauthorized_doc_type,
        "is_non_document_subject": is_non_document_subject,
        "word_count": word_count,
        "raw_text_snippets": raw_lines[:15],
        "relative_name": extracted.get("relative_name"),
        "gender": extracted.get("gender")
    }
