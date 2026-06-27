# Phase 1 & 2 — Interview Revision Sheet

> Quick recap before walkthrough/interview. Read `PROJECT_PLAN.md` for full detail.

---

## Phase 1 — Database Design

### What we built
- `src/types/` — `Role`, `UserProfile`, `Product`, `ProductDocument`
- `firestore.rules` — security rules
- `firestore.indexes.json` — structured composite indexes (not vector)

### Collections
| Collection | Doc ID | Key fields |
|------------|--------|------------|
| `users` | Auth `uid` | `email`, `role`, `createdAt` |
| `products` | auto | `name`, `category`, `price`, `status`, `createdAt`, `updatedAt`, `createdBy` |

### Firestore rules (summary)
| Collection | Client read | Client write |
|------------|-------------|--------------|
| `users/{uid}` | Own profile or admin | **Denied** — API only |
| `products/{id}` | Any signed-in user | **Denied** — API only |

### Indexes
- `status` + `createdAt` — filter by status, sort by date
- `category` + `createdAt` — filter by category
- `organizationId` + `status` + `createdAt` — future multi-tenancy

### Key terms
- **Collection** — top-level bucket (`/products`)
- **Collection group** — all `products` collections anywhere in DB
- **queryScope: COLLECTION** — our indexes target top-level `/products` only

### Interview one-liner
*"Schema + rules first. Client writes blocked; Admin SDK in API routes. Composite indexes for filter + sort."*

---

## Phase 2 — Authentication

### Auth flow (memorize)

```
SIGN UP
  createUserWithEmailAndPassword → JWT (no role yet)
  → POST /api/auth/register  (Bearer JWT) → custom claims + users/{uid}
  → getIdToken(true) → POST /api/auth/session (Bearer) → httpOnly cookie
  → /dashboard

SIGN IN
  signInWithEmailAndPassword → POST /api/auth/session → cookie → /dashboard

PROTECTED
  middleware (cookie exists?) → layout getSessionUser() (verify cookie)

SIGN OUT
  POST /api/auth/logout + Firebase signOut → /login
```

### Two SDKs
| SDK | Where | Purpose |
|-----|-------|---------|
| `firebase` (client) | Browser | Sign-in, password, client auth state |
| `firebase-admin` (server) | API routes, layouts | Verify tokens, claims, session cookies, Firestore writes |

### Two auth states (don't confuse)
| Layer | Mechanism | Used for |
|-------|-----------|----------|
| **Server** | httpOnly session cookie | Middleware, dashboard layout, APIs |
| **Client** | Firebase + `AuthProvider` | Forms, UI, `onAuthStateChanged` |

**Rule:** Client role = display. Server session + API = security.

### API routes
| Route | Input | Does |
|-------|-------|------|
| `POST /api/auth/register` | `Authorization: Bearer <JWT>` | First user → admin; sets claims + `users` doc |
| `POST /api/auth/session` | `Authorization: Bearer <JWT>` | JWT → httpOnly session cookie |
| `POST /api/auth/logout` | — | Clears cookie (`maxAge: 0`) |

### Key files
| File | Role |
|------|------|
| `lib/auth/constants.ts` | Cookie name + TTL (ms + sec) |
| `lib/auth/session.ts` | `createSessionCookie`, `verifySessionCookie`, `getSessionUser`, `requireAdmin` |
| `middleware.ts` | Fast gate — cookie exists? |
| `(dashboard)/layout.tsx` | Full verify — `getSessionUser()` |
| `contexts/auth-provider.tsx` | Client: `signUp`, `signIn`, `onAuthStateChanged` |

### Security essentials
- **httpOnly cookie** — JS can't read it (XSS mitigation)
- **Bearer JWT** — only to bootstrap session / register; not stored in localStorage
- **Never trust URL** (`?role=admin`) or client React state for authorization
- **Least privilege** — unknown role → `viewer`
- **`import "server-only"`** on admin/session code

### Tokens (simple)
| Token | Lifetime | Our use |
|-------|----------|---------|
| ID token (JWT) | ~1 hour | Bootstrap register + session |
| Session cookie | 5 days | Every server request |
| Refresh token | Long | Firebase SDK handles silently — we don't code it |

### `router.replace` vs `push`
Use **`replace`** after login/signup so Back button doesn't return to auth form.

### Defense in depth
```
middleware     → cookie exists?
layout         → cookie cryptographically valid (Firebase Admin)
API routes     → requireSessionUser / requireAdmin (Phase 3)
firestore.rules → block direct client writes
```

### Known trade-offs (say honestly)
- First-user-admin has a **race condition** — fix with transaction or seed script in prod
- Middleware doesn't verify cookie — layout does
- Register role logic: `users` collection empty check

### Top interview answers
1. Why session cookie not JWT in localStorage? → XSS can't steal httpOnly cookie
2. Why two SDKs? → Client for passwords; Admin for trusted server ops
3. Why `getIdToken(true)` after register? → Custom claims need token refresh
4. Why Context not props? → Avoid prop drilling for cross-cutting auth
5. Why `POST` logout? → Prevent accidental logout via GET/link prefetch

---

## Phase status
| Phase | Status |
|-------|--------|
| Phase 0 — Foundation | ✅ |
| Phase 1 — Database | ✅ |
| Phase 2 — Auth | ✅ |
| Phase 3 — Product API | ✅ |
| Phase 4 — Dashboard UI | Next |

---

*Last updated: Phase 2 study complete*
