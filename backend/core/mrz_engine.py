"""
ICAO 9303 MRZ Check-Digit Validation Engine
Implements Modulo-10 with weight factor (7, 3, 1) algorithm.
"""

def get_char_value(char: str) -> int:
    if not char:
        return 0
    char = char.upper()
    if '0' <= char <= '9':
        return int(char)
    if 'A' <= char <= 'Z':
        return ord(char) - 55
    return 0  # '<' filler counts as 0

def calculate_check_digit(data_str: str) -> str:
    weights = [7, 3, 1]
    total = 0
    for i, char in enumerate(data_str):
        val = get_char_value(char)
        weight = weights[i % 3]
        total += val * weight
    return str(total % 10)

def validate_td3_passport(line1: str, line2: str) -> dict:
    """
    Validates a standard 2-line TD3 Passport MRZ string (44 characters per line).
    """
    if len(line2) < 44:
        return {
            "valid": False,
            "error": "Line 2 must contain 44 characters according to ICAO Doc 9303."
        }

    doc_num = line2[0:9]
    doc_check = line2[9]
    calc_doc_check = calculate_check_digit(doc_num)

    dob = line2[13:19]
    dob_check = line2[19]
    calc_dob_check = calculate_check_digit(dob)

    expiry = line2[21:27]
    expiry_check = line2[27]
    calc_expiry_check = calculate_check_digit(expiry)

    personal_num = line2[28:42]
    personal_check = line2[42]
    calc_personal_check = calculate_check_digit(personal_num)

    composite_str = doc_num + doc_check + dob + dob_check + expiry + expiry_check + personal_num + personal_check
    composite_check = line2[43]
    calc_composite_check = calculate_check_digit(composite_str)

    is_valid = (
        doc_check == calc_doc_check and
        dob_check == calc_dob_check and
        expiry_check == calc_expiry_check and
        composite_check == calc_composite_check
    )

    return {
        "valid": is_valid,
        "fields": {
            "document_number": {"value": doc_num.replace("<", ""), "expected": doc_check, "calculated": calc_doc_check, "valid": doc_check == calc_doc_check},
            "dob": {"value": dob, "expected": dob_check, "calculated": calc_dob_check, "valid": dob_check == calc_dob_check},
            "expiry": {"value": expiry, "expected": expiry_check, "calculated": calc_expiry_check, "valid": expiry_check == calc_expiry_check},
            "composite": {"expected": composite_check, "calculated": calc_composite_check, "valid": composite_check == calc_composite_check}
        }
    }
