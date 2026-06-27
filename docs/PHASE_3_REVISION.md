# Phase 3 — Interview Revision Sheet

> Quick recap — Product API layer. See `PHASE_1_2_REVISION.md` for auth.

---

## Architecture (3 layers)

```
API route  →  auth + Zod parse + HTTP response
Service    →  business rules + role checks
Repository →  Firestore only (DAL)
```

---

## Files map

| File | Role |
|------|------|
| `lib/validations/product.ts` | Zod: create, update, list query |
| `lib/api/errors.ts` | Errors → 400/401/403/404/500 |
| `types/product-api.ts` | JSON shapes + `toProductResponse()` |
| `repositories/product.repository.ts` | Firestore CRUD + summary |
| `services/product.service.ts` | Admin checks + calls repo |
| `app/api/products/route.ts` | GET list, POST create |
| `app/api/products/[id]/route.ts` | GET, PATCH, DELETE |
| `app/api/products/summary/route.ts` | Dashboard metrics |

---

## API endpoints

| Method | URL | Auth | Action |
|--------|-----|------|--------|
| GET | `/api/products` | Signed in | List (+ query filters) |
| POST | `/api/products` | Admin | Create → **201** |
| GET | `/api/products/summary` | Signed in | Metrics |
| GET | `/api/products/[id]` | Signed in | One product |
| PATCH | `/api/products/[id]` | Admin | Partial update |
| DELETE | `/api/products/[id]` | Admin | Delete |

### Query params (GET list)
`?status=active&category=Electronics&sortBy=createdAt|name|price&sortOrder=asc|desc`

### Create body (POST)
```json
{ "name": "", "category": "", "price": 29.99, "status": "active|inactive" }
```

---

## Session → API flow

```
Browser sends Cookie: session=... (automatic on same origin)
    → route: requireSessionUser() / requireAdmin()
    → session.ts: verifySessionCookie() → { uid, email, role }
    → productService(user, ...)
```

---

## HTTP status codes

| Code | When |
|------|------|
| **200** | GET success |
| **201** | POST created new resource |
| **400** | Zod validation failed |
| **401** | Not logged in |
| **403** | Logged in, not admin (mutations) |
| **404** | Product not found |

---

## Key concepts

| Topic | Answer |
|-------|--------|
| Zod vs TypeScript | Zod = runtime validation; TS = compile time only |
| `createProductSchema` vs `update` | Update = `.partial()` — all fields optional |
| `z.number()` for price | Reject `"29.99"` string — protects revenue math |
| `FieldValue.serverTimestamp()` | Server time, not client — trusted audit |
| `findById` returns null | Service converts to 404 |
| Repo no auth | Separation of concerns — service + route check roles |
| `snapshot.data()!` | Non-null assertion after `.exists` check |
| `toProductResponse` | Timestamp → ISO string for JSON |
| Static `summary/` vs `[id]` | Static route wins over dynamic segment |
| POST vs PATCH | POST creates; PATCH updates existing by id |

---

## Auth on mutations (defense in depth)

1. Route: `requireAdmin()`
2. Service: `if (user.role !== "admin")`
3. Firestore rules: deny client writes

---

## Trade-offs (README)

- `getSummary()` loads all docs — fine for demo; cache at scale
- `findAll` in-memory sort when index missing
- Hard delete — no soft-delete in v1

---

## Test product (browser console, admin session)

```javascript
fetch("/api/products", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Wireless Mouse",
    category: "Electronics",
    price: 29.99,
    status: "active",
  }),
}).then((r) => r.json()).then(console.log);
```

---

*Phase 4 next: Dashboard UI (table, filters, metrics, admin CRUD forms)*
