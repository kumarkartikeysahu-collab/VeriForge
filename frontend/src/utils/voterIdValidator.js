/**
 * Election Commission of India (ECI) Voter ID / EPIC Validator
 * Supports modern standard TD1-equivalent 10-character alphanumeric EPIC codes:
 * Format: 3 letters + 7 digits (e.g., ABC1234567, WBF1234567, UAN0123456)
 * and legacy state constituency ledger notations.
 */

export const validateEpicNumber = (epicStr) => {
  if (!epicStr) return { isValid: false, formatted: '', reason: 'Empty EPIC number' };

  const clean = String(epicStr).trim().toUpperCase().replace(/[\s-]/g, '');

  // Standard 10-character EPIC format: 3 letters + 7 numbers
  const standardPattern = /^[A-Z]{3}[0-9]{7}$/;
  if (standardPattern.test(clean)) {
    return {
      isValid: true,
      formatted: `${clean.substring(0, 3)} ${clean.substring(3)}`,
      standard: 'ECI Standard (3-Alpha + 7-Digit)',
      authority: 'Election Commission of India'
    };
  }

  // Legacy state format: e.g. WB/01/023/123456 or DL/02/123456
  const legacyPattern = /^[A-Z]{2,3}\/[0-9/]{6,16}$/;
  if (legacyPattern.test(clean)) {
    return {
      isValid: true,
      formatted: clean,
      standard: 'Legacy State Electoral Ledger Format',
      authority: 'State Election Commission'
    };
  }

  return {
    isValid: false,
    formatted: clean,
    reason: 'Non-standard EPIC format. Expected 3 letters followed by 7 digits (e.g. ABC1234567).'
  };
};

export const getVoterIdDetails = (epicStr) => {
  const validation = validateEpicNumber(epicStr);
  return {
    ...validation,
    epicPassed: validation.isValid,
    securityTier: validation.isValid ? 'TIER-1 REGISTERED' : 'UNVERIFIED FORMAT'
  };
};
