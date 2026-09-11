import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSentry, captureException, setupExpressErrorHandler } from './config/sentry.js';
import { connectDB } from './config/db.js';
import { ensureSuperAdmin } from './utils/ensureSuperAdmin.js';
import { securityMiddleware, apiLimiter } from './middleware/security.js';
import { doubleCsrfProtection, generateCsrfToken } from './config/csrf.js';
import authRoutes from './routes/authRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import printRoutes from './routes/printRoutes.js';
import coverLetterRoutes from './routes/coverLetterRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Defense-in-depth: asyncHandler (see routes/*) forwards route-level errors to
// the error middleware below, but this catches anything unexpected that gets
// missed (e.g. an error thrown outside the request cycle) so the process
// logs and survives instead of crashing the whole app for every user.
process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error('Unhandled promise rejection:', err);
  captureException(err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  captureException(err);
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(securityMiddleware);
app.use('/api', apiLimiter);
// Ensures every /api response carries a valid CSRF cookie — including GET
// requests and requests made before login — so the frontend always has a
// token in hand by the time it needs to submit a state-changing request.
// Reuses an existing valid cookie rather than rotating it on every call.
app.use('/api', (req, res, next) => {
  // Once COOKIE_DOMAIN is in play, expire any pre-existing host-only
  // csrf-token (issued before COOKIE_DOMAIN was set). It's a different
  // cookie tuple from the domain-scoped one generateCsrfToken sets below —
  // both Set-Cookie headers coexist — so this removes the stale one that
  // would otherwise also ride along in the request's Cookie header and
  // could be the value the backend validates against. Safe because the
  // token is not auth state; it's regenerated on this same response.
  if (process.env.COOKIE_DOMAIN && req.cookies['csrf-token']) {
    res.clearCookie('csrf-token', { path: '/' });
  }
  generateCsrfToken(req, res);
  next();
});
// Validates the x-csrf-token header against the cookie for POST/PUT/PATCH/
// DELETE; GET/HEAD/OPTIONS pass through untouched (csrf-csrf's default).
app.use('/api', doubleCsrfProtection);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'CV Builder API is running',
    docs: '/api/health',
  });
});

app.get('/api', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'CV Builder API is running',
    endpoints: ['/api/health', '/api/auth', '/api/templates', '/api/resumes', '/api/subscriptions', '/api/admin', '/api/upload', '/api/public', '/api/print', '/api/cover-letters'],
  });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Lets a cross-origin frontend obtain the CSRF token from the response body
// instead of having to read the csrf-token cookie with document.cookie — which
// it can't when the API is on a different subdomain (e.g. cv.* vs apicv.*). The
// cookie is still set (by the middleware above) and still sent back on
// credentialed requests, so the double-submit check is unchanged; the token
// isn't secret in that model, and CORS keeps this response unreadable to any
// other origin anyway. Frontend keeps the value in memory and echoes it in the
// x-csrf-token header. GET, so it's past doubleCsrfProtection untouched.
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateCsrfToken(req, res) });
});

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/print', printRoutes);
app.use('/api/cover-letters', coverLetterRoutes);

setupExpressErrorHandler(app);

app.use((err, _req, res, _next) => {
  console.error(err);
  captureException(err);

  // Malformed input (e.g. an invalid ObjectId in a :id param) is a client
  // error, not a server fault — and the raw CastError message exposes
  // internal model/path names, so give it a clean 400 instead of a 500.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

await initSentry();

// Listening no longer waits on the DB connection settling first — against
// the Atlas cluster this app uses, that can take anywhere from a few
// seconds to 10+ seconds, during which the port would otherwise not be
// listening at all (surfaced to the frontend as a 502 through Vite's dev
// proxy, or a connection failure in production, for any request racing
// startup). Mongoose queues queries issued before the connection is ready
// and flushes them once it connects (see bufferTimeoutMS in config/db.js),
// so opening the port immediately is safe — a request that arrives before
// Mongo is up just waits briefly instead of failing outright.
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

connectDB()
  .then(() => ensureSuperAdmin())
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
