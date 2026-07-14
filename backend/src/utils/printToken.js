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
