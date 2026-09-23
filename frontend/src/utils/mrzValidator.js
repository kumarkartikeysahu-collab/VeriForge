/**
 * ICAO Doc 9303 Machine Readable Zone (MRZ) Checksum Validator
 * Standard: Modulo-10 with weight factor (7, 3, 1, 7, 3, 1...)
 * Supports TD3 Passport (2x44), MRV-A Visa (2x44), and MRV-B Visa (2x36).
 */

export const getCharValue = (char) => {
  if (!char) return 0;
  const upper = char.toUpperCase();
  if (upper >= '0' && upper <= '9') {
    return parseInt(upper, 10);
  }
  if (upper >= 'A' && upper <= 'Z') {
    return upper.charCodeAt(0) - 55; // 'A' is 65 -> 10
  }
  return 0; // '<' filler or others count as 0
};

export const calculateCheckDigit = (str) => {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const val = getCharValue(str[i]);
    const weight = weights[i % 3];
    sum += val * weight;
  }
  return (sum % 10).toString();
};

/**
 * Validates a 2-line ICAO Doc 9303 MRZ (TD3 44-chars or MRV-B 36-chars)
 */
export const validatePassportMRZ = (line1, line2) => {
  if (!line2 || line2.length < 36) {
    return {
      isValid: false,
      error: 'Line 2 must contain at least 36 characters (MRV-B) or 44 characters (TD3).',
      fields: {}
    };
  }

  const isTD3 = line2.length >= 44;

  const docNumberStr = line2.substring(0, 9);
  const docNumberCheck = line2.substring(9, 10);
  const calculatedDocCheck = calculateCheckDigit(docNumberStr);

  const dobStr = line2.substring(13, 19);
  const dobCheck = line2.substring(19, 20);
  const calculatedDobCheck = calculateCheckDigit(dobStr);

  const expStr = line2.substring(21, 27);
  const expCheck = line2.substring(27, 28);
  const calculatedExpCheck = calculateCheckDigit(expStr);

  let personalStr = '';
  let personalCheck = '';
  let calculatedPersonalCheck = '';
  let compositeCheck = '';
  let calculatedCompositeCheck = '';
  let compositeValid = true;

  if (isTD3) {
    personalStr = line2.substring(28, 42);
    personalCheck = line2.substring(42, 43);
    calculatedPersonalCheck = calculateCheckDigit(personalStr);

    const compositeSource = docNumberStr + docNumberCheck + dobStr + dobCheck + expStr + expCheck + personalStr + personalCheck;
    compositeCheck = line2.substring(43, 44);
    calculatedCompositeCheck = calculateCheckDigit(compositeSource);
    compositeValid = compositeCheck === calculatedCompositeCheck;
  }

  const docValid = docNumberCheck === calculatedDocCheck;
  const dobValid = dobCheck === calculatedDobCheck;
  const expValid = expCheck === calculatedExpCheck;

  const allValid = docValid && dobValid && expValid && compositeValid;

  return {
    isValid: allValid,
    standard: isTD3 ? 'ICAO TD3 / MRV-A (44-char)' : 'ICAO MRV-B (36-char)',
    fields: {
      docNumber: {
        value: docNumberStr.replace(/</g, ''),
        expectedCheck: docNumberCheck,
        calculatedCheck: calculatedDocCheck,
        isValid: docValid
      },
      dob: {
        value: dobStr,
        expectedCheck: dobCheck,
        calculatedCheck: calculatedDobCheck,
        isValid: dobValid
      },
      expiry: {
        value: expStr,
        expectedCheck: expCheck,
        calculatedCheck: calculatedExpCheck,
        isValid: expValid
      },
      ...(isTD3 ? {
        composite: {
          expectedCheck: compositeCheck,
          calculatedCheck: calculatedCompositeCheck,
          isValid: compositeValid
        }
      } : {})
    }
  };
};
