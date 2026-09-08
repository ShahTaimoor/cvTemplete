export const TOKEN_COOKIE_NAME = 'token';

const parseDurationMs = (value) => {
  const match = /^(\d+)(s|m|h|d)$/.exec(value || '');
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const [, amount, unit] = match;
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return Number(amount) * multipliers[unit];
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Same cross-origin reasoning as the CSRF cookie (see config/csrf.js):
  // 'lax' is silently never sent back once frontend and backend are on
  // separate real domains in production, which would make login appear to
  // succeed (the Set-Cookie response looks fine) while every subsequent
  // authenticated request is actually anonymous.
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  // Same cross-subdomain reasoning as the CSRF cookie (see config/csrf.js).
  // Kept in sync so clearTokenCookie targets the same cookie it set.
  domain: process.env.COOKIE_DOMAIN || undefined,
  maxAge: parseDurationMs(process.env.JWT_EXPIRES_IN),
});

export const setTokenCookie = (res, token) => {
  res.cookie(TOKEN_COOKIE_NAME, token, cookieOptions());
};

export const clearTokenCookie = (res) => {
  const { maxAge, ...rest } = cookieOptions();
  res.clearCookie(TOKEN_COOKIE_NAME, rest);
};
