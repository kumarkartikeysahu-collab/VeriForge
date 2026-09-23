/**
 * UIDAI Verhoeff Checksum Validator (Dihedral Group D5)
 * Standard for Indian 12-digit Aadhaar validation
 */

const _D = [
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
];

const _P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

export const validateVerhoeff = (numStr) => {
  if (!numStr) return false;
  const clean = String(numStr).replace(/\D/g, '');
  if (clean.length !== 12) return false;
  if (clean[0] === '0' || clean[0] === '1') return false;

  let c = 0;
  const digits = clean.split('').map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = _D[c][_P[i % 8][digits[i]]];
  }
  return c === 0;
};

export const getAadhaarDetails = (numStr) => {
  const clean = String(numStr || '').replace(/\D/g, '');
  const has12 = clean.length === 12;
  const validPrefix = has12 && clean[0] !== '0' && clean[0] !== '1';
  const isValid = has12 && validPrefix && validateVerhoeff(clean);

  return {
    isValid,
    has12Digits: has12,
    validPrefix,
    verhoeffPassed: isValid,
    formatted: has12 ? `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}` : (numStr || 'N/A'),
    masked: has12 ? `XXXX XXXX ${clean.slice(8, 12)}` : 'XXXX XXXX [MASKED]'
  };
};
