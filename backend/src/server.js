import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSentry, captureException, setupExpressErrorHandler } from './config/sentry.js';
import { connectDB } from './config/db.js';
import { securityMiddleware, apiLimiter } from './middleware/security.js';
import authRoutes from './routes/authRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
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
app.use(express.json({ limit: '10mb' }));
app.use(securityMiddleware);
app.use('/api', apiLimiter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
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

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
