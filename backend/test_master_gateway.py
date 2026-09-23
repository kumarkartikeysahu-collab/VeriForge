"""
Direct Function Integration Test for Upgraded SENTINEL-ID Endpoints
Tests async endpoint handlers with real document inputs without external HTTP clients.
"""

import io
import asyncio
from PIL import Image, ImageDraw
from fastapi import UploadFile

from main import (
    health_check,
    edge_benchmark,
    screen_document,
    generate_tampered_sample,
    get_forensic_report,
    ForensicReportRequest
)

print("=" * 70)
print("TESTING SENTINEL-ID MASTER GATEWAY ENDPOINT HANDLERS")
print("=" * 70)

def create_test_passport():
    img = Image.new('RGB', (640, 420), color=(250, 252, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 640, 50), fill=(20, 40, 85))
    draw.text((20, 16), "REPUBLIC OF INDIA / PASSPORT", fill=(255, 255, 255))
    
    # Portrait
    draw.rectangle((30, 80, 180, 260), fill=(215, 220, 230), outline=(80, 80, 80), width=2)
    draw.ellipse((55, 105, 155, 225), fill=(235, 195, 165))
    
    # Fields
    draw.text((210, 90), "SURNAME: MALHOTRA", fill=(10, 10, 10))
    draw.text((210, 130), "GIVEN NAME: ROHAN", fill=(10, 10, 10))
    draw.text((210, 170), "DOB: 21/05/1996", fill=(10, 10, 10))
    draw.text((210, 210), "PASSPORT NO: L8374619", fill=(10, 10, 10))
    
    # MRZ
    draw.rectangle((10, 330, 630, 410), fill=(240, 242, 248))
    draw.text((20, 340), "P<INDMALHOTRA<<ROHAN<<<<<<<<<<<<<<<<<<<<<<<<", fill=(10, 10, 10))
    draw.text((20, 370), "L8374619<5IND9605213M3605200<<<<<<<<<<<<<<00", fill=(10, 10, 10))

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return buf.getvalue()

passport_bytes = create_test_passport()

async def run_integration_tests():
    # 1. Health
    print("\n[1/5] Testing health_check() ...")
    h_res = health_check()
    print("  Status:", h_res.get("status"))
    print("  Mode:", h_res.get("mode"))
    assert h_res.get("status") == "HEALTHY"

    # 2. Edge Benchmark
    print("\n[2/5] Testing edge_benchmark() ...")
    b_res = edge_benchmark()
    print("  Offline Mode:", b_res.get("offline_mode"))
    print("  Quantization:", b_res.get("quantization_format"))
    assert b_res.get("offline_mode") == True

    # 3. Master Screening Gateway: screen_document
    print("\n[3/5] Testing screen_document() ...")
    upload_file = UploadFile(
        file=io.BytesIO(passport_bytes),
        filename="test_passport.jpg"
    )
    screen_json = await screen_document(
        file=upload_file,
        category="Passport",
        mrz_line1="P<INDMALHOTRA<<ROHAN<<<<<<<<<<<<<<<<<<<<<<<<",
        mrz_line2="L8374619<5IND9605213M3605200<<<<<<<<<<<<<<00"
    )
    print("  Document Valid:", screen_json.get("is_valid_document"))
    print("  Category Detected:", screen_json.get("category"))
    print("  Threat Score:", screen_json.get("threat_score"), "%")
    print("  Verdict:", screen_json.get("verdict"))
    print("  Edge Latency:", screen_json.get("edge_benchmark", {}).get("total_latency_ms"), "ms")
    print("  SLA Achieved (<1.5s):", screen_json.get("edge_benchmark", {}).get("sla_achieved"))
    print("  DTD Tamper Score:", screen_json.get("dtd_analysis", {}).get("tamper_score"), "%")
    print("  Screen Replay Attack:", screen_json.get("screen_recapture", {}).get("presentation_attack_detected"))
    print("  Evidentiary Findings:", len(screen_json.get("evidentiary_sheet", {}).get("evidentiary_findings", [])))
    assert screen_json.get("is_valid_document") == True

    # 4. Synthetic Tamper Generator: generate_tampered_sample
    print("\n[4/5] Testing generate_tampered_sample() ...")
    aug_upload = UploadFile(
        file=io.BytesIO(passport_bytes),
        filename="test_passport.jpg"
    )
    aug_json = await generate_tampered_sample(
        file=aug_upload,
        attack_type="POISSON_PHOTO_SWAP",
        apply_compression=True
    )
    print("  Attacks Applied:", aug_json.get("attacks_applied"))
    print("  Data URL Generated:", bool(aug_json.get("tampered_image_data_url")))
    assert "tampered_image_data_url" in aug_json

    # 5. Court-Admissible Forensic Evidentiary Dossier: get_forensic_report
    print("\n[5/5] Testing get_forensic_report() ...")
    req = ForensicReportRequest(document_data=screen_json)
    report_json = await get_forensic_report(req)
    print("  Certificate ID:", report_json.get("certificate_id"))
    print("  Determination:", report_json.get("determination"))
    print("  Compliance Items:", len(report_json.get("compliance_matrix", [])))
    assert "certificate_id" in report_json

    print("\n" + "=" * 70)
    print("ALL 5 MASTER GATEWAY HANDLERS VERIFIED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_integration_tests())
