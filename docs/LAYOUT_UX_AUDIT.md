# Layout / UX Audit

Read-only investigation. No code was changed as part of this pass. Findings are
grouped into the three categories requested, each with exact file/line
references, a one-line description, and a severity rating based on how often a
typical user would hit the issue.

Severity scale:
- **High** — encountered on a frequently-visited page, or gates a destructive/irreversible action.
- **Medium** — encountered fairly often, or degrades the experience noticeably but has a workaround.
- **Low** — edge case, rarely-visited page, or cosmetic only.

---

## 1. Useless full-page scrolls

### 1.1 Dashboard sidebar is not sticky — scrolls away with page content
**File:** `frontend/src/components/layout/DashboardLayout.jsx:32-33, 92, 102`

```jsx
<div className={`flex bg-slate-50 ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
  <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
```

When `fullHeight` is not set (the default — used by `DashboardPage`, `PricingPage`
when logged in, and the free-tier upsell state of `CoverLetterPage`), the root
container is `min-h-screen`, not a bounded height, and the `<aside>` has no
`sticky`/`fixed` positioning and no `overflow-y-auto` of its own. It's a plain
flex sibling that grows with the row. The practical effect: as soon as page
content is taller than one viewport, scrolling down carries the entire sidebar
(nav links, plan badge, **Sign out** button) off-screen with it — this is
exactly the "fixed sidebar that should stay put but scrolls away" pattern.
This is worsened by finding 1.2 below, which can make the Dashboard's main
content extremely tall.

**Severity: High** — `DashboardLayout` (non-fullHeight) backs the Dashboard,
which is the most-visited authenticated page, plus Pricing.

### 1.2 "New resume" template picker renders all ~340 templates inline on the page (no modal, no pagination)
**File:** `frontend/src/pages/DashboardPage.jsx:105-128`, `frontend/src/components/dashboard/TemplateGallery.jsx:181-196`

`DashboardPage`'s "New resume" panel renders `<TemplateGallery>` directly in
the page flow (not in a modal/overlay — contrast with the same component's own
internal "Preview with sample data" popup, which *is* a modal). `TemplateGallery`
renders every filtered template as a grid item with no pagination or
virtualization (`filtered.map(...)` over the full list). With ~340 templates
in the catalog (confirmed via the Dashboard's own "Templates" stat card), the
Dashboard page becomes several times the height of the viewport whenever a
user opens "New resume" — not because of real content need, but because the
whole catalog is dumped inline. Combined with 1.1, this also drags the sidebar
far off-screen.

**Severity: High** — "New resume" is a core, frequently-used flow (every new
resume, and every "browse templates" click from the Dashboard, hits this).

### 1.3 Builder's edit panel has nested/duplicate scroll containers (double scrollbar)
**File:** `frontend/src/components/builder/ResumeForm.jsx:50`, `frontend/src/pages/BuilderPage.jsx:345`

```jsx
// BuilderPage.jsx:345 — outer scroll container
<div className="flex-1 overflow-y-auto p-4">
  <ResumeForm resume={localResume} onUpdate={handleUpdate} userPlan={plan} />

// ResumeForm.jsx:50 — inner scroll container, nested inside the above
<div className="space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
```

`ResumeForm`'s root div declares its own `overflow-y-auto` + a hardcoded
`max-h-[calc(100vh-120px)]`, but it's mounted inside a parent that is *already*
`overflow-y-auto` and flex-bounded (`BuilderPage.jsx:312-349`). This produces
two independently-scrolling regions stacked on top of each other. The
`100vh-120px` figure is also a magic number that doesn't track the builder's
actual chrome height (it changes when the "Saved versions" panel or ATS result
banner is open — `BuilderPage.jsx:285-310`), so the inner cutoff can be wrong
in either direction. Compare with `CoverLetterPage.jsx:69`, which does the
equivalent panel correctly with a single `overflow-y-auto` and no inner
max-height hack — this is an inconsistency specific to `ResumeForm`, not a
structural necessity.

**Severity: High** — the Builder's edit panel (`ResumeForm`) is the primary
resume-editing surface; virtually every session hits this, and it gets worse
the more experience/education/project entries a user adds (see 2.2).

### 1.4 Print route full page (low-traffic, informational only)
**File:** `frontend/src/pages/PrintPage.jsx:34-40`

Wraps `ResumePreview` in a plain `min-h-screen` div with no scroll containment
at all — for a multi-page resume this is a very tall, unstyled page. However,
nothing in the frontend currently links to or drives this route (no
`window.print()` call and no server-side headless-browser usage found anywhere
in the codebase), so it appears to be an unfinished/unused feature rather than
something users actually encounter.

**Severity: Low** — no evidence this route is reachable from the current UI.

---

## 2. Long scrollable sidebars

### 2.1 Main Dashboard sidebar nav has no self-scroll or overflow handling
**File:** `frontend/src/components/layout/DashboardLayout.jsx:33-89`

The `<aside>` (logo header, `<nav>` links, plan/sign-out footer) has no
`overflow-y-auto` anywhere in its own subtree. Today this is masked because
`NAV` (`DashboardLayout.jsx:14-17`) only has 2 entries plus at most one
conditional "Resume Editor"/"Cover Letter" badge, so it never actually
overflows. But the structure has no self-scroll region: in the `fullHeight`
case (Builder/CoverLetterPage) the `<aside>` is height-bounded to the screen
via its flex ancestor, so if the nav list ever grows, its content would
silently overflow/clip past the "Sign out" footer rather than scroll — there's
no `overflow-y-auto` to catch it. In the non-`fullHeight` case (Dashboard,
Pricing) it instead falls back to the whole-page-scrolls-away problem in 1.1.
Either way, this sidebar isn't built to handle growth gracefully.

**Severity: Medium** — not visibly broken today (nav is short), but it's a
latent structural gap that will surface the moment the nav list grows, and it
compounds finding 1.1 right now.

### 2.2 Builder's left-pane form is effectively an unbounded, ever-growing sidebar
**File:** `frontend/src/components/builder/ResumeForm.jsx:82-153`, `frontend/src/components/builder/DynamicListField.jsx`

The edit panel stacks `DynamicListField` sections for Experience, Education,
Skills, Projects, and Certifications, each of which renders one bordered card
per entry with no cap. A resume with, say, 6 experience entries + 3 education
+ 5 projects produces a very long form with no internal grouping/collapsing
(no accordion, no "show more"). Combined with 1.3's double-scrollbar bug, a
power user with a long resume ends up with two competing scrollbars over a
very tall form.

**Severity: Medium** — scales with how much a user has filled in; light users
won't notice, but the app's own "add more" affordances actively encourage
exactly the content growth that makes this worse.

### 2.3 Builder's "Templates" and "Saved versions" panels ARE handled correctly (reference point)
**File:** `frontend/src/pages/BuilderPage.jsx:334 (templates), 292 (versions)`

Noting this as a positive contrast: the Builder's in-panel Template gallery
(`compact` mode) is correctly scoped to `flex-1 overflow-y-auto p-4 min-h-0`
inside its own bounded column, and the "Saved versions" list uses a sensible
`max-h-24 overflow-y-auto`. Neither grows the page or double-scrolls. This
confirms the team already knows the correct pattern — 1.1/1.3/2.1 are
inconsistencies against the app's own established approach, not a case of an
unsolved technical problem.

**Severity: N/A (informational)**

### 2.4 No mobile navigation drawer — sidebar just disappears, taking Sign out with it
**File:** `frontend/src/components/layout/DashboardLayout.jsx:33 (`hidden md:flex`), 93-101 (mobile header)`

Below the `md` breakpoint the entire `<aside>` is `hidden` and is not replaced
by a hamburger menu or drawer — the mobile header (`DashboardLayout.jsx:93-101`)
only exposes a logo-link-to-Dashboard and a "Plans" link. There is no "Sign
out" control anywhere in the mobile app-shell experience. (The public
`Navbar.jsx:29-39` does have a working logout button, but per
`App.jsx:21-26` it is deliberately hidden on exactly the app-shell routes —
`/dashboard`, `/pricing` while logged in, `/builder/*`, `/cover-letter/*` —
where `DashboardLayout` is used instead.) A mobile user who is logged in has
no in-app way to sign out short of clearing site data.

**Severity: High** — affects every mobile user of the authenticated app, and
"can't sign out" is a basic, expected capability.

---

## 3. Default browser popups (`window.alert` / `window.confirm` / `window.prompt`)

No existing reusable `Modal`/`Dialog`/similar component exists anywhere in
`frontend/src/components/` (checked all subfolders: `auth/`, `builder/`,
`coverLetter/`, `dashboard/`, `layout/`, `resume/`, `templates/`). There is
also no toast/notification library installed (`package.json` has no
`react-hot-toast`/`sonner`/`notistack`) and no `hooks/useConfirm`-style
helper — `frontend/src/hooks/` only contains `useAutoSave.js`. The **only**
precedent for a styled overlay in the whole codebase is the inline
"Preview with sample data" popup in
`frontend/src/components/dashboard/TemplateGallery.jsx:198-224`
(`fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4` +
a white rounded card), which is not extracted into a reusable component —
it's a one-off. **Any replacement for the calls below needs to be built from
scratch**, though that inline pattern is a ready-made visual precedent to
match for consistency.

All 19 occurrences, in trigger order of how a user would hit them:

### `confirm(...)` — 2 occurrences

| File:Line | Trigger | Severity |
|---|---|---|
| `frontend/src/pages/DashboardPage.jsx:53` | Clicking the trash icon on a resume card ("Delete this resume?") — gates permanent, irreversible resume deletion | **High** |
| `frontend/src/pages/BuilderPage.jsx:158` | Clicking "Restore" on a saved version ("Restore this version? Current content will be replaced.") — gates overwriting the user's current in-progress edits | **High** |

Both are destructive-action confirmations on frequently-reachable UI (resume
cards on the Dashboard; the versions panel in the Builder). A native
`confirm()` here is jarring against the app's otherwise polished UI and gives
no room for better copy (e.g. showing which resume/version by name, warning
about unsaved changes specifically).

### `prompt(...)` — 1 occurrence

| File:Line | Trigger | Severity |
|---|---|---|
| `frontend/src/pages/BuilderPage.jsx:151` | Clicking "+ Save version" in the versions panel — asks for a version name via native OS prompt, pre-filled with `v${n}` | **Medium-High** |

Native `prompt()` boxes can't be styled, can't validate input inline, and look
distinctly out of place. This sits in a core feature (version history) likely
used by engaged users iterating on multiple job applications.

### `alert(...)` — 16 occurrences

| File:Line | Trigger | Severity |
|---|---|---|
| `frontend/src/pages/DashboardPage.jsx:38` | Resume creation API call fails | Medium |
| `frontend/src/pages/DashboardPage.jsx:48` | Resume duplication fails | Medium |
| `frontend/src/pages/DashboardPage.jsx:63` | Creating a cover letter without Premium | Medium |
| `frontend/src/pages/BuilderPage.jsx:101` | Switching template fails (API error) | Medium |
| `frontend/src/pages/BuilderPage.jsx:108` | Clicking "PDF" while the preview element isn't mounted (mobile "Edit" tab active) — instructs user to switch tabs first | Medium (reveals a workflow gap a proper inline state/auto-switch would fix) |
| `frontend/src/pages/BuilderPage.jsx:117` | PDF export throws | Medium |
| `frontend/src/pages/BuilderPage.jsx:128` | DOCX export throws | Medium |
| `frontend/src/pages/BuilderPage.jsx:135` | Clicking "PNG" while the preview element isn't mounted — same tab-switch instruction as line 108 | Medium |
| `frontend/src/pages/BuilderPage.jsx:144` | PNG export throws | Medium |
| `frontend/src/pages/BuilderPage.jsx:169` | Creating a cover letter without Premium (Builder entry point) | Medium |
| `frontend/src/pages/BuilderPage.jsx:178` | ATS check fails/unavailable | Medium |
| `frontend/src/pages/BuilderPage.jsx:186` | Share link successfully copied to clipboard — a **success** message, not an error | Low-Medium (blocking a whole page interaction just to say "copied" is disruptive; a toast would be strictly better and lower-severity to fix) |
| `frontend/src/pages/BuilderPage.jsx:188` | Sharing a resume without Premium | Medium |
| `frontend/src/pages/PricingPage.jsx:40` | Demo plan upgrade succeeds — success message including a parenthetical dev note about integrating a real payment gateway | Medium (user-facing copy includes an internal implementation note — "integrate JazzCash / EasyPaisa or card gateway for production" reads like a dev TODO leaking into production UI, independent of the alert() UX issue) |
| `frontend/src/pages/PricingPage.jsx:42` | Demo plan upgrade fails | Medium |
| `frontend/src/components/builder/ResumeForm.jsx:45` | Profile photo upload fails | Medium |

All of the error-path `alert()`s are functionally fine (they do inform the
user something failed) but are visually inconsistent with the rest of the
app, block all interaction until dismissed, and can't be styled/positioned/
auto-dismissed the way a toast notification could. None of these gate a
destructive action (that's only the two `confirm()`s above), so none are
rated High individually — but collectively, 16 occurrences across the two
most-used pages (Dashboard, Builder) means most active users will see a
native alert box at some point in a normal session (e.g. any transient
network hiccup during autosave-adjacent actions, or simply clicking "Share"
without Premium).

---

## Summary

| # | Category | Finding | Severity |
|---|---|---|---|
| 1.1 | Full-page scroll | Dashboard sidebar not sticky, scrolls away | High |
| 1.2 | Full-page scroll | Full template catalog (~340) inlined, no modal/pagination | High |
| 1.3 | Full-page scroll | Nested double-scrollbar in Builder edit panel | High |
| 1.4 | Full-page scroll | PrintPage unbounded height | Low (unreachable route) |
| 2.1 | Scrollable sidebar | Dashboard sidebar has no overflow handling for growth | Medium |
| 2.2 | Scrollable sidebar | Builder form panel unbounded growth | Medium |
| 2.3 | Scrollable sidebar | (positive reference — Templates/Versions panels done right) | N/A |
| 2.4 | Scrollable sidebar | No mobile nav drawer — Sign out unreachable on mobile | High |
| 3 | Browser popups | 2 `confirm()` (destructive actions) | High |
| 3 | Browser popups | 1 `prompt()` (version naming) | Medium-High |
| 3 | Browser popups | 16 `alert()` (errors + 2 success messages) | Medium (collectively high-frequency) |

No fixes were made in this pass. Findings above are ready for prioritization.
