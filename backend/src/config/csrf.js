import { doubleCsrf } from 'csrf-csrf';

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  // No server-side session store exists (auth is a stateless JWT cookie) —
  // a constant identifier keeps the token's HMAC message stable across the
  // login transition. If this were instead tied to e.g. the JWT cookie's
  // value, a CSRF token issued to an anonymous visitor (on the login page)
  // would stop validating the instant they log in and that cookie appears,
  // since the HMAC message would change out from under it. Security still
  // holds without per-session binding: a cross-origin attacker can't read
  // this cookie to relay its value in a header, and can't forge the HMAC
  // without CSRF_SECRET.
  getSessionIdentifier: () => 'csrf',
  cookieName: 'csrf-token',
  cookieOptions: {
    // 'lax' cookies aren't sent on cross-site fetch/XHR at all, which is
    // invisible in local dev (Vite's proxy makes frontend+backend look
    // same-origin) but breaks every write request once they're on separate
    // real domains in production. 'none' is required for a genuinely
    // cross-origin cookie to be sent back — browsers only accept
    // SameSite=None paired with Secure, which is exactly what `secure`
    // below already evaluates to in production.
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    // Must be JS-readable — the frontend reads this cookie directly and
    // echoes its value back as the x-csrf-token header (double-submit).
    httpOnly: false,
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
});
