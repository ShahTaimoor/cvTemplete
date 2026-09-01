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
    endpoints: ['/api/health', '/api/auth', '/api/templates', '/api/resumes', '/api/subscriptions', '/api/upload', '/api/public', '/api/print', '/api/cover-letters'],
  });
});

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
  res.status(500).json({ message: err.message || 'Server error' });
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
