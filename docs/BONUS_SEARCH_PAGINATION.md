# Bonus — Search & Pagination Study Guide

> Second bonus area: server-side search + Firestore cursor pagination.

---

## What we built

| Feature | Implementation |
|---------|----------------|
| **Search** | Server-side `search` query param — matches name or category (case-insensitive) |
| **Pagination** | Firestore **cursor-based** (`startAfter` + document snapshot) |
| **Page size** | `limit` query param (default 10, max 50) |
| **UI** | Search bar, per-page selector, Previous/Next buttons |

---

## API contract

### Request

```
GET /api/products?search=mouse&limit=10&cursor=<opaque>&sortBy=createdAt&sortOrder=desc
```

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `search` | string | — | Optional; filters name + category |
| `limit` | number | 10 | 1–50 |
| `cursor` | string | — | Opaque token from previous response |
| `status` | active/inactive | — | Firestore `where` |
| `category` | string | — | Exact match (or in-memory with status filter) |
| `sortBy` | createdAt/name/price | createdAt | |
| `sortOrder` | asc/desc | desc | |

### Response

```json
{
  "products": [ /* ProductResponse[] */ ],
  "pagination": {
    "limit": 10,
    "nextCursor": "base64url-token-or-null",
    "hasMore": true
  }
}
```

---

## Architecture flow

```
ProductFilters (search, limit, filters)
    ↓
DashboardContent (cursor + cursorHistory state)
    ↓
fetchProductsPage({ ...filters, cursor })
    ↓
GET /api/products?...
    ↓
productService.listProductsPage()
    ↓
productRepository.findPage()
    ↓
Firestore: orderBy → startAfter(cursorDoc) → limit(n+1)
```

---

## Firestore cursor pagination (the bonus point)

### Why cursors, not offset?

| Offset (`page=5`) | Cursor (`startAfter`) |
|-------------------|------------------------|
| Firestore skips N docs — slow + costly at scale | Starts after last seen doc — stable cost |
| Duplicates/skips if data changes between pages | Consistent forward paging |
| `OFFSET` not native in Firestore | **Recommended pattern** |

### How our cursor works

File: `src/lib/pagination/cursor.ts`

```
documentId → encode base64url → cursor string
cursor string → decode → documentId
```

In repository:

```typescript
// 1. Build ordered query
query.orderBy(sortBy, sortOrder).orderBy(FieldPath.documentId(), sortOrder)

// 2. Resume from cursor
const cursorDoc = await collection.doc(decodeCursor(cursor)).get();
query = query.startAfter(cursorDoc);

// 3. Fetch one extra to detect more pages
snapshot = await query.limit(limit + 1).get();
hasMore = snapshot.size > limit;
```

`FieldPath.documentId()` is a **tie-breaker** so ordering is stable when two products share the same `createdAt`.

### Detecting “next page”

Fetch `limit + 1` documents:

- Return first `limit` to client
- If `limit + 1` arrived → `hasMore: true`
- `nextCursor` = encoded ID of last returned product

---

## Search (server-side)

Firestore has **no full-text search**. Our approach:

```typescript
product.name.toLowerCase().includes(term)
|| product.category.toLowerCase().includes(term)
```

Applied in `productRepository.findPage()` **after** Firestore fetch.

### With search active

- Firestore still pages with cursor on the **base query**
- We may **over-fetch** batches (`limit × 3`, max 5 batches) to fill a page after filtering
- Documented trade-off — fine for demo scale; production would use Algolia/Typesense/Elasticsearch

### Without search

- Pure cursor pagination — one Firestore round-trip per page

---

## UI state management

File: `dashboard-content.tsx`

| State | Purpose |
|-------|---------|
| `filters` | search, status, category, sort, limit |
| `cursor` | current page position |
| `cursorHistory` | stack for **Previous** button |

### Reset rules

When **filters/search/limit** change → reset `cursor` and `cursorHistory` (back to page 1).

When **Next** → push current cursor to history, set cursor to `pagination.nextCursor`.

When **Previous** → pop history, restore previous cursor.

---

## Files map

| File | Role |
|------|------|
| `lib/validations/product.ts` | `search`, `limit`, `cursor` in Zod schema |
| `lib/pagination/cursor.ts` | Encode/decode cursor |
| `repositories/product.repository.ts` | `findPage()` — Firestore + search |
| `types/product-api.ts` | `ProductListResponse`, `ProductPaginationResponse` |
| `app/api/products/route.ts` | Returns `products` + `pagination` |
| `lib/api/products.ts` | `fetchProductsPage()` |
| `components/dashboard/product-filters.tsx` | Search + per-page UI |
| `components/dashboard/product-pagination.tsx` | Prev/Next controls |
| `firestore.indexes.json` | Indexes for sort + filter combos |

---

## Trade-offs (mention in interview / README)

| Topic | Our choice | At scale |
|-------|------------|----------|
| Search | Substring in memory after fetch | Dedicated search index |
| Status + category both set | Category filtered in memory | Composite Firestore index |
| Cursor only forward in Firestore | UI adds Previous via history stack | Or keyset with bidirectional cursors |
| Summary metrics | Loads all products | Aggregates / cached counters |

---

## Example walkthrough

**Page 1** (no cursor):

```
GET /api/products?limit=2&sortBy=createdAt&sortOrder=desc
→ products: [A, B], nextCursor: "xxx", hasMore: true
```

**Page 2**:

```
GET /api/products?limit=2&cursor=xxx
→ startAfter(B's snapshot) → products: [C, D], hasMore: false
```

**With search**:

```
GET /api/products?search=mouse&limit=10
→ Firestore pages by date; server keeps docs matching "mouse"
```

---

## Tests

| Test | File |
|------|------|
| Cursor round-trip | `tests/unit/pagination-cursor.test.ts` |
| `limit`, `search`, `cursor` Zod | `tests/unit/validations-and-errors.test.ts` |
| Invalid cursor → 400 | `tests/unit/validations-and-errors.test.ts` |

---

## Deploy note

After changing `firestore.indexes.json`, redeploy indexes:

```bash
firebase deploy --only firestore:indexes
```

Firestore may prompt for new composite indexes on first query — check Firebase Console if pagination errors.

---

## Self-test

1. Why `limit + 1` in the repository?
2. What does `nextCursor` contain (conceptually)?
3. Why reset cursor when search changes?
4. Why isn’t search done purely in Firestore?
5. Offset vs cursor — one sentence each?

---

*Submission: curate demo products so search/pagination look good on live URL — see `BONUS_CI_CD_DEPLOYMENT.md`*
