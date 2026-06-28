# SaaS Product Dashboard

A mini SaaS product management dashboard built for a Senior Full Stack Developer take-home assessment. Authenticated users can view analytics, browse products with search and pagination, and—depending on role—manage the product catalog.

**Repository:** [github.com/jaiman25400/saas-product-dashboard](https://github.com/jaiman25400/saas-product-dashboard)  
**Live demo:** _Add your Vercel URL here after deploy_

---

## Features

| Area | Implementation |
|------|----------------|
| **Auth** | Firebase email/password, httpOnly session cookies, admin & viewer roles |
| **Products** | Full CRUD via API (admin only for mutations) |
| **Dashboard** | Metrics (total, active, revenue), filters, sort, search, cursor pagination |
| **Data** | Firestore with typed repository layer |
| **Bonus** | CI/CD (GitHub Actions), Vercel deployment, Firestore cursor pagination |

---

## Quick start (under 5 minutes)

### Prerequisites

- Node.js 20+
- A Firebase project with **Authentication** (email/password) and **Firestore** enabled
- Firebase service account credentials (Admin SDK)

### 1. Clone and install

```bash
git clone https://github.com/jaiman25400/saas-product-dashboard.git
cd saas-product-dashboard
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all 9 values in `.env.local` from the Firebase Console:

- **Client config** (Project settings → Your apps): the six `NEXT_PUBLIC_FIREBASE_*` variables
- **Admin SDK** (Project settings → Service accounts → Generate new private key): `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`  
  Use `\n` for line breaks in the private key inside `.env.local`.

### 3. Deploy Firestore rules and indexes

```bash
# Requires Firebase CLI: npm install -g firebase-tools && firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with a new account—the **first user becomes admin**; subsequent users are viewers.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Unit + integration tests (Vitest) |
| `npm run test:unit` | Fast tests (no Firebase required) |

---

## Architecture overview

Single **Next.js 16 App Router** application (TypeScript). The UI and API live in one repo; business logic is layered so each concern has a clear home.

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js Application                       │
│                                                               │
│  React UI  →  lib/api (client)  →  API Routes (/api/*)       │
│                      ↓                                        │
│                 Services (auth, validation, rules)            │
│                      ↓                                        │
│                 Repositories (Firestore only)                 │
└──────────────────────────┬───────────────────────────────────┘
                           │
              Firebase Auth + Firestore (Admin SDK on server)
```

### Layer responsibilities

| Layer | Role |
|-------|------|
| **UI** (`src/components`, `src/app`) | Rendering, forms, filters; calls API via `apiFetch` |
| **API client** (`src/lib/api`) | Typed wrappers, session cookie on every request |
| **API routes** (`src/app/api`) | Auth, Zod validation, HTTP responses |
| **Services** (`src/services`) | Business rules, role checks |
| **Repositories** (`src/repositories`) | Firestore CRUD and queries only |
| **Proxy** (`src/proxy.ts`) | Fast gate: session cookie must exist for `/dashboard` |

### Typical request (list products)

```
Browser → GET /api/products?limit=10&search=mouse
       → Cookie: session=... (httpOnly)
       → requireSessionUser()
       → productService → productRepository.findPage()
       → Firestore cursor query → JSON + pagination metadata
```

---

## Database schema (Firestore)

### Collections

#### `users/{uid}`

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email |
| `role` | `admin` \| `viewer` | Mirrors Firebase custom claim |
| `createdAt` | timestamp | Profile creation time |

Document ID = Firebase Auth `uid`.

#### `products/{autoId}`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name |
| `category` | string | e.g. Electronics, Software |
| `price` | number | Stored as number (not string) |
| `status` | `active` \| `inactive` | Product status |
| `createdAt` | timestamp | Server timestamp on create |
| `updatedAt` | timestamp | Updated on every change |
| `createdBy` | string | `uid` of creating admin |
| `organizationId` | string? | Reserved for future multi-tenancy |

### Indexing strategy

Composite indexes are defined in `firestore.indexes.json` for common patterns:

- `status` + `createdAt`
- `category` + `createdAt`
- `createdAt`, `name`, `price` (for sort + cursor pagination)

Client-side writes to `products` and `users` are **denied** in `firestore.rules`; all mutations go through the Admin SDK in API routes.

### Scalability notes

**10× more products**

- Cursor-based pagination (implemented) instead of loading full collections
- Summary metrics currently scan all products—acceptable at demo scale; at production scale use aggregated counters or scheduled rollups
- Composite indexes for every filter + sort combination you support

**Multi-tenancy (future)**

- Add `organizationId` to products and scope every query with `where("organizationId", "==", orgId)`
- Store `orgId` in custom claims alongside `role`
- Optionally nest data under `organizations/{orgId}/products` if hard isolation is required

---

## Security decisions

### Authentication flow

1. User signs up/in with Firebase client SDK (email/password).
2. Client calls `POST /api/auth/register` (first login) and `POST /api/auth/session` with a short-lived JWT.
3. Server creates an **httpOnly session cookie** (not accessible to JavaScript).
4. Dashboard and product APIs use the cookie—no tokens in URLs or client storage.

### Role enforcement (defense in depth)

| Layer | What it does |
|-------|----------------|
| **UI** | Hides Add / Edit / Delete for viewers (UX only) |
| **API routes** | `requireAdmin()` on POST/PATCH/DELETE |
| **Services** | `user.role !== "admin"` → Forbidden |
| **Firestore rules** | Deny direct client writes |

### OWASP considerations

- No sensitive data in URLs (role is not passed as a query param)
- httpOnly + `secure` (production) session cookies
- Server-side validation with Zod on all mutation bodies
- Admin credentials only in server env vars—never committed

---

## Bonus features completed

1. **CI/CD & deployment** — GitHub Actions (lint, unit tests, smoke tests, build) + Vercel production deploy. See `docs/BONUS_CI_CD_DEPLOYMENT.md`.
2. **Search & pagination** — Server-side search (name/category), Firestore cursor pagination, category dropdown from live data. See `docs/BONUS_SEARCH_PAGINATION.md`.

Role-based UI with server enforcement is implemented as a **core requirement** (admin vs viewer).

---

## Trade-offs & scope decisions

| Decision | Rationale |
|----------|-----------|
| Single Next.js app vs separate API | Faster to ship; clear layers still separate concerns |
| httpOnly session cookie vs client JWT for APIs | Better XSS resistance; cookie sent via `credentials: "include"` |
| No component library (plain Tailwind) | Keeps focus on architecture, not UI kit learning |
| Search via substring filter (not Algolia) | Honest Firestore limitation; documented; fine at demo scale |
| Summary loads all products | Simple for take-home; would cache/aggregate in production |
| No Google OAuth | Not required by spec; email/password is sufficient |
| Skipped AI & observability bonuses | Chose two bonuses done well (CI/CD + pagination) per guidance |

---

## What's next (if I had another week)

1. **Aggregated metrics** — maintain `dashboardSummary/{id}` updated on product writes
2. **Structured logging** — request ID + JSON logs in API routes; Sentry for errors
3. **E2E tests** — Playwright against Vercel preview deployments
4. **Multi-tenancy** — `organizationId` on products + claim-based query scoping
5. **Accessible delete confirmation** — replace `window.confirm` with a modal

---

## AI tool usage

**Cursor** was used as a collaborative development assistant throughout the project:

- Scaffolding and phased implementation (auth → API → UI → bonus features)
- Generating initial boilerplate aligned with chosen architecture
- Study guides and revision sheets in `docs/`

All code was reviewed, tested, and studied before submission. I can explain any file in a walkthrough.

---

## Frameworks & libraries

| Tool | Purpose |
|------|---------|
| [Next.js 16](https://nextjs.org) (App Router) | Full-stack React framework |
| [React 19](https://react.dev) | UI |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [Firebase Auth](https://firebase.google.com/docs/auth) | Authentication |
| [Cloud Firestore](https://firebase.google.com/docs/firestore) | Database |
| [Firebase Admin SDK](https://firebase.google.com/docs/admin) | Server auth + Firestore writes |
| [Zod](https://zod.dev) | Runtime request validation |
| [Vitest](https://vitest.dev) | Unit and smoke tests |
| [GitHub Actions](https://github.com/features/actions) | CI pipeline |
| [Vercel](https://vercel.com) | Hosting |

---

## CI/CD note: Vercel vs GitHub secrets

These serve **different systems**:

| Where | Purpose |
|-------|---------|
| **Vercel env vars** | Run the app in production (your live demo) |
| **GitHub Actions secrets** | Run `npm run build` and Firebase smoke tests in CI on every push |
| **`.env.example`** | Documents variable **names** only—never real secrets |

Vercel alone does not configure GitHub Actions. If CI build fails with "missing Firebase env vars", add the same 9 values under **GitHub → Settings → Secrets and variables → Actions**. Lint and unit tests pass without secrets; build and integration tests need them.

---

## Demo access

_For reviewers:_

- **Live URL:** _your Vercel URL_
- **How to test admin:** Sign up as the first user in the Firebase project, or use a demo account you create:
  - Email: _optional demo email_
  - Password: _optional demo password_
- **Viewer:** Sign up with a second account to see read-only UI.

Before final submission, curate 3–5 sample products with distinct categories so search, filters, and pagination are easy to evaluate.

---

## Project documentation

Internal study and revision notes live in `docs/`:

- `PROJECT_PLAN.md` — full build plan and decisions
- `PHASE_*_REVISION.md` — interview cheat sheets
- `BONUS_CI_CD_DEPLOYMENT.md` / `BONUS_SEARCH_PAGINATION.md` — bonus deep dives

---

## License

Private take-home assessment project. Not licensed for redistribution.
