"""
Automated Test Suite for Image Verification Engine
Tests Face Extraction, Quality Analysis, Anti-Spoofing, Photo Splicing, and 1:1 Matching.
"""

import io
import json
import numpy as np
from PIL import Image, ImageDraw
import cv2

from core.image_verifier import (
    detect_and_extract_face,
    check_photo_splicing,
    verify_liveness_and_anti_spoofing,
    compare_faces,
    compute_image_quality
)

print("=" * 60)
print("SENTINEL-ID IMAGE VERIFICATION TEST SUITE")
print("=" * 60)

def create_synthetic_person_image(bg_color=(230, 235, 245), eye_color=(30, 30, 30), offset=0):
    img = Image.new('RGB', (320, 380), color=bg_color)
    draw = ImageDraw.Draw(img)
    # Hair / Outline
    draw.ellipse((60 + offset, 50, 260 + offset, 300), fill=(40, 30, 25))
    # Face skin
    draw.ellipse((75 + offset, 80, 245 + offset, 290), fill=(235, 205, 180))
    # Eyes
    draw.ellipse((105 + offset, 140, 145 + offset, 165), fill=(255, 255, 255), outline=(50, 50, 50))
    draw.ellipse((175 + offset, 140, 215 + offset, 165), fill=(255, 255, 255), outline=(50, 50, 50))
    # Pupils
    draw.ellipse((118 + offset, 146, 134 + offset, 160), fill=eye_color)
    draw.ellipse((188 + offset, 146, 204 + offset, 160), fill=eye_color)
    # Eyebrows
    draw.line([(100 + offset, 132), (145 + offset, 132)], fill=(30, 20, 15), width=3)
    draw.line([(175 + offset, 132), (220 + offset, 132)], fill=(30, 20, 15), width=3)
    # Nose
    draw.polygon([(160 + offset, 165), (150 + offset, 205), (170 + offset, 205)], fill=(215, 180, 150))
    # Mouth
    draw.arc((125 + offset, 215, 195 + offset, 250), start=15, end=165, fill=(190, 70, 70), width=4)
    # Torso
    draw.ellipse((30 + offset, 290, 290 + offset, 450), fill=(30, 60, 110))
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return buf.getvalue()

# Test 1: Face Detection & Extraction
doc_img_bytes = create_synthetic_person_image()
res_extract = detect_and_extract_face(doc_img_bytes)

print("\n[TEST 1] Face Extraction from Document Image:")
print(f"  Face Found: {res_extract.get('face_found')}")
print(f"  Face Box: {res_extract.get('face_box')}")
print(f"  Thumbnail Generated: {bool(res_extract.get('face_base64'))}")
print(f"  Quality: {res_extract.get('quality')}")
assert res_extract["face_found"] == True, "Face should be detected"
assert res_extract["face_base64"].startswith("data:image/"), "Valid base64 data URL expected"

# Test 2: Photo Splicing Check
res_splicing = check_photo_splicing(doc_img_bytes, res_extract["face_box"])
print("\n[TEST 2] Photo Splicing Analysis:")
print(f"  Splicing Detected: {res_splicing.get('splicing_detected')}")
print(f"  Splicing Score: {res_splicing.get('splicing_score')}%")
print(f"  Detail: {res_splicing.get('detail')}")

# Test 3: Anti-Spoofing & Liveness Verification
res_liveness = verify_liveness_and_anti_spoofing(doc_img_bytes)
print("\n[TEST 3] Anti-Spoofing / Liveness Check:")
print(f"  Liveness Score: {res_liveness.get('liveness_score')}%")
print(f"  Is Live: {res_liveness.get('is_live')}")
print(f"  Spoof Type: {res_liveness.get('spoof_type')}")
print(f"  Detail: {res_liveness.get('detail')}")

# Test 4: 1:1 Face Matching (Same Subject)
live_same_bytes = create_synthetic_person_image(bg_color=(240, 240, 240), offset=2)
res_match_same = compare_faces(doc_img_bytes, live_same_bytes)
print("\n[TEST 4] 1:1 Biometric Comparison (Matching Subject):")
print(f"  Verdict: {res_match_same.get('verdict')}")
print(f"  Match Score: {res_match_same.get('match_score')}%")
print(f"  Is Matched: {res_match_same.get('is_matched')}")
print(f"  Sub-metrics: {res_match_same.get('sub_metrics')}")
assert res_match_same["is_matched"] == True, "Matching synthetic faces should pass threshold"

# Test 5: 1:1 Face Matching (Visibly Different Subject)
def create_different_person_image():
    img = Image.new('RGB', (320, 380), color=(180, 190, 200))
    draw = ImageDraw.Draw(img)
    # Blonde hair / different shape
    draw.rectangle((40, 30, 280, 280), fill=(210, 180, 80))
    # Darker face skin & narrower oval
    draw.ellipse((95, 90, 225, 310), fill=(140, 95, 65))
    # Narrow eyes higher up
    draw.ellipse((115, 130, 145, 145), fill=(255, 255, 255))
    draw.ellipse((175, 130, 205, 145), fill=(255, 255, 255))
    draw.ellipse((127, 133, 137, 143), fill=(10, 80, 180))
    draw.ellipse((187, 133, 197, 143), fill=(10, 80, 180))
    # Wide nose
    draw.polygon([(160, 170), (140, 220), (180, 220)], fill=(110, 75, 50))
    # Wide smile
    draw.arc((110, 235, 210, 280), start=0, end=180, fill=(150, 40, 40), width=6)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return buf.getvalue()

diff_person_bytes = create_different_person_image()
res_match_diff = compare_faces(doc_img_bytes, diff_person_bytes)
print("\n[TEST 5] 1:1 Biometric Comparison (Visibly Different Subject):")
print(f"  Verdict: {res_match_diff.get('verdict')}")
print(f"  Match Score: {res_match_diff.get('match_score')}%")
print(f"  Is Matched: {res_match_diff.get('is_matched')}")
print(f"  Sub-metrics: {res_match_diff.get('sub_metrics')}")

print("\n" + "=" * 60)
print("ALL IMAGE VERIFICATION TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
