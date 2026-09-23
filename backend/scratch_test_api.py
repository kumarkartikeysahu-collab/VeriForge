"""
SENTINEL-ID API Verification Test
Validates FastAPI endpoints /api/verify-face and /api/screen-document.
"""

import asyncio
import io
import json
import base64
from PIL import Image, ImageDraw
from fastapi import UploadFile

from main import app, verify_face, screen_document, FaceVerifyRequest

print("=" * 60)
print("TESTING FASTAPI IMAGE VERIFICATION ENDPOINTS")
print("=" * 60)

async def run_tests():
    # 1. Generate test face portrait
    def make_face_bytes(bg=(220, 230, 240), skin=(235, 205, 180)):
        img = Image.new('RGB', (280, 320), color=bg)
        draw = ImageDraw.Draw(img)
        draw.ellipse((50, 40, 230, 280), fill=(40, 30, 25))
        draw.ellipse((65, 70, 215, 260), fill=skin)
        draw.ellipse((95, 120, 130, 145), fill=(255, 255, 255))
        draw.ellipse((150, 120, 185, 145), fill=(255, 255, 255))
        draw.ellipse((108, 128, 122, 142), fill=(20, 20, 20))
        draw.ellipse((163, 128, 177, 142), fill=(20, 20, 20))
        draw.arc((110, 180, 170, 220), start=20, end=160, fill=(180, 50, 50), width=4)
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=95)
        return buf.getvalue()

    face1_bytes = make_face_bytes()
    face2_bytes = make_face_bytes(bg=(240, 240, 240))
    b64_face1 = f"data:image/jpeg;base64,{base64.b64encode(face1_bytes).decode('utf-8')}"
    b64_face2 = f"data:image/jpeg;base64,{base64.b64encode(face2_bytes).decode('utf-8')}"

    # 2. Test /api/verify-face
    req = FaceVerifyRequest(doc_image=b64_face1, live_image=b64_face2)
    resp_face = await verify_face(req)
    print("\n[/api/verify-face Response]:")
    print(f"  Verdict: {resp_face.get('verdict')}")
    print(f"  Match Score: {resp_face.get('match_score')}%")
    print(f"  Is Matched: {resp_face.get('is_matched')}")
    print(f"  Liveness Passed: {resp_face.get('liveness_passed')}")
    print(f"  Thumbnail Generated: {bool(resp_face.get('doc_face_image'))}")
    assert resp_face["is_matched"] == True, "Expected matched faces"

    # 3. Test /api/screen-document
    upload_file = UploadFile(filename="test_id_card.jpg", file=io.BytesIO(face1_bytes))
    resp_screen = await screen_document(file=upload_file, category="Passport")
    print("\n[/api/screen-document Response]:")
    print(f"  Filename: {resp_screen.get('filename')}")
    print(f"  Threat Score: {resp_screen.get('threat_score')}%")
    print(f"  Face Detected: {resp_screen.get('face_detected')}")
    print(f"  Doc Face Image: {bool(resp_screen.get('doc_face_image'))}")
    print(f"  Image Quality: {resp_screen.get('image_quality')}")
    assert resp_screen["face_detected"] == True, "Document photo should be detected"

    print("\n" + "=" * 60)
    print("ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
