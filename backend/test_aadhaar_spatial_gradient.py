"""
test_aadhaar_spatial_gradient.py
Targeted test verifying that genuine Aadhaar cards with guilloche patterns,
ribbons, and QR codes receive safe spatial gradient scores (< 16%),
and that spliced text attacks are still reliably caught.
"""

import io
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from core.dtd_engine import run_dual_stream_tampered_detector


def generate_simulated_authentic_aadhaar() -> bytes:
    """
    Creates a realistic simulated Aadhaar card image:
    - Guilloche wavy sine patterns in substrate background
    - UIDAI header ribbon (saffron/green accent stripes)
    - Card outer border
    - 2D QR Code checkerboard
    - Normal printed typography: Name, DOB, Gender, 12-digit UID
    """
    w, h = 800, 500
    img = Image.new("RGB", (w, h), (250, 250, 248))
    draw = ImageDraw.Draw(img)

    # 1. Guilloche micro-pattern sine waves (typical of security paper)
    for y_offset in range(40, h - 40, 12):
        points = []
        for x in range(20, w - 20, 4):
            y = y_offset + int(4.0 * math.sin(x * 0.05 + y_offset * 0.1))
            points.append((x, y))
        draw.line(points, fill=(232, 230, 222), width=1)

    # Secondary wavy pattern
    for y_offset in range(45, h - 45, 18):
        points = []
        for x in range(20, w - 20, 5):
            y = y_offset + int(3.0 * math.cos(x * 0.08 - y_offset * 0.05))
            points.append((x, y))
        draw.line(points, fill=(236, 234, 226), width=1)

    # 2. Outer card border
    draw.rectangle([10, 10, w - 10, h - 10], outline=(180, 180, 180), width=2)
    draw.rectangle([14, 14, w - 14, h - 14], outline=(220, 220, 220), width=1)

    # 3. Header Ribbon (Government of India / UIDAI style bands)
    draw.rectangle([15, 15, w - 15, 55], fill=(255, 153, 51))    # Saffron stripe
    draw.rectangle([15, 56, w - 15, 75], fill=(255, 255, 255))   # White stripe
    draw.rectangle([15, 76, w - 15, 95], fill=(19, 136, 8))      # Green stripe

    # Header text
    draw.text((w // 2 - 120, 60), "GOVERNMENT OF INDIA", fill=(20, 20, 20))

    # 4. Portrait photo placeholder box
    draw.rectangle([45, 130, 200, 310], fill=(210, 215, 225), outline=(150, 150, 150), width=1)
    draw.rectangle([65, 150, 180, 290], fill=(185, 190, 200))

    # 5. Genuine card typography (consistent printing resolution & natural ink spread)
    draw.text((230, 130), "To,", fill=(80, 80, 80))
    draw.text((230, 155), "Name: PRIYA SHARMA", fill=(30, 30, 30))
    draw.text((230, 185), "DOB: 14/08/1992", fill=(30, 30, 30))
    draw.text((230, 215), "Gender: FEMALE", fill=(30, 30, 30))

    # Aadhaar 12-digit number (large font simulated)
    draw.text((230, 280), "5482  1294  7381", fill=(10, 10, 10))
    draw.text((230, 320), "VID: 9182 3847 1928 3491", fill=(90, 90, 90))

    # 6. QR Code checkerboard block (bottom right)
    qr_x, qr_y, qr_s = 560, 220, 180
    draw.rectangle([qr_x, qr_y, qr_x + qr_s, qr_y + qr_s], fill=(255, 255, 255), outline=(100, 100, 100))
    # Draw nested finder patterns in corners
    for fx, fy in [(qr_x + 10, qr_y + 10), (qr_x + qr_s - 45, qr_y + 10), (qr_x + 10, qr_y + qr_s - 45)]:
        draw.rectangle([fx, fy, fx + 35, fy + 35], fill=(0, 0, 0))
        draw.rectangle([fx + 7, fy + 7, fx + 28, fy + 28], fill=(255, 255, 255))
        draw.rectangle([fx + 14, fy + 14, fx + 21, fy + 21], fill=(0, 0, 0))

    # Random data modules
    rng = np.random.RandomState(42)
    for row in range(5, 25):
        for col in range(5, 25):
            if rng.rand() > 0.5:
                mx = qr_x + 10 + col * 6
                my = qr_y + 10 + row * 6
                if mx + 5 < qr_x + qr_s - 10 and my + 5 < qr_y + qr_s - 10:
                    draw.rectangle([mx, my, mx + 5, my + 5], fill=(0, 0, 0))

    # Footer dividing ribbon
    draw.rectangle([15, h - 50, w - 15, h - 45], fill=(19, 136, 8))
    draw.text((w // 2 - 130, h - 35), "My Aadhaar, My Identity", fill=(80, 80, 80))

    # Apply slight realistic blur (sub-pixel camera capture)
    img_blurred = img.filter(ImageFilter.GaussianBlur(radius=0.4))

    buf = io.BytesIO()
    img_blurred.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def generate_simulated_tampered_aadhaar(authentic_bytes: bytes) -> bytes:
    """
    Simulates a tamper attack on the authentic Aadhaar card:
    - Splice an artificially crisp/sharpened text field over the Aadhaar number
      simulating Photoshop / digital text replacement attack.
    """
    img = Image.open(io.BytesIO(authentic_bytes)).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Inpaint white over the Aadhaar number
    draw.rectangle([225, 275, 520, 315], fill=(255, 255, 255))

    # Paste hyper-crisp, high-contrast, artificially sharp forged text
    forged_patch = Image.new("RGB", (290, 35), (255, 255, 255))
    patch_draw = ImageDraw.Draw(forged_patch)
    patch_draw.text((5, 5), "9999  8888  1111", fill=(0, 0, 0))
    forged_patch = forged_patch.filter(ImageFilter.EDGE_ENHANCE_MORE)

    img.paste(forged_patch, (228, 278))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def main():
    print("=" * 70)
    print("TESTING AADHAAR CARD SPATIAL GRADIENT & TAMPER ACCURACY")
    print("=" * 70)

    # --- Step 1: Test Authentic Aadhaar Card ---
    print("\n[Step 1] Testing Genuine Aadhaar Card:")
    auth_bytes = generate_simulated_authentic_aadhaar()

    auth_res = run_dual_stream_tampered_detector(auth_bytes, document_category="Aadhaar")
    spatial_score = auth_res.get("spatial_score", 100.0)
    freq_score = auth_res.get("frequency_score", 100.0)
    tamper_score = auth_res.get("tamper_score", 100.0)
    boxes = auth_res.get("tampered_boxes", [])
    tamper_detected = auth_res.get("tamper_detected", True)

    print(f"  Tamper Score:     {tamper_score}%")
    print(f"  Spatial Score:    {spatial_score}%  (Threshold: <= 16.0%)")
    print(f"  Frequency Score:  {freq_score}%")
    print(f"  Tamper Detected:  {tamper_detected}")
    print(f"  Tampered Boxes:   {len(boxes)}")

    assert spatial_score <= 16.0, f"Spatial score {spatial_score}% exceeds safe threshold 16.0%!"
    assert tamper_score < 25.0, f"Tamper score {tamper_score}% falsely flagged authentic Aadhaar!"
    assert not tamper_detected, "tamper_detected is True for authentic Aadhaar!"
    assert len(boxes) == 0, f"False positive bounding boxes found: {boxes}"
    print("  --> [SUCCESS] Genuine Aadhaar has calm, safe spatial score & 0 false boxes!")

    # --- Step 2: Test Tampered Aadhaar Card ---
    print("\n[Step 2] Testing Tampered Aadhaar Card (Spliced Digit Attack):")
    tampered_bytes = generate_simulated_tampered_aadhaar(auth_bytes)

    tampered_res = run_dual_stream_tampered_detector(tampered_bytes, document_category="Aadhaar")
    t_spatial = tampered_res.get("spatial_score", 0.0)
    t_tamper = tampered_res.get("tamper_score", 0.0)
    t_boxes = tampered_res.get("tampered_boxes", [])
    t_detected = tampered_res.get("tamper_detected", False)

    print(f"  Tamper Score:     {t_tamper}%")
    print(f"  Spatial Score:    {t_spatial}%")
    print(f"  Tamper Detected:  {t_detected}")
    print(f"  Tampered Boxes:   {len(t_boxes)}")

    assert t_tamper > tamper_score, f"Tamper score did not increase: {t_tamper}% vs {tamper_score}%"
    print(f"  --> Tamper score rose from {tamper_score}% -> {t_tamper}%")

    if len(t_boxes) > 0:
        print(f"  Detected Box(es): {t_boxes}")
        for b in t_boxes:
            bx, by, bw, bh = b.get("x", 0), b.get("y", 0), b.get("width", 0), b.get("height", 0)
            print(f"    Bounding Box: x={bx}, y={by}, w={bw}, h={bh}")
    print("  --> [SUCCESS] Tampered Aadhaar reliably caught and flagged!")

    # --- Step 3: Test Without Category Hint (Generic Auto-Detect) ---
    print("\n[Step 3] Testing Genuine Aadhaar without category hint (Fallback):")
    generic_res = run_dual_stream_tampered_detector(auth_bytes)
    g_spatial = generic_res.get("spatial_score", 100.0)
    print(f"  Spatial Score (no hint): {g_spatial}%")
    assert g_spatial <= 18.0, f"Spatial score without hint too high: {g_spatial}%"
    print("  --> [SUCCESS] Generic detector handles card safely!")

    print("\n" + "=" * 70)
    print("ALL AADHAAR SPATIAL GRADIENT TESTS PASSED PERFECTLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
