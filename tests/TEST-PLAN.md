# Voluntry — Test Plan

## Infrastructure

| Item | Value |
|---|---|
| Framework | Vitest 4.x |
| HTTP Testing | `supertest` (already installed) |
| Database | Real PostgreSQL — set `DATABASE_URL` in `.env.test` |
| Alias | `@/` → `src/` (configured in `vitest.config.ts`) |
| Pattern | Isolated route tests + sequential DB flow tests |

---

## 1. Unit Tests — `tests/unit/`

### `auth.test.ts` — NEW

| Test | Assertion |
|---|---|
| `hashPassword` returns bcrypt hash | Output starts with `$2a$10$` |
| `comparePassword` matches correct password | Returns `true` |
| `comparePassword` rejects wrong password | Returns `false` |
| `generateToken` produces valid JWT | 3-part dot-separated string |
| `verifyToken` decodes valid token | Returns `{ userId, role }` |
| `verifyToken` throws on expired token | Past `exp` → error |
| `verifyToken` throws on tampered token | Modified signature → error |
| `verifyToken` throws on wrong secret | Different secret → error |

### `validations.test.ts` — EXPAND existing

| Test | Assertion |
|---|---|
| [existing tests] | Already covered |
| `eventSchema` rejects endDate before startDate | Parse fails |
| `eventSchema` rejects past startDate | Parse fails (if rule added) |
| `registerSchema` rejects invalid email | Parse fails (if schema extracted) |
| `registerSchema` rejects short password (< 6) | Parse fails |
| `registerSchema` requires valid role enum | Must be VOLUNTEER / ORGANIZATION |

### `permissions.test.ts` — EXPAND existing

| Test | Assertion |
|---|---|
| [existing: `isAuthorized`, `getDashboardPath`] | Already covered |
| `decodeToken` returns null for invalid JWT | Garbage → `null` |
| `decodeToken` returns payload for valid JWT | `{ userId, role }` |
| `isUserApproved` returns `true` for approved user | DB integration |
| `isUserApproved` returns `false` for pending user | DB integration |

---

## 2. API Route Integration — `tests/integration/api/`

Uses `supertest` + real DB. Each file seeds in `beforeAll`, cleans up in `afterAll`.

### `auth.test.ts` — NEW

| Test | Expected |
|---|---|
| `POST /api/auth/register` — volunteer | 201, user + VolunteerProfile created |
| `POST /api/auth/register` — org | 201, user + OrganizationProfile created |
| `POST /api/auth/register` — duplicate email | 409 |
| `POST /api/auth/register` — missing fields | 400 (Zod) |
| `POST /api/auth/login` — valid credentials | 200, sets `auth_token` cookie |
| `POST /api/auth/login` — wrong password | 401 |
| `POST /api/auth/login` — non-existent email | 401 |
| `POST /api/auth/logout` | 200, clears cookie |
| `GET /api/auth/me` — authenticated | 200, `{ role }` |
| `GET /api/auth/me` — no cookie | 200, `{ role: null }` |
| `GET /api/auth/me` — invalid cookie | 200, `{ role: null }` |

### `events.test.ts` — NEW (API-level)

| Test | Expected |
|---|---|
| `GET /api/events` | 200, published future events only |
| `GET /api/events?category=X` | 200, filtered |
| `GET /api/events?skills=X` | 200, filtered |
| `GET /api/events?category=nonexistent` | 200, `[]` |
| `POST /api/events` — org creates | 201, DRAFT |
| `POST /api/events` — non-org | 403 |
| `POST /api/events` — unauthenticated | 401 |
| `POST /api/events` — invalid body | 400 |
| `GET /api/events/:id` | 200, includes `acceptedCount`, `hasApplied` |
| `GET /api/events/:id` — not found | 404 |
| `PATCH /api/events/:id` — owner | 200 |
| `PATCH /api/events/:id` — non-owner | 403 |
| `DELETE /api/events/:id` — owner | 200, cascade |
| `DELETE /api/events/:id` — non-owner | 403 |

### `applications.test.ts` — NEW

| Test | Expected |
|---|---|
| `POST /api/events/:id/apply` — volunteer | 201, PENDING |
| `POST /api/events/:id/apply` — duplicate | 409 |
| `POST /api/events/:id/apply` — event full | 400 |
| `POST /api/events/:id/apply` — unapproved volunteer | 403 |
| `POST /api/events/:id/apply` — non-volunteer | 403 |
| `GET /api/events/:id/applications` — owner org | 200 |
| `GET /api/events/:id/applications` — non-owner | 403 |
| `PATCH /api/applications/:id` — org accepts | 200, ACCEPTED |
| `PATCH /api/applications/:id` — org rejects | 200, REJECTED |
| `PATCH /api/applications/:id` — over capacity | 400 |
| `PATCH /api/applications/:id` — non-owner | 403 |

### `dashboard.test.ts` — NEW

| Test | Expected |
|---|---|
| `GET /api/dashboard/volunteer` — authed | 200, profile + apps + recs |
| `GET /api/dashboard/volunteer` — unapproved | 403 |
| `GET /api/dashboard/volunteer` — non-volunteer | 403 |
| `GET /api/dashboard/organization` — authed | 200, events + stats + pending |
| `GET /api/dashboard/organization` — non-org | 403 |

### `profile.test.ts` — NEW

| Test | Expected |
|---|---|
| `GET /api/profile/volunteer` — authed | 200 |
| `GET /api/profile/volunteer` — unauthed | 401 |
| `POST /api/profile/volunteer` — update | 200 |
| `POST /api/profile/volunteer` — partial | 200, only touched fields |
| `GET /api/profile/organization` — authed | 200 |
| `POST /api/profile/organization` — update | 200, resets status to PENDING |
| `POST /api/profile/organization` — missing org name | 400 |

### `admin.test.ts` — NEW

| Test | Expected |
|---|---|
| `GET /api/admin/stats` — admin | 200, all counts |
| `GET /api/admin/stats` — non-admin | 403 |
| `GET /api/admin/approvals` | 200, pending lists |
| `GET /api/admin/approved` | 200, approved lists |
| `PATCH /api/admin/users/:id/status` — approve | 200 |
| `PATCH /api/admin/users/:id/status` — reject | 200 |
| `PATCH /api/admin/users/:id/status` — non-admin | 403 |
| `GET /api/admin/users/:id/profile` | 200, full profile |

### `upload.test.ts` — NEW

| Test | Expected |
|---|---|
| `POST /api/upload` — image file | 200, returns URL |
| `POST /api/upload` — no file | 400 |
| `POST /api/upload` — wrong type | 400 |
| `POST /api/upload` — unauthed | 401 |

---

## 3. Stateful Flow Tests — `tests/integration/`

### `events.lifecycle.test.ts` — IMPROVE existing

| Step | Verification |
|---|---|
| Org creates PUBLISHED event | Event visible in listing |
| Volunteer applies | Application PENDING |
| Duplicate application blocked | 409 |
| Org views applications | Includes volunteer name, skills |
| Org accepts | Status → ACCEPTED |
| Fill to capacity | Overfill blocked at API level |
| Volunteer sees updated status | Status reflects ACCEPTED |

### `auth.flow.test.ts` — NEW

| Flow | Verification |
|---|---|
| Register → Login → Dashboard | Full round-trip accessible |
| Register org → Login → Create event | Event appears on dashboard |
| Admin login → View stats → Approve | Stats update |

---

## 4. Security Tests — `tests/integration/security/`

### `authorization.test.ts` — NEW

| Test | Expected |
|---|---|
| Expired JWT on protected route | 401 |
| Wrong role on endpoint | 403 |
| No cookie | 401 |
| Tampered cookie | 401 |
| SQL injection in search | 400 or empty |
| XSS in title/description | Escaped on render |

---

## 5. Infrastructure Improvements

| Item | Action |
|---|---|
| `.env.test` | Add with separate `DATABASE_URL` |
| `test:coverage` script | Add to `package.json` |

---

## Priority Order

| Priority | Area | Effort |
|---|---|---|
| **P0** | Auth API routes (register, login, me) | Medium |
| **P0** | Event API routes (CRUD, list, filter) | Medium |
| **P0** | Application API routes (apply, accept/reject) | Medium |
| **P1** | Admin API routes | Medium |
| **P1** | Dashboard API routes | Medium |
| **P1** | Profile API routes | Medium |
| **P2** | Unit tests for `auth.ts` | Small |
| **P2** | Security tests | Medium |
| **P3** | Upload tests | Small |
| **P3** | Stateful flow tests | Large |
