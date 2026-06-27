# Phase 4 — Study Guide

> Full walkthrough for interview prep. Quick recap: `PHASE_4_REVISION.md`. Auth/API: `PHASE_1_2_REVISION.md`, `PHASE_3_REVISION.md`.

---

## What Phase 4 adds

Phase 3 built the **server API**. Phase 4 builds the **dashboard UI** that calls it.

```
Browser (React)  →  lib/api/*  →  apiFetch  →  /api/*  →  service  →  Firestore
```

The UI never talks to Firestore directly.

---

## Section 1 — `apiFetch` and the session cookie

### Why not JWT in the dashboard?

After login/register, the Firebase JWT is exchanged for an **httpOnly session cookie** via `POST /api/auth/session`. From then on:

| Layer | Auth mechanism |
|-------|----------------|
| Login/signup only | `Authorization: Bearer <JWT>` |
| Dashboard + all product APIs | `Cookie: session=...` (automatic) |

The dashboard JavaScript **cannot read** the cookie (`httpOnly`). It only asks the browser to **send** it.

### What `apiFetch` does

File: `src/lib/api/client.ts`

1. **`credentials: "include"`** — browser attaches session cookie
2. **`Content-Type: application/json`** — for POST/PATCH bodies
3. **Error handling** — `!response.ok` → throw `ApiError` with server message

### Is `apiFetch` only for listing products?

**No.** All dashboard API calls use it:

| Function | URL | Method | Query string? |
|----------|-----|--------|---------------|
| `fetchProductSummary()` | `/api/products/summary` | GET | No |
| `fetchProducts(filters)` | `/api/products?...` | GET | **Yes — only list** |
| `createProduct(input)` | `/api/products` | POST | No (JSON body) |
| `updateProduct(id, input)` | `/api/products/[id]` | PATCH | No (JSON body) |
| `deleteProduct(id)` | `/api/products/[id]` | DELETE | No |

**Query string** = GET filters. **JSON body** = create/update data.

---

## Section 2 — How the filter URL is built

### Step-by-step

```
1. User picks "active" in ProductFilters dropdown
2. onChange → handleFiltersChange → setFilters({ status: "active", ... })
3. filters in useEffect deps → effect re-runs
4. fetchProducts(filters) → buildProductsUrl(filters)
5. URLSearchParams → "/api/products?status=active&sortBy=createdAt&sortOrder=desc"
6. apiFetch(url) → browser GET with cookie
7. route.ts reads request.nextUrl.searchParams → Zod → Firestore query
```

### Key files

- `product-filters.tsx` — controlled inputs, calls `onChange`
- `dashboard-content.tsx` — owns `filters` state
- `lib/api/products.ts` — `buildProductsUrl()` + `fetchProducts()`

---

## Section 3 — Server vs Client split

| File | Type | Why |
|------|------|-----|
| `dashboard/page.tsx` | Server | `getSessionUser()` reads cookie safely |
| `dashboard/layout.tsx` | Server | Redirect if no session; header with role |
| `dashboard-content.tsx` | Client | State, effects, modals, CRUD handlers |
| `metric-cards`, `product-table`, etc. | Client (via parent) | Display + events |

### Role gating

```tsx
// Server passes verified role
<DashboardContent serverRole={user.role} />

// Client merges with Firebase hydration
const role = clientRole ?? serverRole;
const isAdmin = role === "admin";
```

**UI gating = UX. API `requireAdmin()` = security.**

Expired session on API call → **401 JSON** from route (not proxy). Proxy only guards `/dashboard` pages and checks cookie **exists**, not validity.

---

## Section 4 — Create / Edit / Delete (same pattern)

```
UI action → handleSave / handleDelete
    → lib/api/products.ts (createProduct / updateProduct / deleteProduct)
    → apiFetch (cookie + method + body if needed)
    → API route (requireAdmin + Zod)
    → service → repository → Firestore
    → refreshAll() → reload summary + list
```

| Action | HTTP | Server file |
|--------|------|-------------|
| Create | `POST /api/products` | `app/api/products/route.ts` |
| Edit | `PATCH /api/products/[id]` | `app/api/products/[id]/route.ts` |
| Delete | `DELETE /api/products/[id]` | same |

---

## Section 5 — Data fetching pattern (React 19)

### Problem

React 19 ESLint rule `react-hooks/set-state-in-effect` flags **synchronous** `setState` inside `useEffect` (e.g. calling `loadSummary()` which immediately does `setLoading(true)`).

### Solution

1. **Initial loading** — `useState(true)` so we don't need `setLoading(true)` on mount
2. **In effects** — fetch in effect, `setState` only in `.then()` / `.finally()` (async callbacks)
3. **Filter change** — `handleFiltersChange` sets `loadingProducts(true)` before `setFilters` (event handler, not effect)
4. **After CRUD** — `refreshAll()` called from event handlers (fine to set loading there)
5. **Modal form reset** — conditional render + `key` prop remounts form with fresh `useState` initializer (no `useEffect` to sync form)

```tsx
// Effect — setState only after fetch resolves
useEffect(() => {
  let cancelled = false;
  void fetchProductSummary()
    .then((data) => { if (!cancelled) setSummary(data); })
    .finally(() => { if (!cancelled) setLoadingSummary(false); });
  return () => { cancelled = true; };
}, []);

// Modal — remount on open context
{modalOpen ? (
  <ProductFormModal key={`${modalMode}-${selectedProduct?.id ?? "new"}`} ... />
) : null}
```

---

## Section 6 — Proxy (formerly middleware)

Next.js 16 renamed `middleware.ts` → `proxy.ts`, `middleware()` → `proxy()`.

Our `src/proxy.ts`:
- Matcher: `/dashboard/:path*` only
- Optimistic check: cookie **exists** → allow; missing → redirect to `/login`
- Real auth verification: layout `getSessionUser()` + API `requireSessionUser()`

---

## Architecture review (senior checklist)

| Area | Status | Notes |
|------|--------|-------|
| **Layering** | Good | UI → API client → routes → service → repo |
| **Security** | Good | httpOnly cookie, server role checks, Firestore rules deny client writes |
| **Defense in depth** | Good | Proxy + layout + API + service + rules |
| **Scalability** | Demo-ready | Full refetch, summary loads all docs — document trade-offs for interview |
| **Code quality** | Good | Typed API helpers, Zod validation, presentational components |
| **Future improvements** | Phase 5+ | React Query, pagination, accessible delete modal, proxy/API session refresh |

### Interview one-liner

> *"Dashboard is a client orchestrator. Typed helpers call apiFetch with credentials include. Server enforces auth on every mutation. UI hides admin actions but API is the trust boundary."*

---

## Self-test questions

1. Why `credentials: "include"` instead of JWT in dashboard code?
2. What builds `/api/products?status=active&...`?
3. Who reads the session cookie — `apiFetch` or the server?
4. Create vs list — query string or JSON body?
5. What happens on expired session during `createProduct()`?
6. Why is `isAdmin` in UI not enough for security?
7. Why refetch summary after delete, not just the table?

---

*Phase 5: deploy, README, optional bonus features*
