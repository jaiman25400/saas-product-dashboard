# Phase 5 — CI/CD Study Guide

> Bonus: **CI/CD done well** — one bonus area, industry-style pipeline without overload.

---

## Philosophy: one bonus, done properly

The PDF says: *"We'd rather see one bonus area done well than three done poorly."*

Our approach:

| Do | Don't |
|----|-------|
| Lint + unit tests + smoke tests + build | E2E suite, 100% coverage, deploy in Actions |
| Test business rules (Zod, errors, auth guards) | Test every UI component |
| Liveness + Firebase readiness probes | Full Firestore integration tests |
| Parallel jobs for speed | Five redundant workflows |

---

## Test pyramid (what we run)

```
        ┌─────────────────────┐
        │  Smoke / integration │  health, Firebase, 401/403 API
        │  (few, slower)       │
        ├─────────────────────┤
        │  Unit tests          │  Zod validation, error mapping
        │  (many, fast, free)  │
        ├─────────────────────┤
        │  Lint                │  ESLint / React rules
        └─────────────────────┘
              Build (compile proof)
```

### Unit tests — `npm run test:unit` (no secrets)

File: `tests/unit/validations-and-errors.test.ts`

| Test | Type | Why |
|------|------|-----|
| Valid product body | Positive | Happy path for create schema |
| Empty name | Negative | Rejects bad input |
| Price = 0 | Negative | Business rule |
| Price as string | Negative | Protects revenue math |
| Query defaults | Positive | `sortBy` / `sortOrder` defaults |
| Invalid status filter | Negative | Query validation |
| Unauthorized → 401 | Negative | Error mapper |
| Forbidden → 403 | Negative | Error mapper |
| Not found → 404 | Negative | Error mapper |

### Smoke tests — `npm run test:integration`

| File | What | Secrets? |
|------|------|----------|
| `health.test.ts` | `GET /api/health` liveness | No |
| `health.firebase.test.ts` | `GET /api/health/firebase` Admin SDK | Yes — **skipped** if env missing |
| `products.auth.test.ts` | GET 401, POST 403 (mocked session) | No |

### Health endpoints

| Route | Purpose |
|-------|---------|
| `GET /api/health` | **Liveness** — app is up, no Firebase |
| `GET /api/health/firebase` | **Readiness** — Admin SDK + credentials work |

Use liveness in CI always; Firebase readiness when secrets are configured.

---

## CI workflow — full flow explained

File: `.github/workflows/ci.yml`

### Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

Runs on every push to `main` and every PR targeting `main`.

### Concurrency

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

If you push 3 times quickly, GitHub **cancels** older runs — saves minutes, faster feedback.

### Job graph

```
         ┌─────────┐     ┌─────────────┐
         │  lint   │     │ unit-tests  │   ← parallel, no secrets
         └────┬────┘     └──────┬──────┘
              │                 │
              └────────┬────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
   ┌──────────┐              ┌──────────────────┐
   │  build   │              │ integration-tests │   ← parallel, smoke + Firebase
   └──────────┘              └──────────────────┘
```

### Job 1: `lint`

1. `checkout` — clone repo
2. `setup-node` — Node 20 + npm cache
3. `npm ci` — clean install from lockfile
4. `npm run lint` — ESLint

**No secrets.** Fails fast on code style / React hooks issues.

### Job 2: `unit-tests`

Same setup → `npm run test:unit`

**No secrets.** Tests Zod + `apiErrorResponse` in isolation.

### Job 3: `build` (needs lint + unit-tests)

Same setup → `npm run build` with **9 Firebase env vars** from GitHub Secrets.

Proves TypeScript + Next.js production build works in a clean environment (same as Vercel).

### Job 4: `integration-tests` (needs lint + unit-tests)

Same setup → `npm run test:integration` with Firebase secrets.

- Liveness health — always runs
- Auth guard tests — mocked, always runs
- Firebase health — runs when secrets present; skipped locally without `.env.local`

**Build and integration run in parallel** — optimization, both only need fast checks to pass first.

---

## Why this is "industry standard" without overload

| Practice | Our implementation |
|----------|-------------------|
| Fast feedback | Lint + unit tests parallel, ~30s |
| No secrets in unit tests | Validation tests are pure |
| Smoke / readiness probes | `/api/health` + `/api/health/firebase` |
| Negative path testing | 401, 403, invalid Zod |
| Mocked boundaries | `vi.mock` for session in API auth tests |
| Build gate | `next build` before ship |
| Cancel stale runs | `concurrency` |
| Deploy separation | Vercel deploys; CI verifies quality |

What we **skipped** (correct for take-home scope):

- Playwright E2E
- Contract tests against real Firestore
- Deploy job in Actions (Vercel Git hook is enough)
- 80% coverage targets

---

## Local commands

```bash
npm run lint              # same as CI lint job
npm run test:unit         # fast, no .env needed
npm run test:integration  # health + auth; Firebase test needs .env.local
npm run test              # all tests
npm run build             # needs .env.local
```

---

## GitHub secrets + Vercel

See previous sections in this doc — 9 variables in:

- GitHub → Settings → Secrets → Actions
- Vercel → Project → Environment Variables
- Local → `.env.local` (from `.env.example`)

After Vercel deploy: add domain to **Firebase Auth → Authorized domains**.

---

## Interview talking points

1. **Why a test pyramid?** Fast unit tests catch logic bugs cheaply; smoke tests catch wiring; E2E is expensive — we chose depth where it matters.
2. **Why mock session in API tests?** Tests auth **guards** without spinning up Firebase or cookies.
3. **Why two health endpoints?** Liveness vs readiness — standard Kubernetes pattern.
4. **Why parallel jobs?** Lint and unit tests don't depend on each other — run together.
5. **One bonus done well** — CI/CD with lint, tests, build, deploy docs — not three half-finished bonuses.

---

## Self-test

1. Which jobs need GitHub secrets?
2. What runs if Firebase admin env is missing locally?
3. What's the difference between `/api/health` and `/api/health/firebase`?
4. Why are Zod tests unit tests, not integration tests?
5. Draw the CI job dependency graph from memory.

---

*Optional second bonus: search & pagination, or observability*
