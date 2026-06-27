# Phase 4 — Interview Revision Sheet

> Quick recap — Dashboard UI. See `PHASE_3_REVISION.md` for API layer, `PHASE_1_2_REVISION.md` for auth.

---

## Architecture (UI layer)

```
Server page (dashboard/page.tsx)
    → getSessionUser() → pass serverRole
Client orchestrator (dashboard-content.tsx)
    → apiFetch (cookie) → Phase 3 API routes
    → presentational components (table, filters, metrics, modal)
```

---

## Files map

| File | Role |
|------|------|
| `lib/api/client.ts` | Shared `fetch` wrapper — cookie + JSON + errors |
| `lib/api/products.ts` | Typed functions per endpoint |
| `app/(dashboard)/dashboard/page.tsx` | Server Component — reads session, renders client UI |
| `components/dashboard/dashboard-content.tsx` | State, data loading, CRUD orchestration |
| `components/dashboard/metric-cards.tsx` | Summary metrics display |
| `components/dashboard/product-filters.tsx` | Status, category, sort controls |
| `components/dashboard/product-table.tsx` | Product list + admin actions |
| `components/dashboard/product-form-modal.tsx` | Create / edit form |

---

## Server vs Client split

| Piece | Type | Why |
|-------|------|-----|
| `dashboard/page.tsx` | **Server** | Already verified by layout; reads role from cookie |
| `DashboardContent` | **Client** (`"use client"`) | `useState`, `useEffect`, modals, `window.confirm` |
| `MetricCards`, `ProductTable`, etc. | **Client** (imported by client parent) | Event handlers, interactive UI |

**Rule:** Server = trust boundary + initial data. Client = interactivity. Security still enforced on API.

---

## API client flow

```
DashboardContent
    → fetchProducts(filters)  in lib/api/products.ts
    → apiFetch("/api/products?...")  in lib/api/client.ts
    → fetch(url, { credentials: "include" })
    → Browser sends httpOnly session cookie automatically
    → API route: requireSessionUser() / requireAdmin()
```

### Why `credentials: "include"`?

Same-origin `fetch` does **not** always send cookies unless you ask. Our auth is the **session cookie** — without `include`, APIs return **401**.

### Why a wrapper (`apiFetch`)?

- One place for `Content-Type`, cookie, error parsing
- Throws `ApiError` with `status` — UI can show message
- Typed return `apiFetch<T>()` — reuse across dashboard

---

## Role gating (UI only)

```tsx
// page.tsx (server)
<DashboardContent serverRole={user!.role} />

// dashboard-content.tsx (client)
const { role: clientRole } = useAuth();
const role = clientRole ?? serverRole;
const isAdmin = role === "admin";
```

| Source | When used |
|--------|-----------|
| `serverRole` | First paint — from verified session cookie |
| `clientRole` | After `AuthProvider` hydrates from Firebase |
| `clientRole ?? serverRole` | Avoid flash of wrong UI while client loads |

**Interview line:** *"UI gating is UX. API `requireAdmin()` is security."*

Viewer never sees Add / Edit / Delete. A malicious user could still call `POST /api/products` — server returns **403**.

---

## Data flow in `DashboardContent`

### Load on mount
1. `useEffect` → `fetchProductSummary()` → `GET /api/products/summary` (setState in `.then()` only)
2. `useEffect` → `fetchProducts(filters)` → `GET /api/products?sortBy=...` (re-runs when `filters` change)

### Filter change
- `ProductFilters` calls `handleFiltersChange(newFilters)`
- Sets `loadingProducts(true)` then `setFilters`
- `filters` in effect deps → refetch

### Create / Edit
1. Open modal (`modalMode`, `selectedProduct`)
2. `ProductFormModal` submits → `handleSave(input)`
3. `createProduct` or `updateProduct` → API
4. `refreshAll()` — reload summary + list (metrics stay in sync)

### Delete
1. `window.confirm` — simple v1 pattern
2. `deleteProduct(id)` → API
3. `refreshAll()`

---

## Component responsibilities

| Component | Props in | Events out | Notes |
|-----------|----------|------------|-------|
| `MetricCards` | `summary`, `loading` | — | Pure display |
| `ProductFilters` | `filters` | `onChange` | Controlled inputs |
| `ProductTable` | `products`, `isAdmin` | `onEdit`, `onDelete` | No fetch logic |
| `ProductFormModal` | `open`, `mode`, `product` | `onSubmit`, `onClose` | Form state internal |
| `DashboardContent` | `serverRole` | — | Wires everything |

**Pattern:** Smart container + dumb presentational components — easy to test and explain in interviews.

---

## Key concepts

| Topic | Answer |
|-------|--------|
| Why not fetch in Server Component? | Filters/modals need client state; could hybrid later (RSC initial list + client mutations) |
| Data fetch in `useEffect` | setState in async `.then()` — avoids React 19 cascading render lint |
| `handleFiltersChange` | Sets loading before filter state — not in effect |
| Modal `key` prop | Remounts form with correct initial values — no effect sync |
| `refreshAll` after mutate | Keeps metrics + table consistent without manual cache |
| `ProductResponse` vs `Product` | API JSON uses ISO date strings; Firestore uses Timestamps |
| Empty table message | Different copy for admin vs viewer |

---

## Trade-offs (README / interview)

- **No React Query / SWR** — manual `useState` + `useEffect` keeps scope small; mention you'd add caching in production
- **`window.confirm` for delete** — fine for take-home; production → accessible modal
- **Full refetch after CRUD** — simple; at scale → optimistic updates or invalidate one query
- **No pagination UI** — API supports list; bonus feature for Phase 5

---

## End-to-end trace (admin creates product)

```
1. Click "Add product" → modalOpen = true
2. Fill form → ProductFormModal onSubmit
3. createProduct(input) → POST /api/products (cookie)
4. Route: requireAdmin() → service → repo → Firestore
5. refreshAll() → GET summary + GET list
6. MetricCards + ProductTable re-render with new data
```

---

*Phase 5 next: deploy, README, optional bonus (pagination, CI)*
