# Multi-Tenant Conversion — Guide

This document covers what changed, how to run it, and the reasoning behind the
non-obvious decisions. The original project structure, APIs and UI are preserved;
everything here is additive or a modification in place.

---

## 1. Running it

```bash
# Backend
cd backend
npm install
cp .env.example .env          # set JWT_SECRET and MONGO_URI
npm run migrate               # REQUIRED on an existing database - see §2
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Default credentials after `npm run migrate`:

| Role          | Email                  | Password    |
|---------------|------------------------|-------------|
| Super Admin   | `superadmin@oms.com`   | `Super@123` |
| Company Admin | your existing admin    | unchanged   |

Override the Super Admin via `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` and
`SUPER_ADMIN_NAME` in `.env`. **Change the default password before deploying.**

Run `npm run test:isolation` to verify the tenant-isolation guarantees.

---

## 2. The migration (`npm run migrate`)

Run this once against your existing database. It is idempotent, so re-running is
safe.

1. Creates the platform Super Admin.
2. Creates a "legacy" Company (`CMP-0001`, slug `gsdc`) that adopts all
   pre-existing records.
3. Backfills `companyId` on every document that lacks one.
4. Promotes your highest-privilege existing account to `Company Admin`.
5. Creates a default `General` team and assigns unassigned employees to it.
6. **Rebuilds indexes** — the important step, explained below.

### Why step 6 matters

The original schema had *globally* unique fields: `Employee.employeeId`,
`cardNumber`, `cnic`, `Department.name` and `code`, `Project.code`,
`Asset.tag`.

Under multi-tenancy these must be unique *per company*. Left as they were, the
second company to register would be unable to create a department called
"Human Resources", or an employee whose ID ends `-0001`, because company #1 had
already claimed those values platform-wide.

Changing the schema alone is not enough: MongoDB keeps indexes that were already
built. The migration explicitly drops the stale global indexes
(`employeeId_1`, `name_1`, `code_1`, `tag_1`, …) and then calls `syncIndexes()`
to build the new compound `{ companyId, … }` versions.

`Employee.email` deliberately remains globally unique — it is the login
identity, and login happens before any company is known.

---

## 3. How isolation is enforced

Every one of the 17 resource modules flows through a single generic
`crudFactory`, so isolation is implemented in **one place** rather than being
duplicated across 17 controllers.

**Identity.** `protect` resolves the JWT to either a `SuperAdmin` or an
`Employee`, loads the owning `Company`, and sets `req.tenant`:

```js
req.tenant = { companyId, isSuperAdmin, role }
```

`companyId` always comes from the database record, never from the request body
or query string.

**Reads** use `findOne({ _id, ...tenantFilter })` — never a bare `findById`. A
plain id lookup would return another company's document to anyone who guessed
an ObjectId; instead they get a 404.

**Writes** strip `companyId`, `_id`, `createdAt`, `updatedAt` and `__v` from the
request body and set `companyId` from the session. A client cannot plant a
record in another company, nor move one out of its own.

**References are validated.** The factory inspects each schema once, collects
every ObjectId path pointing at another tenant-scoped model, and verifies on
write that the target belongs to the same company. Without this, isolation would
hold on read but a company could still attach another company's employee as a
project manager.

**It fails closed.** An authenticated principal with no company matches nothing
(`{ companyId: null }`) rather than everything.

---

## 4. Roles

| Principal        | Where it lives         | Scope                          |
|------------------|------------------------|--------------------------------|
| Super Admin      | `SuperAdmin` collection| Platform-wide, no `companyId`  |
| Company Admin    | `Employee`, role       | One company                    |
| Employees        | `Employee`, role       | One company                    |

The Super Admin is kept in its own collection on purpose. Employees are
tenant-scoped documents; a platform operator must exist outside any company, and
this guarantees platform access can never be reached by escalating a company
record.

A Super Admin may scope itself to one company for support with `?companyId=<id>`
on company routes. Company users can never widen their scope this way — the
query parameter is ignored for them.

---

## 5. API

Existing endpoints keep their paths and response shapes. New ones:

```
POST   /api/auth/register-company     public company registration
POST   /api/auth/super-admin/login    platform login

GET    /api/super-admin/stats         platform statistics
GET    /api/super-admin/admins        all company admins
GET    /api/super-admin/companies     list / search / filter
POST   /api/super-admin/companies     admin-initiated onboarding
GET    /api/super-admin/companies/:id company + workspace stats
PUT    /api/super-admin/companies/:id edit profile
PATCH  /api/super-admin/companies/:id/status   activate|deactivate|block|unblock
DELETE /api/super-admin/companies/:id cascade delete (name confirmation)

GET    /api/company/me                own company profile
PUT    /api/company/me                edit own company
POST   /api/company/employees         create employee (auto per-company IDs)
POST   /api/company/employees/transfer bulk move employees between teams
GET    /api/company/teams/:id/members

GET|POST         /api/teams           unlimited teams (full CRUD)
GET|PUT|DELETE   /api/teams/:id
```

`GET /api/dashboard/stats` is unchanged in shape but is now company-scoped and
returns additional `byTeam`, `attendance` and `payroll` sections.

---

## 6. Teams vs Departments

The brief asked for unlimited Teams, but the project had no Team model — it had
`Department`, which models the fixed org chart.

Rather than repurpose `Department` (which would have changed existing
behaviour and broken the seed data), `Team` was added as a separate, freely
creatable grouping. An employee now has both a `department` and a `team`.

If you would rather Teams simply replace Departments, that is a
straightforward follow-up — say the word.

Employee IDs and card numbers are generated server-side per company. They must
be unique within a tenant, and two companies are free to both have an `-0001`,
so asking a user to type them was both error-prone and a collision risk. (The
employee form never collected them, so creating an employee through the UI was
broken before this change.)

---

## 7. Frontend

New: `RegisterCompany`, `SuperAdminLogin`, `SuperAdminDashboard`, `Companies`,
`CompanyAdmins`, and a Teams resource page.

Modified: `AuthContext` tracks `{ user, company, scope }`; `ProtectedRoute`
takes a `scope` prop and redirects mismatches; `Sidebar` and `Topbar` are
role-aware and show the current tenant; `Settings` reads and edits the live
company profile instead of hardcoded details; `DataTable` and `ResourceForm`
gained `optionsFrom` for reference dropdowns (used by the team selector).

---

## 8. Known limitations

- **Cascade delete is not transactional.** Deleting a company removes its
  records collection by collection. On a replica set this could be wrapped in a
  transaction; on standalone MongoDB it cannot.
- **Company registration** uses a transaction where available and falls back to
  best-effort cleanup on standalone MongoDB.
- **No live database test.** The isolation suite stubs the model layer, so it
  verifies the query filters and payloads the application builds. It does not
  verify MongoDB's behaviour — run the migration against a copy of your data
  first and confirm the index rebuild succeeds.
- **Logo upload** takes a URL. `multer` is already a dependency if you want real
  file uploads.
- **Rate limiting** is per-IP, not per-tenant.
