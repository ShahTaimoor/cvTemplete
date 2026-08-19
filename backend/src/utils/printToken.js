import jwt from 'jsonwebtoken';

const PRINT_PURPOSE = 'resume-print';

export function createPrintToken(userId, resumeId) {
  return jwt.sign(
    { userId: String(userId), resumeId: String(resumeId), purpose: PRINT_PURPOSE },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyPrintToken(token, resumeId) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== PRINT_PURPOSE) {
    throw new Error('Invalid print token');
  }
  if (String(decoded.resumeId) !== String(resumeId)) {
    throw new Error('Print token does not match resume');
  }
  return decoded;
}

// Mirrors the resume pair above exactly, just namespaced to its own purpose
// string and field name — kept as separate sibling functions (not a shared
// generic implementation) so the resume token pipeline above is untouched.
const COVER_LETTER_PRINT_PURPOSE = 'cover-letter-print';

export function createCoverLetterPrintToken(userId, letterId) {
  return jwt.sign(
    { userId: String(userId), letterId: String(letterId), purpose: COVER_LETTER_PRINT_PURPOSE },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyCoverLetterPrintToken(token, letterId) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== COVER_LETTER_PRINT_PURPOSE) {
    throw new Error('Invalid print token');
  }
  if (String(decoded.letterId) !== String(letterId)) {
    throw new Error('Print token does not match cover letter');
  }
  return decoded;
}
