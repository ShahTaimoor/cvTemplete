/** Optional Sentry — loads only when SENTRY_DSN is set and package is installed */

let Sentry = null;

export const initSentry = async () => {
  if (!process.env.SENTRY_DSN) return;
  try {
    const mod = await import('@sentry/node');
    Sentry = mod;
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
    console.log('Sentry initialized');
  } catch {
    console.warn('Sentry DSN set but @sentry/node not installed — skipping');
  }
};

export const captureException = (err) => {
  if (Sentry?.captureException) Sentry.captureException(err);
};

export const setupExpressErrorHandler = (app) => {
  if (Sentry?.setupExpressErrorHandler) Sentry.setupExpressErrorHandler(app);
};
