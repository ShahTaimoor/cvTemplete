# ResumeForge — Project Overview

Read this in ~15 minutes to get oriented. It covers architecture, data flow, auth, plans/templates, the export pipeline, and known issues. This is a **read-only audit** — nothing in the codebase was changed to produce this document.

---

## 1. What it is

ResumeForge is a MERN SaaS resume/CV builder. Users register, pick from a large catalog of templates, fill out a form, see a live preview, and export to PDF/PNG/DOCX. Access to templates, colors, ATS checking, and a few other features is gated by a freemium subscription plan (Free / Basic / Pro / Premium).

**Stack**

| Layer | Tech |
|---|---|
| Frontend | React 19, Redux Toolkit, React Router 7, Tailwind CSS v4, React Hook Form, Framer Motion, @dnd-kit, Vite |
| Backend | Node/Express (ESM), MongoDB + Mongoose, JWT auth, `docx` (Word export), Cloudinary (optional photo upload), Multer, Helmet, express-rate-limit, express-mongo-sanitize |
| Client-side export | `jspdf` + `html-to-image` (screenshots the live preview DOM, not a server render) |

Two independent apps: `backend/` (Express API on :5000) and `frontend/` (Vite dev server on :5173, proxies `/api` to the backend). No shared package/monorepo tooling — they're just two folders, though the backend seed script does reach directly into `frontend/src/config/templateCatalog.js` (see §6).

---

## 2. Architecture & data flow

```
Browser (React/Redux)
  │  axios (JWT bearer token from localStorage)
  ▼
Express API (/api/*)
  │  Mongoose
  ▼
MongoDB  (User, Resume, ResumeVersion, Template, CoverLetter)
```

- **Auth**: JWT issued on register/login, stored in `localStorage`, attached as `Authorization: Bearer` on every request via an axios interceptor (`frontend/src/services/api.js`). `protect` middleware verifies the token and loads `req.user`; `optionalAuth` does the same but doesn't reject if absent (used for the public template list, so plan-based locking still applies to anonymous visitors).
- **State**: Redux Toolkit with three slices — `auth`, `resume`, `templates`. No React Query/SWR; server data is fetched via `createAsyncThunk` and cached in Redux by hand.
- **Editing flow**: `BuilderPage` holds a `localResume` copy in component state (decoupled from Redux `current` to avoid clobbering in-progress edits), pushes changes into Redux via `setCurrentResume`, and a `useAutoSave` hook debounce-saves to the API every 2s when the serialized resume changes.
- **Live preview**: `ResumePreview` renders the *same* resume data through a large table of layout React components (`ResumeLayouts.jsx`) driven by the template's `layout` key — this is what the user sees while editing, and it's also literally what gets screenshotted for PDF/PNG export (see §5), so preview and export are guaranteed to match pixel-for-pixel.

---

## 3. Data models

- **User** — name/email/password (bcrypt, hook on save), `subscription: { plan, expiresAt, purchasedAt }`. Plan is one of `free|basic|pro|premium`, defaults to `free`.
- **Resume** — belongs to a `User`. Holds `templateSlug`/`templateId`, a `theme` (4 CSS-ish color/font fields), `sectionOrder` (array of section keys, drag-and-drop reorderable on Pro+), and the actual content: `personal`, `summary`, `education[]`, `experience[]`, `skills[]`, `projects[]`, `certifications[]`. Also carries `isPublic`/`shareToken` for the share-link feature (a `pre('save')` hook mints the token the first time `isPublic` is set).
- **ResumeVersion** — named snapshots of a Resume (`snapshot: Mixed`), created on demand from the builder ("Save version" / "Restore"). Deleted in bulk when the parent Resume is deleted.
- **Template** — catalog entries in Mongo: `slug`, `layout` (key into the layout renderer), `planRequired`, `isPremium`, `sortOrder`, `defaultTheme`. This collection is a **seeded mirror** of a much larger catalog that actually lives in frontend code — see §6, this is the most important architectural quirk to understand before touching templates.
- **CoverLetter** — Premium-only, independent of Resume but can optionally reference one (`resume: ObjectId`) to pull in matching contact info/theme at creation time.

Relations: `User 1—N Resume`, `Resume 1—N ResumeVersion`, `User 1—N CoverLetter`, `CoverLetter N—1 Resume (optional)`. `Template` is read-only reference data, not owned by a user.

---

## 4. Auth, plans, and template locking

- **Auth**: standard JWT — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Rate-limited (`authLimiter`: 20 req/15min). Token expiry via `JWT_EXPIRES_IN` (default 7d).
- **Plans**: defined in `backend/src/config/plans.js` (`PLANS`, `PLAN_ORDER = [free, basic, pro, premium]`). `POST /api/subscriptions/upgrade` sets `user.subscription` directly — **there is no payment integration**, it's a self-serve demo toggle (both the root README and the Pricing page UI say this explicitly: "Demo payment — integrate JazzCash/EasyPaisa or card gateway for production").
- **Template locking**: `userCanUseTemplate(plan, template)` (`backend/src/utils/templateAccess.js`) compares `PLAN_ORDER` index of the user's plan against the template's `planRequired`, with a small carve-out (first 2 sort-order templates are free even if not explicitly marked free). This same check runs server-side on create/update (403 if locked) *and* is re-derived client-side for the blur+lock-icon UI — so the UI lock is cosmetic, the server is the real gate.
- **Feature gates** (all server-enforced, not just UI): color customization → Pro+ (`userCanCustomizeColors`), ATS checker → Pro+, drag-and-drop section order → Pro+ (client-only gate, not re-checked server-side on save), share link → Premium only, cover letters → Premium only (`requirePremium` middleware on the whole `coverLetterRoutes` router).
- **Plan config exists in two places**: `backend/src/config/plans.js` (source of truth for server-side gating, currency `PKR`) and `frontend/src/utils/plans.js` (separate hand-maintained array for pricing-page display copy). They currently agree on numbers, but nothing keeps them in sync — see Tech Debt.

---

## 5. Export pipeline (PDF / PNG / DOCX)

This is the part most likely to surprise a new developer, because **the README's first line is wrong**: it advertises "Puppeteer PDF export," but Puppeteer is not a dependency anywhere in the repo (checked `node_modules` and both `package-lock.json` files — absent). What's actually implemented:

- **PDF & PNG** — 100% client-side. `BuilderPage` grabs the live preview DOM node and calls `exportElementToPdf`/`exportElementToPng` (`frontend/src/utils/exportPreview.js`), which uses `html-to-image` to screenshot it to a canvas and `jspdf` to paginate it onto A4 pages. This is why preview and export always match — they're the same DOM.
- **DOCX** — server-side, built with the `docx` npm package from the raw Resume/CoverLetter fields (`backend/src/services/docxService.js`), exposed via `POST /api/resumes/:id/docx` and `POST /api/cover-letters/:id/docx`, rate-limited to 30/hour (`exportLimiter`).
- **Dead code from an abandoned server-side PDF approach**: `backend/src/services/resumeHtmlService.js` (a full HTML/CSS renderer for every layout, ~450 lines) is never imported by anything. `backend/src/utils/printToken.js` (`createPrintToken`) is never called by anything — only its counterpart `verifyPrintToken` is used, by `backend/src/routes/printRoutes.js`, which serves `GET /api/print/resume/:id?token=...`. The frontend has a matching `/print/resume/:id` route (`PrintPage.jsx`) that fetches from it — but nothing anywhere generates a print token or navigates to that page, so it's unreachable in the current app. `backend/.env.example` still has `PUPPETEER_EXECUTABLE_PATH` and a "Public URL for PDF generation" comment. All of this — HTML renderer, print token, print route, print page — reads as leftover scaffolding for a server-side Puppeteer PDF pipeline that was replaced by the client-side jsPDF approach but never deleted. Worth confirming with whoever built this before removing it, in case there's a reason (e.g. a future headless-export feature) it was left in place.

---

## 6. Template system (the part to understand before adding templates)

There are effectively **three parallel implementations of "what a template looks like,"** and a new developer needs to know all three exist:

1. **`frontend/src/config/templateCatalog.js`** — the real source of truth. It *generates* the full catalog (README/marketing copy says "330+ templates") by cross-producing a small set of `LAYOUT_META` entries with a palette list and country-specific CV configs (`templateCountries.js`). This is what the UI actually renders template cards from.
2. **MongoDB `Template` collection** — populated by `backend/src/scripts/seedTemplates.js`, which literally does `import('../../../frontend/src/config/templateCatalog.js')` from the backend to build seed data. This is a backend script reaching across the package boundary into frontend source — it only works because both folders sit in the same repo checkout; it would break if they were ever split into separate deployables.
3. **Two independent layout renderers**, each with a `switch`/if-else over the same ~50 `layout` keys, that must be kept in sync by hand whenever a layout is added or changed:
   - `frontend/src/components/resume/ResumeLayouts.jsx` (1,738 lines) — real React components, used for live preview and (via screenshot) for PDF/PNG export.
   - `backend/src/services/resumeHtmlService.js` (~450 lines) — raw HTML/CSS strings for the same layouts, but per §5 this is currently dead code.
   - `frontend/src/components/templates/TemplateThumbnail.jsx` (~550 lines) — a *third*, much simpler div-based mockup renderer, again switched on the same layout keys, used only for the small gallery thumbnails.

Because the frontend catalog and the DB can drift, `frontend/src/utils/mergeTemplates.js` explicitly patches over whatever the API returns with the full frontend catalog ("Ensure UI shows full catalog even if DB seed is outdated" — that comment is in the code). In practice this means the DB `Template` collection is close to vestigial for display purposes; it mainly matters for the server-side `userCanUseTemplate` gate on create/update, which does query Mongo directly, so **re-running `npm run seed` after editing the catalog is required** or newly added templates will be lockable/creatable client-side but rejected server-side (or vice versa) until the DB catches up.

---

## 7. Known Issues / Tech Debt

### Confirmed: duplicate Navbar on `/pricing` for logged-out users
**Root cause** — two independent pieces of layout logic disagree about who renders the public `<Navbar/>`:
- `frontend/src/App.jsx` (`AppRoutes`) decides `showPublicNav = pathname not in [/login,/register] && !usesAppShell`. For an anonymous visitor at `/pricing`, `usesAppShell` is `false` (it requires a token), so `showPublicNav` is `true` and App.jsx renders `<Navbar/>`.
- `frontend/src/pages/PricingPage.jsx` *also* independently renders its own `<Navbar/>` when there's no token: `return token ? <DashboardLayout>... : <><Navbar/><div>...</div></>`.

Every other public page (`LandingPage`, `LoginPage`/`RegisterPage` via `AuthSplitLayout`) relies solely on `App.jsx` to decide whether a nav renders and never self-renders one — `PricingPage` is the only page that breaks that convention, which is why the bug is scoped to exactly that one route. For logged-in users it doesn't manifest, because `usesAppShell` is `true` for `/pricing` when a token exists, so App.jsx correctly skips its Navbar and `PricingPage` renders `DashboardLayout` (sidebar, not `Navbar`) instead. **Fix direction (not applied):** delete the `<Navbar/>` branch inside `PricingPage.jsx` and let `App.jsx` be the single source of truth for when the public nav renders, matching every other page.

No other duplicate-render bugs were found in the pages/layouts audited. One adjacent visual bug found while checking: `ThemeCustomizer.jsx` uses dark-theme text classes (`text-slate-200`, `text-slate-400`) inside a light `bg-slate-50` panel — the "Theme Colors" heading and color labels will render as low-contrast light-gray-on-light-gray. Looks like a leftover from a dark-mode version of the component that was never adapted when it was placed in the (otherwise entirely light) builder form.

### README is out of date / self-contradictory
- Line 3 says "Puppeteer PDF export"; the same file's feature list a few lines down correctly says PDF/PNG is "client-side, matches live preview." Puppeteer isn't installed anywhere. See §5 for the dead code this left behind.
- README's API table lists `POST /api/resumes/:id/pdf` — this route does not exist. The actual PDF export has no server endpoint at all (it's fully client-side).
- README says prices in ₹ (INR symbol) "Basic ₹100, Pro ₹250, Premium ₹350"; the actual `PLANS` config (backend and frontend) uses PKR at 150/300/350, and the UI explicitly labels everything "Rs. (PKR)". The README pricing table is stale.

### Payments are not implemented
`POST /api/subscriptions/upgrade` changes `user.subscription` with no payment step — acknowledged in-app ("Demo payment — integrate JazzCash / EasyPaisa or card gateway for production"). Fine for a demo; would need real gateway integration (and probably webhook-driven plan changes instead of a client-triggered upgrade call) before this is a real SaaS.

### Duplicated/drift-prone configuration
- Plan pricing/features are hand-maintained in two places (`backend/src/config/plans.js` and `frontend/src/utils/plans.js`) with no shared source or type. They agree today; nothing prevents them from silently diverging.
- Template layout rendering is implemented three times (see §6) — the single highest-effort area to touch safely, and the most likely place for a "works in preview, wrong in export/thumbnail" bug to be introduced by a partial edit.
- `seedTemplates.js` sets `isActive: true` on seeded templates, but the `Template` schema (`backend/src/models/Template.js`) has no `isActive` field — Mongoose's default strict mode silently drops it. Either the field was removed from the schema without updating the seed script, or it was never added — worth checking intent before relying on it.

### npm audit findings (as of this audit, `npm audit --omit=dev`)
**Frontend** — 6 vulnerabilities: **1 critical**, 3 high, 2 moderate.
- `jspdf` (critical, via its `dompurify` dependency, several XSS-class advisories) — **this is the library the actual PDF export feature depends on**, so it's not just a transitive nuisance.
- `axios` (high, direct dependency, range 1.0.0–1.17.0 covers the pinned `^1.7.9`) — used for every API call.
- `react-router` / `react-router-dom` (high/moderate, direct dependency) — open redirect and DoS-class advisories.
- `form-data` (high, transitive).
- Fixing `jspdf`'s advisory requires a breaking upgrade to `jspdf@4.x` per `npm audit fix --force`; needs a real regression pass on export since the PDF pagination code in `exportPreview.js` is hand-rolled against the current API.

**Backend** — 21 vulnerabilities: 20 moderate, 1 low, no high/critical.
- Almost entirely transitive through `@sentry/node`'s optional OpenTelemetry instrumentation packages (only loaded if `SENTRY_DSN` is set — see `config/sentry.js`), so real-world exposure depends on whether Sentry is actually enabled in the deployment.
- Two worth a direct look: `mongoose` (moderate — prototype pollution via `__proto__`-prefixed dotted paths in update casting) and `body-parser` (low — DoS via silently-disabled size limit under some configs). Both have non-breaking fixes available (`npm audit fix`).

**Multer**: installed version is `1.4.5-lts.2`, which `npm audit` does *not* currently flag. It's still on the legacy 1.x line, though — Multer 1.x is in maintenance-only mode upstream (security fixes only, no new features; 2.x is the actively developed line). Not urgent, but worth knowing it's the older major.

### Minor
- `resumeSlice.updateCurrentField` mutates nested paths by walking a dotted string with no bounds/existence checking (`obj = obj[rest[i]]`) — fine as long as every caller only ever sets fields that already exist on the resume shape, but it will throw on a typo'd or newly-added nested path rather than failing gracefully. (In practice nothing in the codebase currently calls it — `ResumeForm` and `BuilderPage` update via full-object spreads instead — so this looks like unused/aspirational API surface in the slice.)
- Local file uploads (`backend/src/routes/uploadRoutes.js`, used when Cloudinary env vars are absent) write to `backend/uploads/` and are served statically — fine for local dev, but there's no cleanup job, so it will grow unbounded if Cloudinary is never configured in an environment that's actually used.

---

## 8. Orientation checklist for new work

- Read `backend/src/utils/templateAccess.js` and `backend/src/config/plans.js` together before touching anything plan-gated — the server is the real authority, the frontend lock icons are just UX.
- Before adding or changing a template layout, budget time to touch **all three** renderers in §6, plus re-running `npm run seed`.
- Don't trust the root `README.md` for the export pipeline or API surface — trust §5 above and the actual route files instead.
- If picking up the PDF/PNG export vulnerability, treat it as a real upgrade (breaking `jspdf` major, hand-rolled pagination logic to re-verify), not a one-line `npm audit fix`.
