# ResumeForge — MERN CV/Resume Builder

Full-stack SaaS resume builder with JWT auth, freemium subscriptions, 12+ templates, live preview, Puppeteer PDF export, and ATS checker.

## Features

- **Auth**: Register, login, JWT sessions
- **Resumes**: Multiple CVs per user, dynamic sections (personal, education, experience, skills, projects, certifications)
- **Templates**: 12 professional templates with plan-based locking (blur + lock icon + upgrade CTA)
- **Plans**: Free (2 templates), Basic ₹100 (10), Pro ₹250 (50 + colors + ATS), Premium ₹350 (100 + share link)
- **Live preview** while editing with theme CSS variables
- **Auto-save** every 2 seconds
- **Drag & drop** section ordering (Pro+)
- **PDF & PNG export** via html2canvas + jsPDF (client-side, matches live preview)
- **DOCX & PNG export**, resume **duplicate** & **named versions**
- **Cover letter builder** (Premium) with sample content
- **Template gallery** filters, search, sample preview
- **Mobile builder** Edit / Preview tabs
- **Security**: Helmet, rate limits, mongo sanitize, optional Sentry
- **Cloudinary** optional for profile photos
- **Share link** (Premium)
- **ATS checker** (Pro+)

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Redux Toolkit, Tailwind CSS v4, React Hook Form, Framer Motion, @dnd-kit |
| Backend | Node.js, Express, MongoDB, JWT, Puppeteer, Cloudinary, Multer |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally or Atlas URI

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET and MONGODB_URI
npm install
npm run seed
npm run dev
```

Server: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (proxies `/api` to backend)

## Environment

**backend/.env**

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cvbuilder
JWT_SECRET=change_me
CLIENT_URL=http://localhost:5173
```

**frontend** — API proxied via Vite; optional `VITE_API_URL=http://localhost:5000/api`

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Login |
| GET | `/api/templates` | List templates (with `locked` flag) |
| GET/POST | `/api/resumes` | CRUD resumes |
| PUT | `/api/resumes/:id` | Update + auto-save fields |
| POST | `/api/resumes/:id/pdf` | Download PDF |
| POST | `/api/resumes/:id/ats-check` | ATS analysis (Pro+) |
| POST | `/api/subscriptions/upgrade` | Demo plan upgrade |
| GET | `/api/public/share/:token` | Public shared resume |

## Payments (Production)

`/api/subscriptions/upgrade` currently applies plan changes without payment. Integrate **Razorpay** (INR) or Stripe for production billing.

## Project Structure

```
CvTemplete/
├── backend/src/
│   ├── models/       User, Resume, Template
│   ├── routes/       auth, resumes, templates, subscriptions
│   ├── services/     PDF, HTML, ATS, Cloudinary
│   └── scripts/      seedTemplates.js
└── frontend/src/
    ├── components/   builder, resume preview, templates
    ├── pages/        landing, dashboard, builder, pricing
    └── store/        Redux slices
```

## License

MIT
