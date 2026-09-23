"""
Election Commission of India (ECI) Voter ID / EPIC Validation Engine
Validates standard 10-character alphanumeric EPIC numbers (3-letter constituency prefix + 7 sequential digits)
and legacy state ledger notations.
"""

import re
from typing import Dict, Any

def validate_epic_number(epic_str: str) -> Dict[str, Any]:
    """
    Validates ECI EPIC (Elector's Photo Identity Card) number.
    Format: 3 letters + 7 digits (e.g., ABC1234567, WBF1234567)
    """
    if not epic_str:
        return {
            "valid": False,
            "epic_number": "NOT DETECTED",
            "masked_format": "N/A",
            "has_10_chars": False,
            "standard": "ECI Standard (3-Alpha + 7-Digit)",
            "issuing_authority": "Election Commission of India",
            "reason": "No EPIC number provided."
        }

    clean = re.sub(r'[\s-]', '', str(epic_str)).upper()

    # Standard ECI 10-character format: 3 uppercase letters followed by 7 digits
    if re.match(r'^[A-Z]{3}[0-9]{7}$', clean):
        masked = f"{clean[:3]}****{clean[-3:]}"
        formatted = f"{clean[:3]} {clean[3:]}"
        return {
            "valid": True,
            "epic_number": formatted,
            "raw_epic": clean,
            "masked_format": masked,
            "has_10_chars": True,
            "standard": "ECI Standard (3-Alpha + 7-Digit)",
            "issuing_authority": "Election Commission of India",
            "reason": "Valid ECI 10-character EPIC format verified."
        }

    # Legacy state constituency format (e.g. WB/01/023/123456 or DL/02/123456)
    if re.match(r'^[A-Z]{2,3}/[0-9/]{6,16}$', clean):
        return {
            "valid": True,
            "epic_number": clean,
            "raw_epic": clean,
            "masked_format": clean[:4] + "****" + clean[-3:],
            "has_10_chars": False,
            "standard": "Legacy State Electoral Ledger Format",
            "issuing_authority": "State Election Commission",
            "reason": "Valid Legacy State Electoral Roll format verified."
        }

    return {
        "valid": False,
        "epic_number": clean,
        "raw_epic": clean,
        "masked_format": "N/A",
        "has_10_chars": len(clean) == 10,
        "standard": "ECI Standard (3-Alpha + 7-Digit)",
        "issuing_authority": "Election Commission of India",
        "reason": "Non-standard EPIC format. Expected 3 letters followed by 7 digits (e.g. ABC1234567)."
    }
