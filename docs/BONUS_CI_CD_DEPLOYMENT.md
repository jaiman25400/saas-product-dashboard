# Bonus — CI/CD & Deployment Study Guide

> First bonus area: pipeline quality + Vercel deploy. Pair with `PHASE_5_CI_CD_STUDY.md` for test details.

---

## What “done well” means here

One bonus area, not three rushed ones:

| Included | Why |
|----------|-----|
| GitHub Actions (lint + unit + smoke + build) | Proves quality on every push |
| Health probes (`/api/health`, `/api/health/firebase`) | Industry liveness/readiness pattern |
| Vercel deployment | Live URL for reviewers |
| Env vars in 3 places | Local, CI, production — same contract |

Not included (correct for scope): E2E Playwright, deploy job in Actions, multi-region.

---

## End-to-end deployment flow

```
Developer laptop
  .env.local → npm run dev
       │
       ▼
git push → GitHub (main)
       │
       ├─► GitHub Actions CI
       │     lint ∥ unit-tests → build ∥ smoke tests
       │
       └─► Vercel (Git integration)
             reads repo → npm run build → deploy
             uses Vercel env vars (same 9 as .env.local)
       │
       ▼
https://your-app.vercel.app
       │
       ▼
Firebase Auth must allow this domain (Authorized domains)
```

---

## Step-by-step: Vercel (you did this)

### 1. Import existing repo

- **Add New → Project → Import** `jaiman25400/saas-product-dashboard`
- Do **not** use “Create a new Git repository” (that causes name collision)

### 2. Environment variables (before deploy)

Copy all 9 values from `.env.local` into Vercel → Settings → Environment Variables:

- 6 × `NEXT_PUBLIC_FIREBASE_*`
- 3 × `FIREBASE_ADMIN_*`

Enable for **Production** (and **Preview** if you want PR previews to work with auth).

### 3. Deploy

Vercel runs `npm run build` and hosts the app.

### 4. Firebase authorized domains

**Authentication → Settings → Authorized domains** → add:

`your-project.vercel.app`

Without this, login works locally but **fails in production**.

### 5. GitHub Actions secrets

Same 9 variables under **GitHub → Settings → Secrets → Actions**.

CI build + Firebase smoke test need them. Vercel and GitHub secrets are **separate** — set both.

---

## CI workflow explained (`.github/workflows/ci.yml`)

### Trigger

Runs on push/PR to `main`.

### Job graph

```
lint ──────────┐
               ├──► build (needs secrets)
unit-tests ────┤
               └──► integration-tests / smoke (needs secrets)
```

`lint` and `unit-tests` run **in parallel** — no secrets, fast.

`build` and `smoke` run **in parallel** after fast checks pass.

### What each job proves

| Job | Proves |
|-----|--------|
| Lint | Code style, React 19 rules |
| Unit tests | Zod, errors, cursor encode/decode |
| Build | `next build` works in clean environment |
| Smoke | Liveness health, API auth guards, Firebase readiness |

### Concurrency

Cancels outdated runs when you push again — saves CI minutes.

---

## Health endpoints (for reviewers / ops)

| URL | Type | Needs Firebase? |
|-----|------|-----------------|
| `GET /api/health` | Liveness | No |
| `GET /api/health/firebase` | Readiness | Yes |

Try on production after deploy:

```
https://your-app.vercel.app/api/health
https://your-app.vercel.app/api/health/firebase
```

---

## Before you submit to the company — data cleanup

You asked: *“We have data in the database — delete everything first?”*

**Recommendation: don’t delete everything blindly. Curate a clean demo.**

| Approach | When to use |
|----------|-------------|
| **Curate demo data (recommended)** | Delete your personal test junk; leave 3–5 sample products + 1 admin account for reviewers |
| **Fresh Firebase project** | Maximum isolation; more setup time |
| **Delete all Firestore data** | Only if you also reset Auth users — otherwise orphaned accounts |

### Suggested pre-submission checklist

1. **Firestore `products`** — delete test/random products; add 3–5 realistic samples (different categories/statuses) so pagination/search look good live.
2. **Auth users** — optional: keep one `admin@demo.com` you share in README; delete your personal test emails.
3. **`users/{uid}` docs** — match Auth users you keep; remove orphans.
4. **Do not commit** `.env.local` or service account JSON.
5. **README** — include live URL + demo login (or “sign up first user = admin”).
6. **Verify production** — login, dashboard, CRUD, search, pagination on live URL.

### What reviewers care about

- App works on the **live link**
- Clean, intentional demo data
- They do **not** need your messy dev test data

**Interview line:** *“I kept a curated demo dataset for submission and documented demo credentials in the README.”*

---

## Common production issues

| Symptom | Fix |
|---------|-----|
| Auth fails on Vercel only | Add Vercel domain to Firebase authorized domains |
| Build OK, runtime 500 | Missing/wrong env var in Vercel |
| CI build fails, Vercel OK | Add secrets to GitHub Actions |
| Session cookie issues | Vercel uses HTTPS — `secure: true` in prod is correct |

---

## Self-test

1. Name the 3 places env vars live.
2. Why import GitHub repo instead of creating a new one on Vercel?
3. What runs in CI without secrets?
4. What should you do with Firestore data before submission?

---

*Second bonus: `BONUS_SEARCH_PAGINATION.md`*
