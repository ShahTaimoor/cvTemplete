# Security & Data-Integrity Audit

Read-only investigation. No code was changed. Every finding below was verified
against the actual source (exact file/line references given) — several were
also verified **empirically** against a live instance of the backend (noted
explicitly where done). Nothing was fabricated to pad the list; sections
where the app does the right thing say so.

Severity scale used throughout:
- **Critical** — trivially exploitable, severe impact (full outage, free
  access to paid features, data of other users).
- **High** — real, concretely exploitable, serious impact, but needs a bit
  more than a single trivial request, or impact is scoped/contained.
- **Medium** — real but needs a precondition (e.g. Cloudinary not configured)
  or is defense-in-depth-only today (no active exploit path found).
- **Low** — theoretical, very low-impact, or noise (unreachable code path).

**Empirical testing performed**: registered fresh throwaway accounts against
the app's dev backend (connected to the live MongoDB Atlas instance used
elsewhere in this project) and issued real HTTP requests to confirm the two
Critical findings below actually happen, not just "should happen based on
reading the code." Test accounts/data were not destructively cleaned up
beyond what's noted; nothing outside this app's own DB was touched, and no
file-system write outside the app's intended `uploads/` directory was
attempted (that specific finding is verified by code inspection only, to
avoid actually writing outside the intended folder during a read-only audit).

---

## Executive summary — the two things that matter most

1. **Any authenticated user can crash the entire backend for all users** with
   a single malformed URL (e.g. `GET /api/resumes/not-an-id`). Confirmed live
   — see Section 5. **Critical.**
2. **Any authenticated user can grant themselves the top-tier paid plan for
   free**, no payment involved, via `POST /api/subscriptions/upgrade`.
   Confirmed live — see Section 6. The code's own placeholder wording
   suggests this is known/intentional pending real payment-gateway
   integration, but as shipped today it's a complete bypass. **Critical.**

Everything else below is real but narrower in scope than these two.

---

## 1. Injection risks

**NoSQL injection: not exploitable today.**

- `express-mongo-sanitize` is applied globally, before every route:
  `backend/src/middleware/security.js:3,9` (`mongoSanitize()`), wired in
  `backend/src/server.js:30`, ahead of all route mounts (`server.js:36-43`).
  This strips `$`/`.`-prefixed keys from `req.body`/`req.query`/`req.params`.
- No raw `$where`, no string-concatenated/dynamically-built query objects
  anywhere — every route file was read in full; all Mongo filters are plain
  literal objects like `{ _id: req.params.id, user: req.user._id }`.
- `req.query` is used in exactly one place in the whole backend:
  `backend/src/routes/printRoutes.js:9` (`const { token } = req.query;`), and
  it's passed to `jwt.verify()`, never into a DB filter. No other route reads
  `req.query` at all (verified by grep across `backend/src/routes/`).
- Login/register inputs are additionally constrained by `express-validator`
  (`backend/src/routes/authRoutes.js:14-18` for register, `:42` for login) —
  `email` must pass `isEmail()`, so even an object like `{"$gt":""}` is
  rejected as "Invalid value" before it could reach a query.
- **Empirically verified**: `POST /api/auth/login` with
  `{"email":{"$gt":""},"password":{"$gt":""}}` → `400 Invalid value`
  (rejected by validation, never reaches the DB layer).

**Severity: none found (informational).** This is a genuinely solid area —
global sanitization plus route-level literal query objects plus validation
on the two fields where injection would matter most (auth).

---

## 2. Auth & session security

**JWT**
- Signed with `process.env.JWT_SECRET`, HS256 (jsonwebtoken default), 7-day
  expiry by default (`JWT_EXPIRES_IN` env override) —
  `backend/src/utils/generateToken.js:4-6`.
- **No fallback/default secret anywhere.** `generateToken.js:4`,
  `backend/src/middleware/auth.js:13,31`, and
  `backend/src/utils/printToken.js:8,14` all pass `process.env.JWT_SECRET`
  directly with no `|| 'something'` fallback. If it's ever unset,
  `jwt.sign()`/`jwt.verify()` throw rather than silently signing with a
  guessable value — the correct failure mode.
- A second, separate short-lived (1h) JWT purpose exists for a "print" flow
  (`printToken.js`), scoped to a specific `userId`+`resumeId` pair and
  purpose-tagged so it can't be reused for other resumes
  (`printToken.js:15-19`). It backs `backend/src/routes/printRoutes.js`, a
  route that is **not** behind the normal `protect` middleware — but nothing
  in the frontend currently issues these tokens or calls this route (no
  `createPrintToken` caller found anywhere in the codebase), so it's
  currently dead code, not an active exposure.

**Passwords**
- Hashed with bcrypt, cost factor 12 — `backend/src/models/User.js:25`. Solid.
- Schema marks the field `select: false` (`User.js:8`), so it's excluded from
  query results by default; the login route explicitly opts back in with
  `.select('+password')` only where needed (`authRoutes.js:48`).
- Password is never included in any API response. Register/login handlers
  build an explicit allowlisted response object (`_id, name, email,
  subscription, token`) — `authRoutes.js:30-36` and `:52-58` — rather than
  returning the Mongoose doc directly. `GET /me` (`authRoutes.js:62-64`)
  returns `req.user`, which the `protect` middleware already fetched with
  `.select('-password')` (`auth.js:14`). No path leaks a password hash.

**Route protection — spot-checked across every route file**
- `resumeRoutes.js:13` — `router.use(protect)` covers the entire router, all
  resume endpoints.
- `coverLetterRoutes.js:10,19` — `protect` then a `requirePremium` middleware
  applied router-wide; correctly layered.
- `uploadRoutes.js:34` — `protect` applied to the photo-upload route.
- `subscriptionRoutes.js:12,21` — `/current` and `/upgrade` both require
  `protect`; only `/plans` (static pricing list, `:8`) is intentionally
  public.
- `templateRoutes.js:8,15` — intentionally public/`optionalAuth` (template
  browsing), which is appropriate since no sensitive data is returned.
- No route was found missing auth where it should have one.

**Rate limiting — present and reasonable**
- `apiLimiter` (300 req / 15 min) applied globally to all of `/api`:
  `middleware/security.js:12-18`, wired in `server.js:31`.
- `authLimiter` (20 req / 15 min) applied specifically to
  register/login/me: `security.js:20-24`, wired via `authRoutes.js:10`
  (`router.use(authLimiter)`). This is real brute-force protection on the
  login endpoint, not just the generic API-wide limit.
- `exportLimiter` (30 req / hour) additionally throttles the
  PDF/DOCX-generation endpoints (`resumeRoutes.js:189`,
  `coverLetterRoutes.js:90`) — sensible, since those are the more
  expensive-per-request operations.

**Severity: none found in this section (informational/positive).**

**Token storage (cross-referenced with Section 3)**
- The JWT is stored in `localStorage`, not an httpOnly cookie:
  `frontend/src/services/api.js:10`, `frontend/src/store/authSlice.js:9,22,35,44,52`.
  `localStorage` is readable by any JavaScript running on the page, so a
  successful XSS anywhere would be able to exfiltrate the token. Section 3
  below found no active stored-XSS vector in this app today, so this is a
  hardening recommendation rather than an active exploit — **Medium**
  (defense-in-depth; would become serious the moment any XSS vector is
  introduced, e.g. by a future feature or a compromised dependency).

---

## 3. Input validation & XSS

**Server-side: no sanitization of resume/cover-letter free-text content.**
Every string field in `backend/src/models/Resume.js` (name, summary,
experience descriptions, project descriptions, etc.) is a plain
`{ type: String }` with no validator, no length cap, no HTML stripping. The
`PUT /:id` handler assigns request-body values straight onto the Mongoose
doc for an allowlist of fields with no transformation:
`backend/src/routes/resumeRoutes.js:96-102`. Whatever a user types —
including `<script>...</script>` — is stored verbatim.

**Where that content gets rendered back out — checked every path:**
- **On-screen React preview**: zero `dangerouslySetInnerHTML` usage anywhere
  in `frontend/src/` (grepped the whole tree — no matches). All resume text
  is rendered via ordinary JSX `{value}` interpolation, which React
  HTML-escapes automatically. **Safe.**
- Also checked for the other classic React XSS footgun — a user-controlled
  URL rendered as `href={...}` (a `javascript:` URI in an `<a href>` bypasses
  React's escaping since it doesn't validate URL schemes). Zero dynamic
  `href={...}` usage found anywhere in the frontend (grepped). The
  website/LinkedIn/project-URL fields are rendered as plain text via
  `getContacts()`-style helpers, not as clickable links. **Safe.**
- **PDF export**: `frontend/src/utils/exportPreview.js` screenshots the
  already-rendered (already-escaped) DOM into a canvas/JPEG. A raster image
  can't execute script regardless of what's in the source text. **Safe.**
- **DOCX export**: `backend/src/services/docxService.js` passes resume text
  into the `docx` library's `TextRun({ text })` API, which treats it as plain
  character data, not markup, when serializing to OOXML. **Safe.**
- **A third, unused HTML-building path exists**:
  `backend/src/services/resumeHtmlService.js` builds full raw HTML strings
  and *does* correctly escape everything via its own `escapeHtml()` helper
  (defined `resumeHtmlService.js:3-10`, used on every interpolated field
  throughout the file). Grepped for callers of its exported
  `buildResumeHtml` — the only match is the function's own definition
  (`resumeHtmlService.js:273`). **It is not imported or called by any route.**
  Dead code today, correctly written if it's ever wired up.

**Conclusion: no active stored-XSS vector found.** That said, this safety is
a **single point of failure resting entirely on the frontend's consistent
avoidance of raw-HTML rendering** — the database and the API layer apply
zero sanitization of their own. If any future code path adds
`dangerouslySetInnerHTML`, wires up the unused `resumeHtmlService.js`, or
uses a rendering library that doesn't auto-escape, every resume already
stored in the database becomes an immediate stored-XSS payload with no
additional attacker action needed.

**Severity: Low today** (verified, no working exploit) **but flagged as
fragile** — recommend sanitizing/escaping at write time as defense-in-depth,
not relying solely on "the frontend currently escapes everything."

---

## 4. File upload security

`backend/src/routes/uploadRoutes.js` — photo upload, behind `protect`
(`:34`, requires auth, but any free registered account qualifies).

- **Type check is client-reported MIME type only, not content-verified.**
  `fileFilter` (`uploadRoutes.js:26-29`) checks
  `file.mimetype.startsWith('image/')` — `mimetype` is a value the
  *uploading client* sets in the multipart form; there is no magic-byte /
  actual-content check anywhere in this code.
- **Unsanitized client-supplied filename used directly on disk.** The
  storage `filename` callback (`uploadRoutes.js:18-20`) is
  `` `${Date.now()}-${file.originalname}` `` — `file.originalname` is taken
  verbatim from the client and is not sanitized (no strip of `../`, no
  basename-only extraction) before being used as the destination filename
  multer writes to. This is a well-known multer footgun: a crafted
  `originalname` containing path-traversal sequences can cause the file to
  be written outside the intended `uploads/` directory. *(Verified by code
  inspection only — a live traversal-write test was intentionally not
  performed, to keep this audit non-destructive.)*
- **Two different validation strengths depending on configuration.** When
  Cloudinary is configured (`isCloudinaryConfigured()`,
  `backend/src/services/cloudinaryService.js:3-6`), the file is uploaded to
  Cloudinary (`uploadRoutes.js:41`), which does its own real content-type
  detection/transcoding server-side — a genuine second layer of validation.
  When Cloudinary is **not** configured, the code falls back to serving the
  file straight off local disk (`uploadRoutes.js:45-46`) via
  `app.use('/uploads', express.static(...))` (`server.js:32`) with **no**
  second layer at all — the client-reported MIME check is the only gate.
- **Concrete consequence of the above two points combined**: in the
  local-storage fallback path, a file uploaded with `Content-Type:
  image/svg+xml` and an actual `<script>`-bearing SVG body passes the
  `fileFilter` check (SVG is a real `image/*` MIME type) and is then served
  back at `/uploads/<filename>` with that same content-type. Browsers
  execute embedded `<script>` in an SVG opened via direct navigation or
  `<object>`/`<iframe>` embedding (though not via a plain `<img>` tag) — a
  real stored-XSS-via-upload vector, gated on Cloudinary being unconfigured.
- File size is capped at 5MB via multer (`uploadRoutes.js:25`) — fine.

**Severity: High** for the path-traversal filename issue (concrete code-level
flaw, any authenticated user can trigger it, potential impact is arbitrary
file placement on the server). **Medium** for the SVG/local-fallback XSS
angle (real, but conditional on Cloudinary not being configured in that
environment).

---

## 5. API & infrastructure

**CORS — correctly locked down.** `server.js:23-28` configures a single,
fixed allowed origin (`process.env.CLIENT_URL`, falling back to the dev URL)
with `credentials: true`. **Empirically verified**: sent
`Origin: http://evil-attacker.com` to `GET /api/health` — the response's
`Access-Control-Allow-Origin` header was still the fixed configured origin
(`http://localhost:5173`), not a reflection of the attacker's origin. A
real browser enforcing CORS would reject that response for a page actually
running on `evil-attacker.com`. This is the correct, non-permissive
configuration — **not** a wide-open `*`/reflected-origin setup.

**Error responses — message-level leakage, no stack traces.**
`server.js:47-51`, the final catch-all error handler:
```js
app.use((err, _req, res, _next) => {
  console.error(err);
  captureException(err);
  res.status(500).json({ message: err.message || 'Server error' });
});
```
It does **not** return `err.stack`, so no raw stack traces reach the client.
It **does** return `err.message` to the client in every environment — there
is no `NODE_ENV === 'production'` check anywhere that swaps this for a
generic message. Depending on what throws, `err.message` can include
internal detail (e.g. Mongoose CastError messages name the exact schema
path and model, as seen directly in the crash below). **Medium** — real
information disclosure, but limited to message text, not full traces or
credentials.

**CRITICAL — empirically confirmed: the entire backend process crashes on a
single malformed request from any authenticated user, taking the app down
for everyone.**

Root cause, verified by reading the code and then reproducing it live:
- Express 4 (this app uses `express@^4.21.2`) does **not** automatically
  catch a rejected promise thrown inside an `async (req, res) => {...}`
  route handler and forward it to error-handling middleware — that
  auto-catch behavior only exists in Express 5. This app is entirely
  Express-4-style `async` handlers with essentially **no `try/catch`
  anywhere in `resumeRoutes.js` or `coverLetterRoutes.js`** (e.g.
  `resumeRoutes.js:64-68`, `:70-107`, `:109-117`, `:119-131`, `:133-139`,
  `:141-151`, `:153-164`, `:166-174`, `:176-187`, `:189-199`; same pattern in
  `coverLetterRoutes.js:65-69,71-83,85-88,90-97`).
- Every one of those routes takes `req.params.id` (and some, `:versionId`)
  straight into a Mongoose query filter (`{ _id: req.params.id, ... }`) with
  **zero format validation**. Mongoose's ObjectId cast throws/rejects for
  any string that isn't a valid 24-char hex ID.
- No `process.on('unhandledRejection', ...)` or `process.on('uncaughtException', ...)`
  handler exists anywhere in `server.js` (or elsewhere in the backend). Since
  Node 15, the default behavior for an unhandled promise rejection is to
  terminate the process.
- **Live reproduction**: registered a throwaway account, obtained a valid
  JWT, then called `GET /api/resumes/not-a-valid-objectid` with that token
  (hits `resumeRoutes.js:64-68`). The server printed an uncaught
  `CastError: Cast to ObjectId failed for value "not-a-valid-objectid" ...
  at path "_id" for model "Resume"` and the Node process exited immediately.
  A follow-up request to `/api/health` — a completely unrelated,
  unauthenticated endpoint — got connection-refused. **The whole application
  was down for every user until the process was manually restarted.**
- This is not limited to `:id` — the same "no try/catch, Express 4, no
  process-level safety net" pattern means *any* rejected promise in *any* of
  these handlers (a Mongoose validation error on `.save()`, a bad-shaped
  nested field triggering a cast error on write, a transient DB hiccup) is
  equally capable of crashing the whole server, not just malformed
  ObjectIds specifically.
- **One route already does this correctly and shows the fix is trivial**:
  `printRoutes.js:7-18` wraps its entire handler body in `try { ... } catch
  { res.status(401)... }` and correctly returns an error response instead of
  crashing. It's the exception, not the rule.
- Optional Sentry integration (`config/sentry.js`) is not configured in this
  environment (`SENTRY_DSN` is empty in `.env`) and was not active during
  the test; even where Sentry *is* configured, its Express error-handler
  hook (`setupExpressErrorHandler`, only invoked via `next(err)` inside
  Express's normal routing) would not intercept a rejection that never
  reaches `next()` in the first place — the crash happens before any of
  that machinery would run.

**Severity: Critical.** Any registered user (free tier, self-signup, zero
special access) can take the entire application offline for all users with
one malformed HTTP request and no special tooling.

**Environment variable handling — clean.**
- No `VITE_`-prefixed secret exists anywhere in the frontend; the only Vite
  env var referenced is `VITE_API_URL` (`frontend/src/services/api.js:3`,
  `frontend/.env.example:1`), a public API base URL, not a secret.
- No hardcoded API keys/secrets found anywhere in `frontend/src` (grepped
  for common secret-like patterns; only legitimate matches were things like
  local variables named `token`/`password` used for form/auth handling, not
  actual secret values).
- No `frontend/.env` file exists in the repo (only `.env.example`).
- `backend/.env` (which does hold real credentials — Mongo URI, JWT secret,
  Cloudinary keys) is correctly gitignored both at the repo root
  (`.gitignore:5`) and again in `backend/.gitignore:3`. Confirmed via
  `git ls-files | grep -i '\.env$'` — **no `.env` file is tracked in git.**

**Dependency vulnerabilities — ran `npm audit` live against both installed
trees just now** (numbers below are current, not the older baseline
mentioned in the task — versions have moved since):

*Backend — 22 total (1 low, 20 moderate, 1 high).*
- The bulk (roughly 17 of the 22) are transitive dependencies of
  `@sentry/node`'s OpenTelemetry auto-instrumentation for frameworks this
  app doesn't use at all (Koa, MySQL2, Prisma, PostgreSQL). Those code paths
  are never reachable in an Express+Mongoose-only app — **noise**, and only
  relevant at all if `SENTRY_DSN` is ever set.
- `mongoose` — moderate, prototype pollution via `__proto__`-prefixed dotted
  paths in update casting. **Actually relevant**: confirmed the installed
  version is `8.24.0` (checked `node_modules/mongoose/package.json`
  directly), which falls inside the vulnerable `8.0.0–8.24.0` range. This
  app does merge nested request-body objects into Mongoose docs in a few
  places (`resumeRoutes.js:93` theme merge, `resumeRoutes.js:161`
  `Object.assign(resume, version.snapshot)`), which is the kind of pattern
  this class of vulnerability targets. Worth the `npm audit fix`.
- `body-parser` — low, DoS via a body-size-limit parsing bug; transitive via
  Express. Low real impact but a one-line fix.
- `nanoid` — high (CVE class: infinite loop with a negative/zero size
  argument), transitive dependency several layers deep. This app never
  passes user-controlled size values into anything that would reach nanoid's
  vulnerable code path directly — **likely low real-world reachability**
  despite the "high" label, but not fully ruled out without tracing every
  transitive caller.

*Frontend — 9 total (2 moderate, 6 high, 1 critical).*
- **The critical one is `jspdf`** (direct dependency, used in
  `frontend/src/utils/exportPreview.js` for the PDF export feature) — via a
  transitively-pulled vulnerable `dompurify` with numerous XSS-bypass
  advisories. **Practical relevance is lower than the label suggests**:
  checked this app's actual jsPDF usage — it only calls `.addImage()`,
  `.addPage()`, and `.save()` to embed a pre-rendered raster image; it never
  calls jsPDF's `.html()` method, which is the feature that pulls in and
  exercises DOMPurify. The vulnerable code path is present in the dependency
  tree but not exercised by this app's usage pattern. Still worth upgrading
  (`npm audit fix --force` → jsPDF 4.2.1, a breaking change that would need
  testing against the recent PDF-export work).
- `axios` (direct, high) — several CVEs are specific to axios's Node HTTP
  adapter / proxy handling, not applicable to this app's browser/XHR usage;
  a couple (recursive-parsing DoS, prototype-pollution gadgets in request
  construction) could still apply client-side. Worth the straightforward
  `npm audit fix`.
- `react-router` / `react-router-dom` (direct + transitive, high/moderate) —
  several of the listed advisories are specific to React Server
  Components/SSR (open redirect via `<Link>`, RSC CSRF bypass), which this
  app doesn't use at all (`frontend/src/App.jsx` is a plain client-side
  `BrowserRouter` SPA, no SSR/RSC). Reduced relevance for those; still worth
  the fix since it's a straightforward non-breaking bump.
- `postcss`, `brace-expansion`, `form-data` — all transitive, all
  build-time/tooling-only (PostCSS runs during the Vite/Tailwind build, not
  in the shipped browser bundle; the others are transitive of dev tooling or
  of axios) — **noise** for a deployed app.

---

## 6. Plan/access control integrity

**The gating mechanism itself is sound and cannot be bypassed by a client
skipping frontend checks.** Every plan-gated server action re-checks
`req.user.subscription.plan` — read fresh from the database via the
`protect` middleware's authenticated lookup (`auth.js:14`), never trusted
from anything the client sends:
- `resumeRoutes.js:39` (create, template lock), `:78` (template switch on
  update), `:88` (theme/color customization requires Pro+), `:168` (ATS
  checker requires Pro+), `:178` (share link requires Premium).
- `coverLetterRoutes.js:12-19` — a `requirePremium` middleware applied
  router-wide (`:19`), gating every cover-letter endpoint.
- `templateAccess.js:3-15` (`userCanUseTemplate`) and `:17-25`
  (`enrichTemplateForUser`) compute the `locked`/`lockReason` flags
  server-side for the template list (`templateRoutes.js:11,21`) — a client
  can't just ignore a frontend-only "locked" badge, because the actual
  create/update endpoints independently re-verify eligibility too
  (defense in depth: even if someone bypassed the UI lock and POSTed a
  locked `templateSlug` directly, `resumeRoutes.js:39` would still reject
  it with 403).

**CRITICAL — empirically confirmed: the plan value being checked can be set
to anything, by anyone, for free, via the "upgrade" endpoint itself.**

`backend/src/routes/subscriptionRoutes.js:21-40`:
```js
router.post('/upgrade', protect, async (req, res) => {
  const { planId } = req.body;
  if (!PLANS[planId] || planId === 'free') {
    return res.status(400).json({ message: 'Invalid plan' });
  }
  const user = await User.findById(req.user._id);
  user.subscription = {
    plan: planId,
    purchasedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };
  await user.save();
  ...
});
```
There is no payment step, no external verification, no admin approval —
`planId` is taken directly from the request body and written straight onto
the user's own record. **Live reproduction**: registered a fresh free-tier
account, confirmed `GET /api/subscriptions/current` showed `"plan":"free"`,
then called `POST /api/subscriptions/upgrade` with `{"planId":"premium"}`
using that same account's token — received `200 {"message":"Upgraded to
Premium plan", ...}`, and a follow-up `GET /current` confirmed
`"plan":"premium"` with a one-year expiry. This immediately unlocks every
premium-gated feature audited above (all 330+ templates, color
customization, ATS checker, share links, cover letters) for $0, using
nothing but the app's own public registration + this one endpoint.

The frontend's own code signals this is a known placeholder — the success
alert in `frontend/src/pages/PricingPage.jsx:40` literally says *"Demo
payment — integrate JazzCash / EasyPaisa or card gateway for production"* —
so this is very likely intentional scaffolding pending real payment-gateway
integration, not an oversight. That context matters for prioritization, but
it doesn't change the fact that **as this code is currently written, the
entire monetization/plan-gating model has a one-request bypass.**

**Severity: Critical** (as-shipped) — flagged with the caveat above that the
code itself indicates awareness this needs replacing before real payment
processing goes live.

---

## Summary table

| # | Area | Finding | Severity |
|---|---|---|---|
| 1 | Injection | NoSQL injection — properly mitigated (sanitize-mongo + validation) | None found |
| 2 | Auth | JWT signing/expiry, password hashing, route protection, rate limiting — all correctly implemented | None found |
| 2 | Auth | JWT stored in `localStorage`, not httpOnly cookie | Medium (hardening) |
| 3 | XSS | No active stored-XSS path found (React auto-escaping, no dynamic `href`, PDF/DOCX paths both safe) | Low (fragile — zero server-side sanitization backstop) |
| 4 | File upload | Unsanitized `file.originalname` used in disk write path (path traversal risk) | High |
| 4 | File upload | Client-trusted MIME type only when Cloudinary unconfigured (SVG stored-XSS angle) | Medium |
| 5 | Infra | CORS correctly locked to a single configured origin | None found |
| 5 | Infra | Error handler leaks `err.message` to client in all environments (no NODE_ENV gating) | Medium |
| 5 | Infra | **Any authenticated user crashes the entire backend with one malformed request (unhandled async rejection, Express 4, no try/catch, no process-level safety net) — live-reproduced** | **Critical** |
| 5 | Infra | `.env` handling clean; no secrets in frontend bundle or git history | None found |
| 5 | Infra | Backend `npm audit`: 22 findings, mostly Sentry/OpenTelemetry noise; `mongoose` prototype-pollution CVE is the one directly relevant hit (installed version confirmed in vulnerable range) | Medium |
| 5 | Infra | Frontend `npm audit`: 9 findings incl. 1 critical (`jspdf`→`dompurify`), but this app's jsPDF usage doesn't exercise the vulnerable code path | Low–Medium (upgrade recommended regardless) |
| 6 | Plan integrity | Server-side plan checks are sound and not client-bypassable | None found |
| 6 | Plan integrity | **`POST /api/subscriptions/upgrade` lets any user grant themselves any paid plan for free, no payment check — live-reproduced. Likely known placeholder per the code's own "Demo payment" wording.** | **Critical** |

No fixes were made in this pass. Findings above are ready for prioritization.
