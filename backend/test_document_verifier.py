"""
SENTINEL-ID Test Suite: Document Verification & Classification Restriction
Verifies that ONLY Aadhaar, Visa, Voter ID, and Passport are accepted,
and any other document (PAN card, Driving Licence, Invoice) or non-document
subject (random photos, selfies, blank images) is rejected with the exact error message:
"The image is invalid. Only Aadhaar, Visa, Voter ID, and Passport documents are accepted."
"""

import asyncio
import io
import unittest
import numpy as np
import cv2
from PIL import Image, ImageDraw
from fastapi import UploadFile

from main import app, verify_document_type, screen_document
from core.voter_engine import validate_epic_number
from core.image_verifier import verify_document_classification
from core.ocr_engine import extract_document_data

INVALID_MSG = "The image is invalid. Only Aadhaar, Visa, Voter ID, and Passport documents are accepted."

def create_synthetic_image(text_lines=None, width=500, height=350, bg_color=(240, 240, 240)):
    """Creates an in-memory JPEG image with drawn text lines to simulate document OCR."""
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    if text_lines:
        y = 20
        for line in text_lines:
            draw.text((30, y), line, fill=(10, 10, 10))
            y += 35
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class TestDocumentVerificationRestriction(unittest.TestCase):

    # ----------------------------------------------------
    # 1. Voter Engine Unit Tests
    # ----------------------------------------------------
    def test_voter_engine_valid_epic(self):
        res = validate_epic_number("ABC1234567")
        self.assertTrue(res["valid"])
        self.assertEqual(res["epic_number"], "ABC 1234567")
        self.assertEqual(res["masked_format"], "ABC****567")
        self.assertTrue(res["has_10_chars"])

    def test_voter_engine_legacy_format(self):
        res = validate_epic_number("WB/01/023/123456")
        self.assertTrue(res["valid"])
        self.assertIn("Legacy", res["standard"])

    def test_voter_engine_invalid_epic(self):
        res = validate_epic_number("INVALID123")
        self.assertFalse(res["valid"])
        res2 = validate_epic_number("")
        self.assertFalse(res2["valid"])

    # ----------------------------------------------------
    # 2. Permitted Document Types (Acceptance Tests)
    # ----------------------------------------------------
    def test_accept_passport_ocr(self):
        ocr_data = {
            "category_detected": "Passport",
            "mrz_line1": "P<INDKUMAR<<ARUN<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            "mrz_line2": "Z2094321<4IND8501014M3001018<<<<<<<<<<<<<<02",
            "doc_number": "Z2094321",
            "raw_text_snippets": ["REPUBLIC OF INDIA", "PASSPORT", "P<IND"]
        }
        dummy_img = create_synthetic_image(["PASSPORT", "REPUBLIC OF INDIA"])
        res = verify_document_classification(dummy_img, ocr_data=ocr_data)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["detected_category"], "Passport")

    def test_accept_aadhaar_ocr(self):
        ocr_data = {
            "category_detected": "Aadhaar",
            "doc_number": "3675 9834 6015",
            "raw_text_snippets": ["GOVERNMENT OF INDIA", "UNIQUE IDENTIFICATION AUTHORITY OF INDIA", "AADHAAR", "3675 9834 6015"]
        }
        dummy_img = create_synthetic_image(["GOVERNMENT OF INDIA", "AADHAAR", "3675 9834 6015"])
        res = verify_document_classification(dummy_img, ocr_data=ocr_data)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["detected_category"], "Aadhaar")

    def test_accept_visa_ocr(self):
        ocr_data = {
            "category_detected": "Visa",
            "mrz_line1": "V<GBRSMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
            "mrz_line2": "1234567897GBR8001011M2501015<<<<<<<<<<<<<<00",
            "raw_text_snippets": ["REPUBLIC OF INDIA", "ENTRY VISA", "VALID FOR MULTIPLE JOURNEYS"]
        }
        dummy_img = create_synthetic_image(["ENTRY VISA", "REPUBLIC OF INDIA"])
        res = verify_document_classification(dummy_img, ocr_data=ocr_data)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["detected_category"], "Visa")

    def test_accept_voter_id_ocr(self):
        ocr_data = {
            "category_detected": "Voter ID",
            "doc_number": "ABC1234567",
            "raw_text_snippets": ["ELECTION COMMISSION OF INDIA", "ELECTORAL PHOTO IDENTITY CARD", "ABC1234567"]
        }
        dummy_img = create_synthetic_image(["ELECTION COMMISSION OF INDIA", "EPIC NO ABC1234567"])
        res = verify_document_classification(dummy_img, ocr_data=ocr_data)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["detected_category"], "Voter ID")

    # ----------------------------------------------------
    # 3. Unauthorized Document Types (Rejection Tests)
    # ----------------------------------------------------
    def test_reject_pan_card(self):
        ocr_data = {
            "category_detected": "PAN Card",
            "unauthorized_doc_type": "PAN Card",
            "doc_number": "ABCDE1234F",
            "raw_text_snippets": ["INCOME TAX DEPARTMENT", "GOVT OF INDIA", "PERMANENT ACCOUNT NUMBER", "ABCDE1234F"]
        }
        dummy_img = create_synthetic_image(["INCOME TAX DEPARTMENT", "PERMANENT ACCOUNT NUMBER CARD"])
        res = verify_document_classification(dummy_img, ocr_data=ocr_data)
        self.assertFalse(res["is_valid"])
        self.assertEqual(res["rejection_reason"], "UNAUTHORIZED_DOCUMENT_TYPE")
        self.assertEqual(res["message"], INVALID_MSG)

    def test_reject_driving_license(self):
        ocr_data = {
            "category_detected": "Driving Licence",
            "unauthorized_doc_type": "Driving Licence",
            "doc_number": "DL0120110012345",
            "raw_text_snippets": ["UNION OF INDIA DRIVING LICENCE", "TRANSPORT DEPARTMENT"]
        }
        dummy_img = create_synthetic_image(["DRIVING LICENCE", "TRANSPORT DEPARTMENT"])
        res = verify_document_classification(dummy_img, ocr_data=ocr_data)
        self.assertFalse(res["is_valid"])
        self.assertEqual(res["rejection_reason"], "UNAUTHORIZED_DOCUMENT_TYPE")
        self.assertEqual(res["message"], INVALID_MSG)

    # ----------------------------------------------------
    # 4. Non-Document Subject (Rejection Tests)
    # ----------------------------------------------------
    def test_reject_non_document_blank_or_photo(self):
        """Simulates random photo, selfie without document, pet, or scenery."""
        ocr_data = {
            "category_detected": None,
            "is_non_document_subject": True,
            "word_count": 0,
            "raw_text_snippets": []
        }
        blank_img = create_synthetic_image(text_lines=[])
        res = verify_document_classification(blank_img, category_hint="Passport", ocr_data=ocr_data)
        self.assertFalse(res["is_valid"])
        self.assertEqual(res["message"], INVALID_MSG)

    def test_reject_too_small_image(self):
        tiny_img = np.zeros((40, 40, 3), dtype=np.uint8)
        _, buf = cv2.imencode('.jpg', tiny_img)
        res = verify_document_classification(buf.tobytes())
        self.assertFalse(res["is_valid"])
        self.assertEqual(res["message"], INVALID_MSG)

    # ----------------------------------------------------
    # 5. FastAPI Endpoints Integration Tests
    # ----------------------------------------------------
    def test_api_verify_document_type_blank_rejected(self):
        blank_bytes = create_synthetic_image(text_lines=[])
        upload_file = UploadFile(filename="blank.jpg", file=io.BytesIO(blank_bytes))
        data = asyncio.run(verify_document_type(file=upload_file, category="Passport"))
        self.assertFalse(data["is_valid"])
        self.assertEqual(data["message"], INVALID_MSG)

    def test_api_screen_document_rejects_non_document(self):
        blank_bytes = create_synthetic_image(text_lines=[])
        upload_file = UploadFile(filename="random_photo.jpg", file=io.BytesIO(blank_bytes))
        data = asyncio.run(screen_document(file=upload_file, category="Passport"))
        self.assertFalse(data["is_valid_document"])
        self.assertEqual(data["status"], "INVALID")
        self.assertEqual(data["error"], INVALID_MSG)
        self.assertTrue(any(a["type"] == "INVALID_DOCUMENT_REJECTION" for a in data["anomalies"]))

    # ----------------------------------------------------
    # 6. Real-Time Camera Scanner Capture Tests
    # ----------------------------------------------------
    def test_camera_captured_aadhaar_with_hint(self):
        """Verifies camera capture with space-separated Aadhaar and UIDAI token is accepted."""
        ocr_data = {
            "category_detected": "Aadhaar",
            "doc_number": "5482 1934 8201",
            "raw_text_snippets": ["GOVT OF INDIA", "UIDAI", "MERI PEHCHAN", "5482 1934 8201"]
        }
        cam_img = create_synthetic_image(["GOVT OF INDIA", "UIDAI", "5482 1934 8201"])
        res = verify_document_classification(cam_img, category_hint="Aadhaar", ocr_data=ocr_data)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["detected_category"], "Aadhaar")

    def test_camera_captured_voter_id_with_hint(self):
        """Verifies camera capture with spaced EPIC number is accepted."""
        ocr_data = {
            "category_detected": "Voter ID",
            "doc_number": "XYZ9876543",
            "raw_text_snippets": ["BHARAT NIRVACHAN", "ELECTOR NAME", "XYZ 9876543"]
        }
        cam_img = create_synthetic_image(["BHARAT NIRVACHAN", "ELECTOR NAME", "XYZ 9876543"])
        res = verify_document_classification(cam_img, category_hint="Voter ID", ocr_data=ocr_data)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["detected_category"], "Voter ID")

    def test_api_screen_document_camera_aadhaar_success(self):
        """Verifies end-to-end screen_document handles camera-captured Aadhaar image."""
        card_bytes = create_synthetic_image([
            "GOVERNMENT OF INDIA",
            "MERA AADHAAR MERI PEHCHAN",
            "DOB: 15/08/1990",
            "MALE",
            "3675 9834 6015"
        ], width=640, height=420)
        upload_file = UploadFile(filename="live_aadhaar_cam.jpg", file=io.BytesIO(card_bytes))
        data = asyncio.run(screen_document(file=upload_file, category="Aadhaar"))
        self.assertTrue(data["is_valid_document"])
        self.assertEqual(data["category"], "Aadhaar")
        self.assertIn("extracted", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)


