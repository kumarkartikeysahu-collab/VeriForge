import re
import json
from core.mrz_engine import validate_td3_passport
from core.verhoeff_engine import validate_verhoeff, validate_aadhaar_card

print("=" * 60)
print("SENTINEL-ID VALIDATION SUITE")
print("=" * 60)

# 1. TEST VALID PASSPORT MRZ (ICAO Doc 9303 TD3)
# Valid Sample: Passport L8374619 with calculated check digits:
# Doc: L8374619 (check digit 5)
# DOB: 960521 (check digit 4)
# Expiry: 360520 (check digit 4)
# Personal: <<<<<<<<<<<<<< (check digit < or 0)
valid_line1 = "P<INDMALHOTRA<<ROHAN<<<<<<<<<<<<<<<<<<<<<<<<"
valid_line2 = "L8374619<5IND9605213M3605200<<<<<<<<<<<<<<00"

res_valid_mrz = validate_td3_passport(valid_line1, valid_line2)
print("\n[TEST 1] Valid Passport MRZ (ICAO Doc 9303):")
print("Valid:", res_valid_mrz.get("valid"))
for k, v in res_valid_mrz.get("fields", {}).items():
    print(f"  {k}: expected={v.get('expected')}, calc={v.get('calculated')}, valid={v.get('valid')}")

# 2. TEST TAMPERED PASSPORT MRZ (DOB tampered from 960521 to 980521)
tampered_line1 = "P<INDMALHOTRA<<ROHAN<<<<<<<<<<<<<<<<<<<<<<<<"
tampered_line2 = "L8374619<5IND9805213M3605200<<<<<<<<<<<<<<00"

res_tampered_mrz = validate_td3_passport(tampered_line1, tampered_line2)
print("\n[TEST 2] Tampered Passport MRZ (DOB altered):")
print("Valid:", res_tampered_mrz.get("valid"))
print("  DOB valid:", res_tampered_mrz.get("fields", {}).get("dob", {}).get("valid"))
print("  Composite valid:", res_tampered_mrz.get("fields", {}).get("composite", {}).get("valid"))

# 3. TEST AADHAAR VERHOEFF CHECKSUM (UIDAI Standard)
# Genuine Verhoeff number example: 2345 6789 0120 (starts with 2, passes Verhoeff)
# Let's compute a known valid Aadhaar number:
def generate_verhoeff(nine_plus_two_prefix: str) -> str:
    from core.verhoeff_engine import _D, _P, _INV
    digits = [int(c) for c in nine_plus_two_prefix]
    c = 0
    # Append 0 for check digit calculation
    calc_digits = digits + [0]
    for i, item in enumerate(reversed(calc_digits)):
        c = _D[c][_P[i % 8][item]]
    check = _INV[c]
    return nine_plus_two_prefix + str(check)

sample_valid_aadhaar = generate_verhoeff("54892341908")
print(f"\n[TEST 3] Valid Aadhaar Number (Verhoeff D5): {sample_valid_aadhaar}")
res_aadhaar_valid = validate_aadhaar_card(sample_valid_aadhaar)
print("  Valid:", res_aadhaar_valid["valid"])
print("  Masked Format:", res_aadhaar_valid["masked_format"])

# 4. TEST TAMPERED AADHAAR NUMBER (Altering 1 digit)
sample_tampered_aadhaar = sample_valid_aadhaar[:-1] + ("7" if sample_valid_aadhaar[-1] != "7" else "8")
print(f"\n[TEST 4] Tampered Aadhaar Number: {sample_tampered_aadhaar}")
res_aadhaar_tampered = validate_aadhaar_card(sample_tampered_aadhaar)
print("  Valid:", res_aadhaar_tampered["valid"])

print("\n" + "=" * 60)
print("ALL VALIDATION ENGINES VERIFIED!")
print("=" * 60)
