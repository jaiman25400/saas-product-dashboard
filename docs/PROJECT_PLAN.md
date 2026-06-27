# SaaS Product Dashboard — Project Plan & Reference

> **Purpose:** Living document for the Senior Full Stack Developer take-home assessment.  
> Captures requirements, decisions, architecture, phased build plan, and interview prep notes.  
> **Repo:** [jaiman25400/saas-product-dashboard](https://github.com/jaiman25400/saas-product-dashboard)  
> **Assessment PDF:** `2026 06 June fullstack_take_home_challenge.pdf`

---

## Table of Contents

0. [Phase 1 & 2 Revision Sheet](./PHASE_1_2_REVISION.md) — interview quick recap
1. [Assessment Overview](#assessment-overview)
2. [Core Requirements](#core-requirements)
3. [Bonus Areas (TBD)](#bonus-areas-tbd)
4. [Our Decisions](#our-decisions)
5. [Architecture](#architecture)
6. [Firestore Data Model](#firestore-data-model)
7. [Security Model](#security-model)
8. [Folder Structure](#folder-structure)
9. [Phased Build Plan](#phased-build-plan)
10. [README Checklist](#readme-checklist)
11. [Evaluation Rubric](#evaluation-rubric)
12. [Interview Prep Topics](#interview-prep-topics)
13. [Progress Tracker](#progress-tracker)
14. [Session Notes](#session-notes)

---

## Assessment Overview

Build a **mini SaaS product management dashboard** where authenticated users can manage products, view analytics, and control access.

| Detail | Value |
|--------|-------|
| **Role** | Senior Full Stack Developer |
| **Time budget** | 2–3 days (scope to comfortable depth) |
| **Submission** | Public GitHub repo — README must be the first thing reviewers see |
| **Stack (specified)** | Next.js / React, Node.js API, Firebase (Auth + Firestore) |
| **AI tools** | Encouraged — document usage in README; must explain all code in walkthrough |
| **Open source** | Encouraged — document frameworks used |

**Key principle:** Correctness and clarity over completeness. Document what you don't build and why.

---

## Core Requirements

### 1 · Authentication & Authorization (Must-have)

- Secure sign-up / sign-in using **Firebase Authentication**
- Protect routes and API endpoints
- At least two roles: **admin** and **viewer**
- OWASP basics: no sensitive data in URLs, proper session handling, secure token usage

### 2 · Product CRUD (Must-have)

- UI + backend for create, read, update, delete
- Minimum product fields:
  - `name`
  - `category`
  - `price`
  - `status` — `active` | `inactive`
  - `timestamp` (created/updated)
- Store in **Firestore**
- Clean **data access layer** in Node.js (Next.js API routes or separate service)

### 3 · Dashboard & Data Display (Must-have)

- Responsive dashboard page
- Product list with **filtering** and **sorting**
- At least **two summary metrics**, e.g.:
  - Total products
  - Active product count
  - Revenue total
- Clean, usable UI — not polish for its own sake

### 4 · Database Design (Must-have)

- Document Firestore data model (collections, fields, subcollections)
- Explain indexing strategy
- Explain how schema evolves for **multi-tenancy** or **10× product scale**

---

## Bonus Areas (TBD)

Pick **one or two** — do not attempt all. Decision deferred until core is stable.

| Bonus | Notes |
|-------|-------|
| **Role-based UI + server enforcement** | Admin: edit/delete; Viewer: read-only. Enforce on server, not just hide UI. *Strong recommendation.* |
| **Search & pagination** | Server or client pagination; cursor-based Firestore pagination is a plus |
| **CI/CD or deployment** | Vercel, Firebase Hosting, or Azure; GitHub Actions for lint/test |
| **AI-powered feature** | e.g. auto-generate descriptions, category suggestions, NL search filter |
| **Observability** | Structured logging, Sentry, Firebase Performance, etc. |

**Current status:** Not chosen yet — revisit after Phase 4 (Dashboard UI).

---

## Our Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Firebase** | New project needed | To be created in Phase 0 |
| **Framework** | Next.js **App Router** + **TypeScript** | Modern standard; candidate is comfortable |
| **UI** | **Plain Tailwind CSS** | No component library; keeps scope focused |
| **Auth method** | **Email/password first** | Meets spec; Google not required |
| **Google sign-in** | **Not in v1** | PDF does not require OAuth providers |
| **Bonus features** | **Decide later** | After core requirements are solid |
| **Repo** | `jaiman25400/saas-product-dashboard` | Created on GitHub |
| **Build approach** | Step-by-step, pair programming style | Understand every layer for interview |
| **AI tooling** | Cursor (and others as needed) | Disclose in final README |

### Google Sign-in — FAQ

**Is Google sign-in required?** No. The assessment only requires Firebase Authentication with sign-up/sign-in. Email/password fully satisfies the requirement. Google (or other OAuth) can be added later as a nice-to-have if time allows.

---

## Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application                          │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │  UI Layer   │   │  API Routes  │   │  Middleware         │  │
│  │  (React)    │──▶│  (Node.js)   │◀──│  (route protection) │  │
│  └─────────────┘   └──────┬───────┘   └─────────────────────┘  │
│                           │                                      │
│                    ┌──────▼───────┐                              │
│                    │   Services   │  ← business logic            │
│                    └──────┬───────┘                              │
│                    ┌──────▼───────┐                              │
│                    │ Repositories │  ← Firestore DAL only here   │
│                    └──────┬───────┘                              │
└───────────────────────────┼──────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   Firebase Auth      Firestore DB      Firebase Admin SDK
   (client sign-in)   (products, users)  (server token verify + roles)
```

### Layer Responsibilities

| Layer | Responsibility | Must NOT do |
|-------|----------------|-------------|
| **UI (React pages/components)** | Render data, forms, filters, tables | Direct Firestore writes; trust client role alone |
| **Middleware** | Redirect unauthenticated users from protected routes | Business logic |
| **API Routes** | Validate input, verify auth token, check role, call services | Raw Firestore queries inline |
| **Services** | Business rules, authorization checks, orchestration | UI concerns |
| **Repositories** | All Firestore CRUD and queries | Authorization decisions |
| **Firebase Admin** | Verify ID tokens, set custom claims | Run on client |

### Request Flow (example: create product)

```
User submits form
    → Client sends POST /api/products with Authorization: Bearer <idToken>
    → API route verifies token via Firebase Admin SDK
    → API route checks role === 'admin'
    → ProductService validates payload (Zod)
    → ProductRepository writes to Firestore
    → Response returned to client
    → UI updates
```

---

## Firestore Data Model

### Collections (v1)

#### `users/{userId}`

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | From Firebase Auth |
| `role` | `"admin"` \| `"viewer"` | Mirror of custom claim; optional denormalization |
| `createdAt` | timestamp | Account creation |

#### `products/{productId}`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Required |
| `category` | string | Required |
| `price` | number | Required; store as number, not string |
| `status` | `"active"` \| `"inactive"` | Required |
| `createdAt` | timestamp | Set on create |
| `updatedAt` | timestamp | Set on every update |
| `createdBy` | string (userId) | Audit trail |
| `organizationId` | string (optional) | Reserved for future multi-tenancy |

### Indexing Strategy (planned)

| Query pattern | Index |
|---------------|-------|
| Filter by status | `status` ASC |
| Filter by category | `category` ASC |
| Sort by createdAt | `createdAt` DESC |
| Filter status + sort date | Composite: `status` + `createdAt` |
| Multi-tenant (future) | Composite: `organizationId` + `status` + `createdAt` |

### Scalability Notes (for README)

- **10× products:** Pagination (cursor-based), composite indexes, avoid loading full collection client-side
- **Multi-tenancy:** Add `organizationId` to all tenant-scoped documents; scope all queries by `organizationId`; use custom claims `orgId` + `role`; consider subcollections `organizations/{orgId}/products` only if isolation requirements grow
- **Revenue metric:** Computed server-side via aggregation query or cached summary doc updated on write

---

## Security Model

### End-to-end auth flow (planned)

1. User signs up / signs in via Firebase client SDK (email/password)
2. Client receives ID token (short-lived JWT)
3. Client sends token to API routes (`Authorization` header or httpOnly session cookie)
4. Server verifies token with **Firebase Admin SDK**
5. Server reads **custom claims** (`role: admin | viewer`)
6. Server enforces role before any mutation

### Role enforcement layers

| Layer | Enforcement |
|-------|-------------|
| **Firestore Security Rules** | Second line of defense — deny writes from client if rules are tight |
| **API Routes** | Primary enforcement for all mutations |
| **UI** | Hide admin controls for viewers — UX only, not security |

### OWASP considerations

- No tokens or roles in URL query params
- Validate all input server-side (Zod)
- Use HTTPS in production (Vercel default)
- Never expose Firebase Admin credentials to client
- Environment variables for all secrets (`.env.local`, not committed)

### Custom claims strategy

- Set `role` claim via Admin SDK (e.g. on first signup script or admin-only endpoint)
- First registered user → `admin`; subsequent → `viewer` (or manual seed script)
- Document the bootstrap process in README

---

## Folder Structure

```
saas-product-dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   └── products/
│   │   ├── api/
│   │   │   └── products/
│   │   │       ├── route.ts          # GET list, POST create
│   │   │       └── [id]/route.ts     # GET, PATCH, DELETE
│   │   ├── layout.tsx
│   │   └── page.tsx                  # landing / redirect
│   ├── components/
│   │   ├── ui/                       # reusable Tailwind components
│   │   └── products/                 # product-specific components
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts             # Firebase client SDK init
│   │   │   └── admin.ts              # Firebase Admin SDK init
│   │   └── auth/
│   │       ├── session.ts            # verify token, get user
│   │       └── require-role.ts       # middleware helper
│   ├── repositories/
│   │   └── product.repository.ts
│   ├── services/
│   │   └── product.service.ts
│   └── types/
│       ├── product.ts
│       └── user.ts
├── firestore.rules
├── firestore.indexes.json
├── .env.example
├── .gitignore
├── PROJECT_PLAN.md                   # Living build plan + architecture
├── PHASE_1_2_REVISION.md             # Interview revision sheet (Phase 1 & 2)
├── README.md                         # submission-facing doc (build later)
└── .github/workflows/ci.yml          # bonus — if chosen
```

---

## Phased Build Plan

### Phase 0 — Foundation ✅ Complete (after you add `.env.local`)

- [x] `git init`, connect remote, initial commit
- [x] Scaffold Next.js (App Router, TypeScript, Tailwind, ESLint)
- [x] Create Firebase project (Auth + Firestore)
- [x] Add `.env.example` with required variables
- [x] Add `.gitignore` (node_modules, `.env.local`, allow `.env.example`)
- [x] Firebase client + admin SDK wiring (`src/lib/firebase/`)
- [ ] **You:** copy `.env.example` → `.env.local` and fill values locally

**Env vars to document:**

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

### Phase 1 — Database design ✅ Complete

- [x] Finalize schema in this doc + README
- [x] Write `firestore.rules` (baseline deny-all + scoped allow)
- [x] Write `firestore.indexes.json`
- [x] Define TypeScript types (`Product`, `User`, `Role`)
- [ ] **You:** deploy rules to Firebase Console (see below)

### Phase 2 — Authentication ✅ Complete

- [x] Sign-up page (email/password)
- [x] Sign-in page (email/password)
- [x] Auth context (`AuthProvider` + `useAuth`)
- [x] Middleware — protect `/dashboard`
- [x] Session cookie via `/api/auth/session`
- [x] Custom claims — first user `admin`, later users `viewer` via `/api/auth/register`
- [x] Dashboard shell (placeholder until Phase 4)

### Phase 3 — Data layer + API ✅ Complete

- [x] `ProductRepository` — CRUD + list with filters
- [x] `ProductService` — validation + authorization
- [x] `GET/POST /api/products`
- [x] `GET/PATCH/DELETE /api/products/[id]`
- [x] `GET /api/products/summary` — metrics for dashboard
- [x] Zod schemas for request bodies
- [x] Server-side role check on all mutations (`requireAdmin`)

### Phase 4 — Dashboard UI ⬜ Not started

- [ ] Dashboard layout (responsive)
- [ ] Summary metric cards (≥2)
- [ ] Product table with filter + sort
- [ ] Admin: create / edit / delete UI
- [ ] Viewer: read-only UI

### Phase 5 — Polish & bonus ⬜ Not started

- [ ] Choose 1–2 bonus areas
- [ ] Deploy (Vercel recommended for Next.js)
- [ ] GitHub Actions CI (if chosen)
- [ ] Final README (all required sections)

### Phase 6 — Interview prep ⬜ Not started

- [ ] Walk through architecture verbally
- [ ] Practice explaining auth flow end-to-end
- [ ] Practice scalability / multi-tenancy answers
- [ ] Review every file you didn't write alone

---

## README Checklist

Final `README.md` must include (per assessment PDF):

- [ ] **Setup instructions** — run locally in under 5 minutes
- [ ] **Architecture overview** — diagram + component descriptions
- [ ] **Database schema** — collections, fields, relationships
- [ ] **Security decisions** — auth + role enforcement end-to-end
- [ ] **Trade-offs & scope decisions** — what was cut and why
- [ ] **What's next** — priorities if you had another week
- [ ] **AI tool usage** — which tools, how they helped
- [ ] **Frameworks used** — Next.js, Tailwind, Firebase, etc.

---

## Evaluation Rubric

| Area | What reviewers look for |
|------|-------------------------|
| Architecture & design | Separation of concerns, defensible module structure |
| Auth & security | Correct Firebase integration, server-side roles, no obvious gaps |
| Code quality | Readable, consistent, maintainable; comments where non-obvious |
| Database design | Appropriate Firestore model, documented schema, scale considerations |
| Frontend | Reusable components, state management, responsive, accessible markup |
| README & docs | Clear setup, architecture, honest trade-offs |
| AI tool usage | Smart acceleration with full ownership of output |

---

## Interview Prep Topics

Be ready to explain:

1. **Why Next.js API routes** instead of a separate Express service?
2. **How custom claims work** and when they propagate to the client token
3. **Why enforce roles on the server** even if UI hides buttons?
4. **Firestore vs SQL** for this use case — trade-offs
5. **How you'd add multi-tenancy** without a full rewrite
6. **What breaks at 10× scale** and your mitigation plan
7. **Session strategy** — Bearer token vs httpOnly cookie — your choice and why
8. **Every AI-generated line** — refactor anything you don't fully understand

---

## Progress Tracker

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 0 — Foundation | ✅ Complete | Firebase SDK wired; add `.env.local` locally |
| Phase 1 — Database design | ✅ Complete | Deploy `firestore.rules` in Firebase Console |
| Phase 2 — Authentication | ✅ Complete | Test sign-up → first user is admin |
| Phase 3 — Data layer + API | ✅ Complete | Study + Phase 4 UI next |
| Phase 4 — Dashboard UI | ⬜ Not started | — |
| Phase 5 — Polish & bonus | ⬜ Not started | — |
| Phase 6 — Interview prep | ⬜ Not started | — |

---

## Session Notes

### Session 1 — Planning (June 25, 2026)

**What we did:**
- Read and analyzed `2026 06 June fullstack_take_home_challenge.pdf`
- Agreed on collaborative, step-by-step build approach (not a full AI dump)
- Defined architecture, schema, security model, and phased plan
- Confirmed tech decisions (see [Our Decisions](#our-decisions))
- Created this `PROJECT_PLAN.md` reference document
- GitHub repo created: https://github.com/jaiman25400/saas-product-dashboard

**Next step:** Phase 0 — scaffold Next.js project, init git, connect remote, create Firebase project together.

### Session 2 — Phase 0 start (June 25, 2026)

**What we did:**
- Scaffolded Next.js 16 (App Router, TypeScript, Tailwind v4, ESLint) in workspace root
- Package name: `saas-product-dashboard`
- Git repo initialized (create-next-app); remote added; branch renamed to `main`
- Committed `PROJECT_PLAN.md`; assessment PDF kept local only (in `.gitignore`)

**Next step:** Create Firebase project, then Phase 0 items 3–5 (env vars, Firebase SDK wiring).

### Session 3 — Phase 0 Firebase wiring (June 25, 2026)

**What we did:**
- User created Firebase project (email/password auth, Firestore test mode, web app, service account)
- Added `.env.example`, fixed `.gitignore` to allow it
- Installed `firebase` + `firebase-admin`
- Added `src/lib/firebase/client.ts` (browser) and `admin.ts` (server-only)
- Added `GET /api/health/firebase` to verify Admin SDK connection

**Next step:** User copies `.env.example` → `.env.local`, then Phase 1 (schema + Firestore rules).

### Session 4 — Phase 1 database design (June 25, 2026)

**What we did:**
- Added `src/types/` — `role.ts`, `user.ts`, `product.ts`
- Added `firestore.rules` — auth-gated reads, server-only writes
- Added `firestore.indexes.json` — composite indexes for filter + sort

**Next step:** Deploy rules in Firebase Console, then Phase 2 (authentication).

### Session 5 — Phase 2 authentication (June 25, 2026)

**What we did:**
- Auth API routes: `/api/auth/register`, `/api/auth/session`, `/api/auth/logout`
- `AuthProvider` context, login/signup pages, dashboard shell
- Middleware + session cookies for route protection
- First registered user → `admin` custom claim; others → `viewer`

**Next step:** Phase 3 — product repository, service, and API routes.

### Session 6 — Phase 3 product API (June 25, 2026)

**What we did:**
- `ProductRepository`, `ProductService`, Zod validation
- API: `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]`, `GET /api/products/summary`
- Admin-only mutations; viewers can read

**Next step:** Study Phase 3, then Phase 4 dashboard UI.

---

*Update this file at the end of each working session.*
