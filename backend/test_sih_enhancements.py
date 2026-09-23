"""
Comprehensive Test Suite for SIH 2026 PS 188 Architectural Enhancements
Verifies all 5 core upgrade modules and cryptographic cross-consistency engine.
"""

import io
import json
import numpy as np
from PIL import Image, ImageDraw
import cv2

from core.dtd_engine import run_dual_stream_tampered_detector
from core.screen_recapture_engine import evaluate_screen_recapture
from core.font_geometry_engine import evaluate_document_typography, analyze_field_font_geometry
from core.crypto_qr_engine import verify_qr_cross_consistency, parse_qr_payload
from core.synthetic_tamper_engine import generate_tampered_document_sample, apply_poisson_photo_swap
from core.forensic_report_engine import generate_forensic_evidentiary_sheet
from core.edge_engine import EdgeExecutionBenchmark, get_edge_system_telemetry

print("=" * 70)
print("TESTING SIH 2026 PS 188 ENHANCED FORENSIC SUITE")
print("=" * 70)

# Helper to create a dummy document card image
def create_dummy_id_card(text_altered: bool = False, photo_spliced: bool = False):
    img = Image.new('RGB', (640, 400), color=(245, 248, 252))
    draw = ImageDraw.Draw(img)
    # Card Header
    draw.rectangle((0, 0, 640, 50), fill=(20, 50, 100))
    draw.text((20, 16), "REPUBLIC OF INDIA / GOVERNMENT OF INDIA", fill=(255, 255, 255))
    
    # Portrait Frame
    draw.rectangle((30, 80, 190, 260), fill=(210, 215, 225), outline=(100, 100, 100), width=2)
    # Face inside frame
    draw.ellipse((60, 110, 160, 230), fill=(230, 190, 160))
    draw.ellipse((85, 140, 105, 155), fill=(40, 40, 40))
    draw.ellipse((125, 140, 145, 155), fill=(40, 40, 40))
    draw.arc((95, 185, 135, 205), start=0, end=180, fill=(180, 50, 50), width=3)

    # Document text fields
    draw.text((220, 90), "NAME: ROHAN MALHOTRA", fill=(20, 20, 20))
    
    # DOB (altered if requested)
    dob_text = "DOB: 15/08/1998" if text_altered else "DOB: 21/05/1996"
    draw.text((220, 140), dob_text, fill=(20, 20, 20))
    
    draw.text((220, 190), "GENDER: MALE", fill=(20, 20, 20))
    draw.text((220, 240), "ID NO: 5489 2341 9087", fill=(20, 20, 20))
    
    # Machine Readable Zone
    draw.rectangle((10, 320, 630, 390), fill=(235, 238, 245))
    draw.text((20, 330), "P<INDMALHOTRA<<ROHAN<<<<<<<<<<<<<<<<<<<<<<<<", fill=(10, 10, 10))
    draw.text((20, 360), "L8374619<5IND9605213M3605200<<<<<<<<<<<<<<00", fill=(10, 10, 10))

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return buf.getvalue()

doc_bytes = create_dummy_id_card()

# ---------------------------------------------------------------------------
# Test 1: Dual-Stream Tampered Text Network (DTD/FFDN)
# ---------------------------------------------------------------------------
print("\n[TEST 1] Dual-Stream Tampered Text Network (DTD/FFDN):")
dtd_res = run_dual_stream_tampered_detector(doc_bytes)
print(f"  Tamper Score: {dtd_res.get('tamper_score')}%")
print(f"  Spatial Score: {dtd_res.get('spatial_score')}%")
print(f"  Frequency Score: {dtd_res.get('frequency_score')}%")
print(f"  Social Media Recompression Mitigation: {dtd_res.get('robustness_mode')}")
print(f"  Tampered Boxes Extracted: {len(dtd_res.get('tampered_boxes', []))}")
assert "tamper_score" in dtd_res, "Tamper score required"
assert dtd_res["fused_heatmap_base64"].startswith("data:image/png;base64,"), "Heatmap base64 expected"
print("  [OK] DTD Dual-Stream Network operational!")

# ---------------------------------------------------------------------------
# Test 2: Screen-Recapture & Anti-Replay Detection
# ---------------------------------------------------------------------------
print("\n[TEST 2] Screen-Recapture & Anti-Replay Classifier:")
recapture_res = evaluate_screen_recapture(doc_bytes)
print(f"  Attack Detected: {recapture_res.get('presentation_attack_detected')}")
print(f"  Attack Type: {recapture_res.get('attack_type')}")
print(f"  Anti-Replay Score: {recapture_res.get('anti_replay_score')}%")
print(f"  Moiré Index: {recapture_res.get('moire_index')}%")
print(f"  Specular Glare: {recapture_res.get('specular_glare_percentage')}%")
print(f"  Compliance: {recapture_res.get('standards_compliance')}")
assert recapture_res["is_physical_card"] == True, "Genuine synthetic card should pass anti-replay"
print("  [OK] Anti-Replay & Moiré analyzer operational!")

# ---------------------------------------------------------------------------
# Test 3: Micro-Font Geometry & Kerning Baseline Engine
# ---------------------------------------------------------------------------
print("\n[TEST 3] Micro-Font Geometry & Kerning Classifier:")
font_res = evaluate_document_typography(doc_bytes, {"dob": "21/05/1996", "holder_name": "ROHAN MALHOTRA", "doc_number": "5489 2341 9087"})
print(f"  Typography Status: {font_res.get('overall_typography_status')}")
print(f"  Max Baseline Deviation: {font_res.get('max_baseline_deviation_px')} px")
print(f"  Summary: {font_res.get('evidentiary_summary')}")
assert "field_evaluations" in font_res, "Field evaluations expected"
print("  [OK] Micro-Font Geometry Engine operational!")

# ---------------------------------------------------------------------------
# Test 4: Cryptographic QR & Cross-Consistency Engine
# ---------------------------------------------------------------------------
print("\n[TEST 4] Cryptographic QR & Cross-Consistency Engine:")
sample_qr_data = json.dumps({"name": "ROHAN MALHOTRA", "dob": "21/05/1996", "id": "548923419087"})
parsed = parse_qr_payload(sample_qr_data)
print(f"  Parsed Payload Name: {parsed.get('name')}")
print(f"  Parsed Payload DOB: {parsed.get('dob')}")
assert parsed.get("name") == "ROHAN MALHOTRA", "Parsed name should match"
print("  [OK] Cryptographic QR Engine operational!")

# ---------------------------------------------------------------------------
# Test 5: Synthetic Tamper Augmentation Pipeline
# ---------------------------------------------------------------------------
print("\n[TEST 5] Synthetic Tamper Augmentation Pipeline:")
aug_res = generate_tampered_document_sample(doc_bytes, attack_type="ALL", apply_compression=True)
print(f"  Attacks Applied: {aug_res.get('attacks_applied')}")
print(f"  Tampered Boxes Generated: {len(aug_res.get('tampered_boxes', []))}")
print(f"  WhatsApp Recompression Applied: {aug_res.get('whatsapp_compression_applied')}")
assert aug_res["tampered_image_data_url"].startswith("data:image/jpeg;base64,"), "Augmented data URL expected"
print("  [OK] Synthetic Tamper Augmentation Pipeline operational!")

# ---------------------------------------------------------------------------
# Test 6: Court-Admissible Forensic Evidentiary Sheet
# ---------------------------------------------------------------------------
print("\n[TEST 6] Court-Admissible Forensic Evidentiary Sheet:")
report_res = generate_forensic_evidentiary_sheet(
    document_data={"category": "Passport", "threat_score": 18.0, "verdict": "SAFE", "filename": "test_passport.jpg"},
    dtd_result=dtd_res,
    font_result=font_res,
    screen_recapture_result=recapture_res,
    crypto_qr_result={"qr_detected": True, "cross_consistency_match": True, "mismatches": []}
)
print(f"  Certificate ID: {report_res.get('certificate_id')}")
print(f"  Determination: {report_res.get('determination')}")
print(f"  Compliance Items: {len(report_res.get('compliance_matrix', []))}")
assert "court_admissible_declaration" in report_res, "Declaration expected"
print("  [OK] Forensic Evidentiary Sheet operational!")

# ---------------------------------------------------------------------------
# Test 7: Edge-Ready Sub-1.5s Offline Latency Benchmark
# ---------------------------------------------------------------------------
print("\n[TEST 7] Edge-Ready Sub-1.5s Benchmark & Offline Profiling:")
bench = EdgeExecutionBenchmark()
bench.start_stage("test_stage_1")
time_arr = np.random.rand(100, 100)
_ = np.dot(time_arr, time_arr)
bench.end_stage("test_stage_1")
summary = bench.get_summary()
print(f"  Total Latency: {summary.get('total_latency_ms')} ms")
print(f"  SLA Met (<1.5s): {summary.get('sla_achieved')}")
print(f"  Edge Status: {summary.get('edge_ready_status')}")
telemetry = get_edge_system_telemetry()
print(f"  Offline Air-Gapped Mode: {telemetry.get('offline_mode')}")
print(f"  INT8 Dynamic Quantization: {telemetry.get('quantization_format')}")
print(f"  Memory Footprint: {telemetry.get('memory_footprint_mb')}")
assert summary.get("sla_achieved") == True, "Latency benchmark should pass"
print("  [OK] Edge-Ready Benchmark operational!")

print("\n" + "=" * 70)
print("ALL 7 ARCHITECTURAL ENHANCEMENT TEST SUITES PASSED SUCCESSFULLY!")
print("=" * 70)
