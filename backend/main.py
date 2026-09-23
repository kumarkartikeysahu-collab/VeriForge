from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from core.mrz_engine import validate_td3_passport
from core.ela_engine import perform_ela
from core.ocr_engine import extract_document_data
from core.verhoeff_engine import validate_aadhaar_card
from core.voter_engine import validate_epic_number
from core.image_verifier import (
    detect_and_extract_face,
    check_photo_splicing,
    verify_liveness_and_anti_spoofing,
    compare_faces,
    compute_image_quality,
    verify_document_classification
)
# Upgraded SIH 2026 PS 188 Forensic Engines
from core.dtd_engine import run_dual_stream_tampered_detector
from core.screen_recapture_engine import evaluate_screen_recapture
from core.font_geometry_engine import evaluate_document_typography
from core.crypto_qr_engine import verify_qr_cross_consistency
from core.synthetic_tamper_engine import generate_tampered_document_sample
from core.forensic_report_engine import generate_forensic_evidentiary_sheet
from core.edge_engine import EdgeExecutionBenchmark, get_edge_system_telemetry

app = FastAPI(
    title="SENTINEL-ID Forensics API",
    description="Enterprise Digital Forensics Gateway for SIH26188 (Ministry of Home Affairs)",
    version="2.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MRZRequest(BaseModel):
    line1: str
    line2: str

class FaceVerifyRequest(BaseModel):
    doc_image: Optional[str] = None
    live_image: Optional[str] = None

class SyntheticAttackRequest(BaseModel):
    attack_type: str = "ALL"
    apply_compression: bool = True
    image_base64: Optional[str] = None

class ForensicReportRequest(BaseModel):
    document_data: Dict[str, Any]


@app.get("/api/health")
def health_check():
    telemetry = get_edge_system_telemetry()
    return {
        "status": "HEALTHY",
        "service": "SENTINEL-ID Enterprise Forensic Gateway",
        "mode": "Air-Gapped / Edge-Quantized",
        "ps_id": "SIH26188",
        "authority": "Ministry of Home Affairs",
        "supported_documents": ["Aadhaar", "Visa", "Voter ID", "Passport"],
        "telemetry": telemetry
    }


@app.get("/api/edge-benchmark")
def edge_benchmark():
    """Returns edge hardware profiling, INT8 quantization status, and offline telemetry."""
    return get_edge_system_telemetry()


@app.post("/api/verify-document-type")
async def verify_document_type(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None)
):
    """
    Lightweight Pre-Flight Endpoint:
    Strictly verifies if an image is Aadhaar, Visa, Voter ID, or Passport.
    """
    contents = await file.read()
    clean_cat = category if (category and isinstance(category, str) and category.strip()) else None
    ocr_result = extract_document_data(contents, category_hint=clean_cat)
    doc_verif = verify_document_classification(contents, category_hint=clean_cat, ocr_data=ocr_result)
    return doc_verif


@app.post("/api/verify-mrz")
def verify_mrz(payload: MRZRequest):
    result = validate_td3_passport(payload.line1, payload.line2)
    return result


@app.post("/api/verify-face")
async def verify_face(payload: FaceVerifyRequest):
    """
    1:1 Facial Biometric Comparison & Anti-Spoofing Verification
    """
    if not payload.doc_image or not payload.live_image:
        raise HTTPException(status_code=400, detail="Both doc_image and live_image are required.")
    
    result = compare_faces(payload.doc_image, payload.live_image)
    return result


@app.post("/api/generate-tampered-sample")
async def generate_tampered_sample(
    file: Optional[UploadFile] = File(None),
    attack_type: str = Form("ALL"),
    apply_compression: bool = Form(True)
):
    """
    Synthetic Tamper Augmentation Pipeline Endpoint:
    Injects adversarial Poisson photo swap, lookalike font alteration, selective inpainting,
    and WhatsApp compression to test the model in real time.
    """
    if file:
        contents = await file.read()
    else:
        # Load local test document if no file uploaded
        try:
            with open("test_doc.jpg", "rb") as f:
                contents = f.read()
        except Exception:
            raise HTTPException(status_code=400, detail="Please upload an identity document image to augment.")

    result = generate_tampered_document_sample(
        contents,
        attack_type=attack_type,
        apply_compression=apply_compression
    )
    return result


@app.post("/api/forensic-report")
async def get_forensic_report(payload: ForensicReportRequest):
    """
    Outputs Court-Admissible Automated Forensic Evidentiary Sheet with exact legal/forensic justifications.
    """
    doc_data = payload.document_data
    report = generate_forensic_evidentiary_sheet(
        document_data=doc_data,
        dtd_result=doc_data.get("dtd_analysis"),
        font_result=doc_data.get("font_geometry"),
        screen_recapture_result=doc_data.get("screen_recapture"),
        crypto_qr_result=doc_data.get("qr_cross_consistency")
    )
    return report


@app.post("/api/screen-document")
async def screen_document(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    mrz_line1: Optional[str] = Form(None),
    mrz_line2: Optional[str] = Form(None)
):
    """
    Master Forensic Gateway:
    Executes sub-1.5s air-gapped pipeline covering DTD, Screen Replay, Font Kerning,
    QR Cross-Consistency, Biometric Splicing, and Mathematical Checksums.
    """
    benchmark = EdgeExecutionBenchmark()
    contents = await file.read()

    # Sanitize Form parameters
    clean_cat = category if (category and isinstance(category, str) and category.strip()) else None
    clean_mrz1 = mrz_line1 if (mrz_line1 and isinstance(mrz_line1, str) and mrz_line1.strip()) else None
    clean_mrz2 = mrz_line2 if (mrz_line2 and isinstance(mrz_line2, str) and mrz_line2.strip()) else None

    # Stage 1: Document OCR & Extraction
    benchmark.start_stage("ocr_extraction")
    ocr_result = extract_document_data(contents, category_hint=clean_cat)
    benchmark.end_stage("ocr_extraction")

    # Stage 2: Strict Document Classification
    benchmark.start_stage("document_type_validation")
    doc_verif = verify_document_classification(contents, category_hint=clean_cat, ocr_data=ocr_result)
    benchmark.end_stage("document_type_validation")

    if not doc_verif.get("is_valid", False):
        invalid_msg = doc_verif.get("message", "The image is invalid. Only Aadhaar, Visa, Voter ID, and Passport documents are accepted.")
        edge_summary = benchmark.get_summary()
        return {
            "is_valid_document": False,
            "filename": file.filename,
            "threat_score": 100.0,
            "verdict": "CRITICAL",
            "status": "INVALID",
            "category": "INVALID",
            "rejection_reason": doc_verif.get("rejection_reason", "INVALID_DOCUMENT"),
            "error": invalid_msg,
            "detail": doc_verif.get("detail", invalid_msg),
            "dpdp_compliant": True,
            "edge_benchmark": edge_summary,
            "anomalies": [
                {
                    "type": "INVALID_DOCUMENT_REJECTION",
                    "severity": "CRITICAL",
                    "title": "Invalid Document or Subject",
                    "detail": invalid_msg
                }
            ],
            "extracted": {
                "holder_name": "NOT DETECTED",
                "doc_number": "NOT DETECTED",
                "dob": "NOT DETECTED",
                "expiry": "N/A"
            }
        }

    detected_cat = doc_verif.get("detected_category", ocr_result.get("category_detected", clean_cat))

    # Stage 3: Dual-Stream Tampered Text Network (DTD/FFDN)
    benchmark.start_stage("dual_stream_tamper_detection")
    dtd_result = run_dual_stream_tampered_detector(contents, document_category=detected_cat)
    benchmark.end_stage("dual_stream_tamper_detection")

    # Stage 4: Screen-Recapture & Anti-Replay Presentation Attack Detection
    benchmark.start_stage("screen_recapture_analysis")
    screen_recapture_result = evaluate_screen_recapture(contents)
    benchmark.end_stage("screen_recapture_analysis")

    # Stage 5: Micro-Font Geometry & Baseline Kerning Classifier
    benchmark.start_stage("font_geometry_analysis")
    font_result = evaluate_document_typography(contents, extracted_fields=ocr_result)
    benchmark.end_stage("font_geometry_analysis")

    # Stage 6: Secure QR & Cryptographic Cross-Consistency Check
    benchmark.start_stage("crypto_qr_cross_consistency")
    qr_cross_result = verify_qr_cross_consistency(contents, ocr_extracted=ocr_result)
    benchmark.end_stage("crypto_qr_cross_consistency")

    # Stage 7: Image Verification (Face Portrait & Photo Splicing)
    benchmark.start_stage("face_and_splicing_verification")
    face_info = detect_and_extract_face(contents)
    splicing_info = None
    if face_info.get("face_found"):
        splicing_info = check_photo_splicing(contents, face_info.get("face_box"))
    benchmark.end_stage("face_and_splicing_verification")

    # Stage 8: Checksum Engines (ICAO 9303 MRZ, UIDAI Verhoeff, ECI Voter EPIC)
    benchmark.start_stage("mathematical_checksums")
    active_mrz1 = clean_mrz1 or ocr_result.get("mrz_line1")
    active_mrz2 = clean_mrz2 or ocr_result.get("mrz_line2")

    mrz_status = None
    if active_mrz2 and isinstance(active_mrz2, str):
        mrz_status = validate_td3_passport(active_mrz1 or "", active_mrz2)

    aadhaar_status = None
    if detected_cat == "Aadhaar" or clean_cat == "Aadhaar":
        aadhaar_status = validate_aadhaar_card(ocr_result.get("doc_number"))

    voter_status = None
    if detected_cat == "Voter ID" or clean_cat == "Voter ID":
        voter_status = validate_epic_number(ocr_result.get("doc_number"))
    benchmark.end_stage("mathematical_checksums")

    # Classical ELA computation for backward-compatibility & comparative inspection
    ela_bytes, ela_anomaly_score = perform_ela(contents)

    # -----------------------------------------------------------------------
    # Composite Threat Score & Anomaly Synthesis
    # -----------------------------------------------------------------------
    dtd_score = dtd_result.get("tamper_score", 0.0)
    replay_score = 100.0 - screen_recapture_result.get("anti_replay_score", 95.0)
    font_anom = 65.0 if font_result.get("overall_typography_status") == "ANOMALY_DETECTED" else 0.0

    # Weighted baseline composite
    raw_threat = (dtd_score * 0.40) + (replay_score * 0.35) + (font_anom * 0.25)
    threat_score = raw_threat
    anomalies = []

    # Checksum & Mathematical Check Overrides
    if mrz_status and not mrz_status.get("valid", True):
        threat_score = max(threat_score, 92.0)
        anomalies.append({
            "type": "MRZ_CHECKSUM_ERROR",
            "severity": "CRITICAL",
            "title": "ICAO 9303 Checksum Mismatch",
            "detail": "Passport/Visa machine readable zone failed mathematical check-digit verification."
        })

    if aadhaar_status and aadhaar_status.get("has_12_digits") and not aadhaar_status.get("valid", False):
        threat_score = max(threat_score, 94.0)
        anomalies.append({
            "type": "VERHOEFF_CHECKSUM_ERROR",
            "severity": "CRITICAL",
            "title": "Aadhaar Verhoeff Checksum Failed",
            "detail": "12-digit Aadhaar number failed the official D5 dihedral checksum verification (UIDAI standard)."
        })

    if voter_status and not voter_status.get("valid", False) and ocr_result.get("doc_number") not in [None, "NOT DETECTED"]:
        threat_score = max(threat_score, 88.0)
        anomalies.append({
            "type": "EPIC_FORMAT_ERROR",
            "severity": "CRITICAL",
            "title": "Invalid Voter ID Format",
            "detail": voter_status.get("reason", "Voter ID (EPIC) does not conform to the Election Commission of India 10-character standard.")
        })

    # Cryptographic QR Cross-Consistency Overrides
    if qr_cross_result.get("qr_detected") and not qr_cross_result.get("cross_consistency_match", True):
        threat_score = max(threat_score, 96.0)
        for mismatch in qr_cross_result.get("mismatches", []):
            anomalies.append({
                "type": "CRYPTOGRAPHIC_QR_CROSS_MISMATCH",
                "severity": "CRITICAL",
                "title": f"Cryptographic QR Mismatch: {mismatch.get('field')}",
                "detail": mismatch.get("reason")
            })

    # Screen Recapture & Presentation Attack
    if screen_recapture_result.get("presentation_attack_detected"):
        threat_score = max(threat_score, 89.0)
        anomalies.append({
            "type": "PRESENTATION_REPLAY_ATTACK",
            "severity": "CRITICAL",
            "title": f"Screen Recapture / Anti-Replay Violation: {screen_recapture_result.get('attack_type')}",
            "detail": screen_recapture_result.get("evidentiary_detail")
        })

    # Dual-Stream Tampered Text Anomaly
    if dtd_result.get("tamper_detected"):
        threat_score = max(threat_score, 84.0)
        anomalies.append({
            "type": "DUAL_STREAM_TAMPER_DETECTED",
            "severity": "HIGH",
            "title": "Dual-Stream Tampered Text Anomaly (DTD/FFDN)",
            "detail": dtd_result.get("evidentiary_summary")
        })

    # Micro-Font Baseline & Kerning Anomaly
    if font_result.get("overall_typography_status") == "ANOMALY_DETECTED":
        threat_score = max(threat_score, 78.0)
        anomalies.append({
            "type": "FONT_BASELINE_KERNING_ANOMALY",
            "severity": "HIGH",
            "title": "Micro-Font Geometry Discontinuity",
            "detail": font_result.get("evidentiary_summary")
        })

    # Photo Splicing Discontinuity
    if splicing_info and splicing_info.get("splicing_detected"):
        threat_score = max(threat_score, 86.0)
        anomalies.append({
            "type": "PHOTO_SPLICING_ANOMALY",
            "severity": "HIGH",
            "title": "Document Portrait Splicing Discontinuity",
            "detail": splicing_info.get("detail", "High edge gradient discontinuity detected around ID card portrait.")
        })

    verdict = "SAFE" if threat_score < 25 else "REVIEW" if threat_score < 75 else "CRITICAL"
    edge_summary = benchmark.get_summary()

    # Consolidate Tampered Bounding Boxes for UI overlay
    consolidated_tamper_boxes = list(dtd_result.get("tampered_boxes", []))
    if face_info.get("face_box") and splicing_info and splicing_info.get("splicing_detected"):
        fb = face_info["face_box"]
        consolidated_tamper_boxes.append({
            "x": fb.get("pct_x", 10.0),
            "y": fb.get("pct_y", 20.0),
            "width": fb.get("pct_w", 25.0),
            "height": fb.get("pct_h", 40.0),
            "confidence": splicing_info.get("splicing_score", 85.0),
            "reason": "Portrait photo boundary gradient discontinuity (Poisson or alpha splice)",
            "stream_origin": "PORTRAIT_SPLICING_ENGINE"
        })

    # Prepare document data object for report generation
    doc_payload = {
        "filename": file.filename,
        "threat_score": round(threat_score, 1),
        "verdict": verdict,
        "category": detected_cat,
        "mrz_validation": mrz_status,
        "aadhaar_validation": aadhaar_status,
        "voter_validation": voter_status,
        "splicing_info": splicing_info
    }

    evidentiary_sheet = generate_forensic_evidentiary_sheet(
        document_data=doc_payload,
        dtd_result=dtd_result,
        font_result=font_result,
        screen_recapture_result=screen_recapture_result,
        crypto_qr_result=qr_cross_result
    )

    return {
        "is_valid_document": True,
        "filename": file.filename,
        "threat_score": round(threat_score, 1),
        "verdict": verdict,
        "category": detected_cat,
        "mrz_validation": mrz_status,
        "aadhaar_validation": aadhaar_status,
        "voter_validation": voter_status,
        "mrz_line1": active_mrz1,
        "mrz_line2": active_mrz2,
        "dpdp_compliant": True,
        "anomalies": anomalies,
        "doc_face_image": face_info.get("face_base64"),
        "face_detected": face_info.get("face_found", False),
        "face_box": face_info.get("face_box"),
        "image_quality": face_info.get("quality"),
        "splicing_info": splicing_info,
        # Enhanced SIH PS 188 Telemetry
        "dtd_analysis": dtd_result,
        "screen_recapture": screen_recapture_result,
        "font_geometry": font_result,
        "qr_cross_consistency": qr_cross_result,
        "tampered_boxes": consolidated_tamper_boxes,
        "edge_benchmark": edge_summary,
        "evidentiary_sheet": evidentiary_sheet,
        "ela_anomaly_score": ela_anomaly_score,
        "extracted": {
            "holder_name": ocr_result.get("holder_name"),
            "doc_number": ocr_result.get("doc_number"),
            "dob": ocr_result.get("dob"),
            "expiry": ocr_result.get("expiry"),
            "relative_name": ocr_result.get("relative_name"),
            "gender": ocr_result.get("gender")
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
