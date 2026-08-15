import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { TOKEN_COOKIE_NAME } from '../utils/tokenCookie.js';

export const protect = async (req, res, next) => {
  const token = req.cookies?.[TOKEN_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.[TOKEN_COOKIE_NAME];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      /* ignore */
    }
  }
  next();
};
