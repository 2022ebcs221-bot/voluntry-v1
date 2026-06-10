# Voluntry — Testing Report

**By:** Shubham Kumar
**Email:** 2022ebcs221@online.bits-pilani.ac.in
**Project:** Voluntry — Volunteer Event Management Platform
**Date:** May 2025

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Overview](#2-project-overview)
3. [Test Environment Setup](#3-test-environment-setup)
4. [Testing Strategy](#4-testing-strategy)
5. [Unit Tests](#5-unit-tests)
6. [Integration Tests — API Routes](#6-integration-tests--api-routes)
7. [Integration Tests — Stateful Flows](#7-integration-tests--stateful-flows)
8. [Security Tests](#8-security-tests)
9. [Test Summary](#9-test-summary)
10. [Key Decisions & Learnings](#10-key-decisions--learnings)

---

## 1. Introduction

This document covers the testing work done on the Voluntry platform. Voluntry is a web application built with Next.js (App Router), Prisma, PostgreSQL, and Tailwind CSS. It lets volunteers discover and apply to events, organizations create and manage events, and admins oversee the whole system.

The main focus of this testing phase was to build a solid test suite that covers the core features — authentication, event management, applications, dashboards, profiles, admin operations, file uploads, and security. All in all, **125 tests** were written across **12 test files**, and they all pass.

The tests use **Vitest** as the test runner and **Supertest-style direct handler calls** for testing API routes (no running server needed). The database used in tests is a real PostgreSQL instance — not an in-memory mock — so the tests genuinely exercise the database layer.

---

## 2. Project Overview

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jsonwebtoken) + httpOnly cookies |
| Testing | Vitest 4.1.6 |
| HTTP Testing | Direct handler invocation (no supertest) |
| Styling | Tailwind CSS |
| Validation | Zod |
| Password Hashing | bcryptjs |

### Prisma Data Model

The database has these main models:

- **User** — core user with email, password, role (VOLUNTEER / ORGANIZATION / ADMIN), status (PENDING / APPROVED / REJECTED / SUSPENDED)
- **VolunteerProfile** — linked to a User; stores skills, interests, availability, bio, location, phone
- **OrganizationProfile** — linked to a User; stores org name, registration number, description, website, address
- **Event** — created by an OrganizationProfile; has title, description, category, location, dates, skills, volunteer limit, status
- **VolunteerApplication** — links a VolunteerProfile to an Event; has status (PENDING / ACCEPTED / REJECTED / etc.)

There's a unique constraint on `VolunteerApplication`: one volunteer can only apply to a given event once (`@@unique([eventId, volunteerId])`).

### Folder Structure (Test-Relevant)

```
voluntry/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/ (register, login, logout, me)
│   │   │   ├── events/ (CRUD)
│   │   │   ├── events/[eventId]/apply
│   │   │   ├── events/[eventId]/applications
│   │   │   ├── dashboard/ (volunteer, organization)
│   │   │   ├── profile/ (volunteer, organization)
│   │   │   ├── admin/ (stats, approvals, approved, users)
│   │   │   └── upload
│   │   ├── dashboard/ (volunteer, admin, organization pages)
│   │   ├── events/ (browsable page)
│   │   └── components/ (Navbar, etc.)
│   ├── lib/
│   │   ├── auth.ts (hash, compare, generate, verify token)
│   │   ├── validations.ts (Zod schemas)
│   │   ├── permissions.ts (role checks, token decode, dashboard routing)
│   │   └── prisma.ts (PrismaClient singleton)
│   └── middleware.ts (role-based redirect, auth check)
├── tests/
│   ├── setup.ts (Prisma migration before tests)
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── validations.test.ts
│   │   └── permissions.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── auth.test.ts
│   │   │   ├── events.test.ts
│   │   │   ├── applications.test.ts
│   │   │   ├── dashboard.test.ts
│   │   │   ├── profile.test.ts
│   │   │   ├── admin.test.ts
│   │   │   └── upload.test.ts
│   │   ├── security/
│   │   │   └── authorization.test.ts
│   │   └── events.test.ts (legacy stateful flow tests)
│   └── TEST-PLAN.md
├── .env.test
├── vitest.config.ts
└── package.json
```

---

## 3. Test Environment Setup

### vitest.config.ts

The Vitest configuration extends the tsconfig alias `@` to point to `./src`, sets `fileParallelism: false` (all tests share one database), and runs `tests/setup.ts` before the suite begins. The timeout is 30 seconds per test to allow for database operations.

### tests/setup.ts

This file runs `npx prisma migrate deploy` before any tests start, ensuring the database schema matches the Prisma models. It then exports the Prisma client so every test file can import it. The migration is wrapped in a try/catch so it doesn't fail if migrations are already applied.

### .env.test

The test environment requires two variables:
- `DATABASE_URL` — pointing to a dedicated PostgreSQL database for testing (separate from dev/production)
- `JWT_SECRET` — used for signing and verifying JWTs during tests

### package.json Scripts

Two test scripts are configured:
- `npm test` — runs the full suite (`vitest run`)
- `npm run test:coverage` — runs with coverage reporting via `@vitest/coverage-v8`

---

## 4. Testing Strategy

### General Approach

Each test file follows a consistent pattern:

1. **Seed** data in `beforeAll` — creates specific users, tokens, and records needed for that file's tests
2. **Clean up** in `afterAll` — deletes only data tied to that file's email domain
3. Each file uses a **unique email domain** (e.g., `@auth.test`, `@events.test`) so files don't interfere with each other

### How API Routes Are Tested

The tests import route handler functions directly rather than using Supertest against a running server. A helper function constructs `Request` objects:

```ts
function req(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}
```

This approach is faster and simpler than starting a server, while still exercising the full route handler logic including middleware and database calls.

### How `next/headers` Is Handled

Route handlers that read cookies use `cookies()` from `next/headers`, which only works in the Next.js runtime. Tests mock this using `vi.hoisted()` and `vi.mock()`:

```ts
const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))
```

Each test then controls cookie behavior:
- `mockCookieGet.mockReturnValue({ value: token })` — simulates an authenticated user
- `mockCookieGet.mockReturnValue(undefined)` — simulates no cookie
- `mockCookieGet.mockReturnValue({ value: 'garbage' })` — simulates a tampered or invalid cookie

### Database Cleanup Pattern

No test file does a blanket `deleteMany({})` on all users. Instead, each file identifies its own records by email domain and only deletes those. This prevents one file's cleanup from accidentally removing data needed by another file.

---

## 5. Unit Tests

### auth.test.ts — 12 tests

Covers four functions from `src/lib/auth.ts`:

- **hashPassword** — confirms output is a bcrypt hash (starts with `$2a$10$`) and that identical passwords produce different hashes (salting works)
- **comparePassword** — confirms correct password matches and wrong password doesn't
- **generateToken** — confirms a valid JWT is produced with userId and role in the payload and a future expiration date
- **verifyToken** — confirms valid tokens decode correctly; and that expired, tampered, wrong-secret, and garbage tokens all throw errors

### validations.test.ts — 20 tests

Covers four Zod schemas from `src/lib/validations.ts`:

- **volunteerProfileSchema** — accepts valid data, handles empty objects, strips unknown fields
- **organizationProfileSchema** — requires organization name, handles optional website
- **eventSchema** — validates all required fields, defaults status to DRAFT and requiredSkills to empty array, rejects invalid status, and enforces that endDate must be after startDate (via a custom `refine`)
- **registerSchema** — validates email format, enforces minimum 6-character password, requires name, validates the role enum, and defaults role to VOLUNTEER

### permissions.test.ts — 14 tests

Covers four functions from `src/lib/permissions.ts`:

- **isAuthorized** — checks role against an allowed list, handles undefined role and empty allowed list
- **getDashboardPath** — maps each role (ADMIN, VOLUNTEER, ORGANIZATION) to its dashboard route; returns `/` for unknown roles
- **decodeToken** — returns the payload for valid tokens, returns null for invalid/tampered/garbage input
- **isUserApproved** — database queries to check user status; returns true for APPROVED, false for PENDING or non-existent users

---

## 6. Integration Tests — API Routes

### auth.test.ts — 11 tests

**POST /api/auth/register (4 tests):**
- Creates a volunteer user successfully (201), auto-creates a VolunteerProfile
- Creates an organization user successfully (201), auto-creates an OrganizationProfile
- Rejects duplicate email registration with 409
- Rejects missing required fields with 400 (Zod validation error)

**POST /api/auth/login (3 tests):**
- Valid credentials return 200 and set the `auth_token` cookie
- Wrong password returns 401
- Non-existent email returns 401

**POST /api/auth/logout (1 test):**
- Returns 200 and clears the `auth_token` cookie (Max-Age=0)

**GET /api/auth/me (3 tests):**
- Authenticated user returns their role (e.g., `{ role: "VOLUNTEER" }`)
- No cookie returns `{ role: null }`
- Invalid cookie returns `{ role: null }`

### events.test.ts — 14 tests

**GET /api/events (4 tests):**
- Returns only published, future events (excludes drafts and past events)
- Filters events by category query parameter
- Filters events by skills query parameter
- Returns an empty array when no events match the filter

**POST /api/events (4 tests):**
- Organization user creates an event successfully (201), status defaults to DRAFT
- Non-organization user gets 403
- Unauthenticated user gets 401
- Invalid request body returns 400

**GET /api/events/:id (2 tests):**
- Returns full event details including `acceptedCount` and `isFull`
- Returns 404 for a non-existent event ID

**PATCH /api/events/:id (2 tests):**
- Event owner can update their event (200)
- Non-owner gets 403

**DELETE /api/events/:id (2 tests):**
- Event owner can delete their event (200); record is removed from the database
- Non-owner gets 403

### applications.test.ts — 12 tests

**POST /api/events/:id/apply (5 tests):**
- Approved volunteer applies successfully (201), status set to PENDING
- Duplicate application blocked (409)
- Unapproved volunteer blocked (403)
- Non-volunteer (organization user) blocked (403)
- Unauthenticated user blocked (401)

**POST — over-capacity scenario (1 test):**
- When an event reaches its volunteer limit, attempting to accept an additional volunteer returns 400

**GET /api/events/:id/applications (2 tests):**
- Event owner (organization) sees the list of applications with volunteer details
- Non-owner gets 403

**PATCH /api/applications/:id (4 tests):**
- Organization accepts an application (status changes to ACCEPTED)
- Organization rejects an application (status changes to REJECTED)
- Non-owner gets 403
- Accepting an application when the event is full returns 400

### dashboard.test.ts — 5 tests

**GET /api/dashboard/volunteer (3 tests):**
- Authenticated volunteer gets their profile, applications, and recommended events (200)
- Unapproved volunteer gets 403
- Non-volunteer (organization user) gets 403

**GET /api/dashboard/organization (2 tests):**
- Authenticated organization gets their profile, events, and pending applications (200)
- Non-organization user gets 403

### profile.test.ts — 8 tests

**GET /api/profile/volunteer (2 tests):**
- Authenticated volunteer gets their profile (200)
- Unauthenticated user gets 401

**POST /api/profile/volunteer (2 tests):**
- Updates specified fields (supports partial updates)
- Fields not included in the request remain unchanged

**GET /api/profile/organization (2 tests):**
- Authenticated organization gets their profile (200)
- Unauthenticated user gets 401

**POST /api/profile/organization (2 tests):**
- Updates organization profile fields (200)
- Missing organization name returns 400

### admin.test.ts — 8 tests

**GET /api/admin/stats (2 tests):**
- Admin gets all platform statistics (total volunteers, organizations, active events, pending approvals, rejected counts)
- Non-admin gets 403

**GET /api/admin/approvals (1 test):**
- Admin gets lists of pending organizations and pending volunteers

**GET /api/admin/approved (1 test):**
- Admin gets lists of approved volunteers and organizations

**PATCH /api/admin/users/:id/status (3 tests):**
- Admin approves a pending user (status changes in database)
- Admin rejects a pending user
- Non-admin gets 403

**GET /api/admin/users/:id/profile (1 test):**
- Admin gets a full user profile including relations

### upload.test.ts — 3 tests

**POST /api/upload (3 tests):**
- Valid image file (JPEG) uploads successfully, returns URL
- No file provided returns 400
- Wrong file type (PDF) returns 400 with error mentioning image requirement
- Unauthenticated user gets 401

---

## 7. Integration Tests — Stateful Flows

### events.test.ts — 8 tests (pre-existing, preserved)

These tests exercise the full event lifecycle through direct Prisma database operations:

1. Organization creates a published event — confirms the record is created with correct title and status
2. Guest browsing returns only published future events — confirms the query filter works
3. Approved volunteer applies to an event — application created with PENDING status
4. Volunteer cannot apply to the same event twice — Prisma unique constraint error (P2002) is thrown
5. Organization views applications for their event — includes volunteer name and skills
6. Organization accepts an application — status changes to ACCEPTED
7. Filling volunteer capacity — confirms the event stops accepting applications when the limit is reached
8. Volunteer sees updated application status — confirms the ACCEPTED status is visible

These tests were kept as-is from the original codebase, with only the cleanup logic updated to use the `@test.com` email domain pattern.

---

## 8. Security Tests

### authorization.test.ts — 9 tests

**Token expiry (1 test):**
- Expired JWT on a protected route returns 401 or 403 (either is acceptable since both the token validity and role checks run together)

**Role-based access (3 tests):**
- Volunteer accessing admin stats endpoint gets 403
- Volunteer trying to create an event gets 403
- Admin trying to access the volunteer dashboard gets 403

**Missing authentication (1 test):**
- No cookie on a protected route returns 401

**Tampered token (1 test):**
- Modified JWT signature on a protected route returns 401 or 403

**SQL injection resistance (2 tests):**
- SQL injection payload in the `category` query parameter does not crash the server, returns 200 with an empty/filtered array
- SQL injection payload in the `skills` query parameter does not crash the server, returns 200 with an empty/filtered array

**XSS payload handling (1 test):**
- An event is created with `<script>alert("xss")</script>` in the title and `<img src=x onerror=alert(1)>` in the description
- The API stores and returns these payloads as-is (no server-side sanitization)
- This is by design — sanitization is handled at the frontend rendering layer

---

## 9. Test Summary

| Category | File | Tests | Status |
|----------|------|-------|--------|
| Unit | auth.test.ts | 12 | Passing |
| Unit | validations.test.ts | 20 | Passing |
| Unit | permissions.test.ts | 14 | Passing |
| Integration | api/auth.test.ts | 11 | Passing |
| Integration | api/events.test.ts | 14 | Passing |
| Integration | api/applications.test.ts | 12 | Passing |
| Integration | api/dashboard.test.ts | 5 | Passing |
| Integration | api/profile.test.ts | 8 | Passing |
| Integration | api/admin.test.ts | 8 | Passing |
| Integration | api/upload.test.ts | 3 | Passing |
| Security | authorization.test.ts | 9 | Passing |
| Legacy Flow | events.test.ts | 8 | Passing |
| **Total** | **12 files** | **125** | **All passing** |

### Coverage Areas

- Authentication: register, login, logout, token verification, `/api/auth/me` endpoint
- Authorization: role-based access control across all protected routes
- Input validation: Zod schemas with custom refinements
- CRUD operations: events (create, read, update, delete), profiles (read, update)
- Application workflow: apply, accept, reject, over-capacity blocking
- Dashboard data aggregation: volunteer and organization views
- Admin operations: statistics, approval queues, user management
- File upload: type validation, authentication requirement
- Security: SQL injection prevention, XSS handling, token expiry and tampering

### Areas Not Covered (potential future additions)

- Frontend component rendering tests (React Testing Library or Playwright)
- End-to-end browser tests for complete user workflows
- Performance and load testing
- Email notification integration tests

---

## 10. Key Decisions and Learnings

### Direct handler calls vs. Supertest

Route handler functions are imported and called directly with constructed Request objects. This eliminates the need for a running server during tests, making the suite faster and simpler to configure while still covering all route logic.

### The `/api/auth/me` endpoint

Because the `auth_token` cookie is marked as `httpOnly`, it cannot be read by client-side JavaScript. The `/api/auth/me` endpoint reads the cookie server-side using Next.js's `cookies()` function, decodes the JWT, and returns just the user's role. The frontend calls this endpoint to determine which dashboard to display or whether to redirect to login.

### Disabling file parallelism

`fileParallelism: false` is set in the Vitest configuration because all test files share a single PostgreSQL database. Running files in parallel would cause data conflicts between tests. This makes the test suite run sequentially, which is slightly slower (~30-40 seconds total) but guarantees reliability.

### Per-email cleanup strategy

Each test file uses a unique email domain pattern and only deletes records associated with that domain during cleanup. This is more effort than a blanket `deleteMany({})` but prevents one file's cleanup from interfering with another file's test data.

### XSS handling philosophy

The API does not sanitize XSS payloads — it stores and returns them unchanged. This is an intentional design choice: the frontend should handle output encoding when rendering user-provided content. The tests verify that script tags and event handler attributes pass through the API without modification.

### Middleware behavior

The `middleware.ts` file provides:
- Redirecting logged-in users away from login/register pages
- Blocking unauthenticated users from dashboard and profile routes
- Enforcing correct role-to-dashboard mapping (e.g., org users hitting the volunteer dashboard get redirected)
- Checking user approval status before granting access to protected pages

---

This report was prepared as part of the testing phase for the Voluntry project. All 125 tests across 12 files pass successfully against a real PostgreSQL database.

— Shubham Kumar, 2022ebcs221@online.bits-pilani.ac.in
