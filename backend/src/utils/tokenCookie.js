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
  sameSite: 'lax',
  path: '/',
  maxAge: parseDurationMs(process.env.JWT_EXPIRES_IN),
});

export const setTokenCookie = (res, token) => {
  res.cookie(TOKEN_COOKIE_NAME, token, cookieOptions());
};

export const clearTokenCookie = (res) => {
  const { maxAge, ...rest } = cookieOptions();
  res.clearCookie(TOKEN_COOKIE_NAME, rest);
};
