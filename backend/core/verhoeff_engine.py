"""
UIDAI Verhoeff Checksum Validation Engine
Implements the Dihedral Group D5 checksum used for Indian 12-digit Aadhaar numbers.
"""

import re
from typing import Dict, Any

# Multiplication table d
_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

# Permutation table p
_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

# Inverse table
_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def validate_verhoeff(aadhaar_str: str) -> bool:
    """
    Validates 12-digit Aadhaar number using Verhoeff algorithm.
    Returns True if valid, False otherwise.
    """
    digits = [int(c) for c in re.sub(r'\D', '', str(aadhaar_str))]
    if len(digits) != 12:
        return False
    # Numbers starting with 0 or 1 are invalid in Aadhaar architecture
    if digits[0] in [0, 1]:
        return False
    
    c = 0
    for i, item in enumerate(reversed(digits)):
        c = _D[c][_P[i % 8][item]]
    return c == 0

def validate_aadhaar_card(doc_number: str) -> Dict[str, Any]:
    """
    Detailed Aadhaar validation payload.
    """
    clean_num = re.sub(r'\D', '', str(doc_number or ''))
    has_12_digits = len(clean_num) == 12
    valid_prefix = has_12_digits and clean_num[0] not in ['0', '1']
    verhoeff_passed = validate_verhoeff(clean_num) if has_12_digits else False

    formatted = f"{clean_num[0:4]} {clean_num[4:8]} {clean_num[8:12]}" if has_12_digits else doc_number

    return {
        "valid": verhoeff_passed,
        "aadhaar_number": formatted,
        "has_12_digits": has_12_digits,
        "valid_prefix": valid_prefix,
        "verhoeff_checksum": verhoeff_passed,
        "masked_format": f"XXXX XXXX {clean_num[-4:]}" if has_12_digits else "N/A"
    }
