# Mini ERP + CRM Operations Portal

A small ERP/CRM system for a wholesale/distribution company covering customers, products/inventory,
and sales challans, built with a Node.js/TypeScript/Express/PostgreSQL backend and a React/TypeScript
frontend. 

## 0. Submission details

- **GitHub repository:** https://github.com/vaishnavi-0613/mini-erp-crm
- **Live frontend URL:** Not deployed — running locally (see setup instructions below)
- **Live backend API URL:** Not deployed — running locally (see setup instructions below)
- **Test login credentials:** see [section 5](#5-test-login-credentials-all-roles) below
- **Postman collection:** `postman_collection.json` in this repo
- **Architecture overview:** see [section 9](#9-architecture-notes) below
- **Known limitations:** see [section 8](#8-known-limitations--incomplete-parts) below

---

## 1. Tech stack

**Backend:** Node.js, TypeScript, Express.js, PostgreSQL, Prisma ORM, JWT auth, Zod validation
**Frontend:** React 18, TypeScript, Vite, React Router, Axios
**Deployment target:** any free hosting (Render/Railway/Fly.io for backend, Vercel/Netlify for
frontend, Neon/Supabase/Render Postgres for the database). AWS is not used, per the assignment's
"optional/bonus" note — see [Assumptions](#7-assumptions-made) below.

---

## 2. Project structure

```
mini-erp-crm/
├── backend/                 # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma    # Data model (users, customers, products, challans...)
│   │   └── seed.ts          # Creates one test user per role + sample data
│   ├── src/
│   │   ├── config/db.ts     # Prisma client singleton
│   │   ├── middleware/      # auth, role guard, zod validation, error handler
│   │   ├── controllers/     # business logic per module
│   │   ├── routes/          # route -> controller wiring, per-route role rules
│   │   ├── validators/      # zod schemas
│   │   ├── utils/           # jwt helpers, challan number generator, asyncHandler
│   │   ├── app.ts           # express app (middleware, routes)
│   │   └── index.ts         # server bootstrap
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/                 # React + Vite admin UI
│   ├── src/
│   │   ├── api/client.ts    # axios instance, attaches JWT, error helper
│   │   ├── context/AuthContext.tsx
│   │   ├── components/      # Layout (sidebar), ProtectedRoute, StatusBadge
│   │   ├── pages/            # Login, Dashboard, customers/, products/, challans/
│   │   └── styles.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── package.json
├── docker-compose.yml         # postgres + backend + frontend, one command local run
├── postman_collection.json    # Importable Postman collection for every endpoint
└── README.md                  # this file
```

---

## 3. Local setup (without Docker)

### Prerequisites
- Node.js 20+
- A PostgreSQL 14+ database (local install, or a free instance from Neon/Supabase/Render)

### Backend
```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string, and a real JWT_SECRET

npm install
npx prisma migrate dev --name init   # creates tables
npm run seed                          # creates test users + sample data (see section 5)
npm run dev                           # starts API on http://localhost:4000
```

### Frontend
```bash
cd frontend
cp .env.example .env
# edit .env if your API isn't on http://localhost:4000

npm install
npm run dev                           # starts UI on http://localhost:5173
```

Open `http://localhost:5173` and sign in with any of the seeded test accounts (section 5).

---

## 4. Local setup with Docker (single command)

```bash
docker compose up --build
```
This starts Postgres, runs migrations + seed, and starts both the API (port 4000) and the frontend
(port 5173, served by nginx) in one go. Edit the `JWT_SECRET` in `docker-compose.yml` before using
this beyond local testing.

---

## 5. Test login credentials (all roles)

Created automatically by `npm run seed` (or by the Docker Compose `backend` service on first boot):

| Role       | Email                | Password      |
|------------|-----------------------|---------------|
| Admin      | admin@erp.test        | Admin@123     |
| Sales      | sales@erp.test        | Sales@123     |
| Warehouse  | warehouse@erp.test    | Warehouse@123 |
| Accounts   | accounts@erp.test     | Accounts@123  |

The seed also creates two sample products and one sample customer so the challan flow can be tried
immediately.

---

## 6. How environment variables are managed

Both apps read config from `.env` files (never committed — see `.gitignore`), with `.env.example`
committed as a template:

- **Backend** (`backend/.env`): `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`.
- **Frontend** (`frontend/.env`): `VITE_API_BASE_URL` — the only setting the frontend needs, since it
  is a static SPA that just needs to know where the API lives.

In hosted environments (Render/Railway/Vercel/Netlify) these are set as dashboard "Environment
Variables" instead of a committed `.env` file — the variable names are identical.

---

## 7. Assumptions made

- **AWS is treated as optional/bonus** exactly as the brief states, so the documented deployment
  path uses free-tier equivalents (Render/Railway/Fly.io + Vercel/Netlify + Neon/Supabase). The
  same Dockerfiles work unmodified on AWS ECS/Elastic Beanstalk/RDS if that's preferred later.
- **Roles and permissions** were interpreted as: Admin/Sales manage customers and create challans;
  Admin/Warehouse manage products, stock, and can confirm/cancel challans (since that's what moves
  physical stock); Accounts has read-only access across all modules (no dedicated invoicing module
  was in scope, so Accounts currently has visibility rather than a distinct write-flow). This is a
  reasonable default for a first build and is straightforward to change in the `authorize(...)`
  calls in each route file.
- **Challan product snapshot**: each `ChallanItem` stores `productName`, `productSku`, and
  `unitPrice` at the time of the challan, in addition to the live `productId` — so historical
  challans stay accurate even if the product is renamed, repriced, or removed later.
- **Stock movement log**: every stock change (opening stock, manual IN/OUT adjustment, or a challan
  being confirmed/cancelled) writes a `StockMovement` row, so the log is a complete audit trail, not
  just a snapshot.
- **Challan numbers** are generated as `CH-<year>-<sequence>` (e.g. `CH-2026-000001`), resetting the
  sequence each calendar year.
- **"Confirmed cannot revert to Draft"**: once a challan is confirmed (stock deducted), it can only
  move to Cancelled (which restores stock), not back to Draft — reverting would misrepresent the
  stock ledger.
- Login uses email + password (JWT), as the brief says is acceptable, rather than building a
  separate OTP/SSO flow.

---

## 8. Known limitations / incomplete parts

- **Invoicing** is out of scope for this build (the brief's core modules are Auth/Roles, CRM,
  Product/Inventory, and Sales Challan — invoicing wasn't listed as a required module). Challans can
  serve as the basis for invoice generation later.
- **Purchase orders** (mentioned in the business context paragraph) are not a separate module;
  incoming stock is handled via the Product & Stock module's manual "stock movement" (IN) feature.
  A dedicated PO module with supplier tracking would be a natural next addition.
- **Bonus items not implemented**: Docker setup for a Docker deployment. GitHub Actions CI/CD,
  PDF invoice export, and S3 image upload were called out as bonus/optional and are not included in
  this pass, since bonus points are explicity marked as non mandatory.
- **Automated tests** (unit/integration) are not included; this was prioritized to fit the 48-hour
  scope around the required core modules first.
- **Search** is a simple case-insensitive `contains` match (via Prisma), not a full-text index —
  fine at this data scale, would move to Postgres full-text search or a search service at larger
  scale.

---

## 9. Architecture notes

- **Backend** follows a conventional layered structure: `routes` (URL + role rules) →
  `middleware/validate` (Zod input validation) → `controllers` (business logic, wrapped in
  `asyncHandler` so errors reach the centralized `errorHandler`) → `prisma` (typed DB access).
  Role-based access is enforced per-route with an `authorize('ADMIN', 'SALES', ...)` middleware, and
  every write endpoint also validates its `req.body` shape before touching the database.
- **Business-critical logic** (stock never going negative, challans snapshotting product data, and
  challan status transitions) lives in `challan.controller.ts` and `product.controller.ts`, wrapped
  in Prisma `$transaction` calls so a partial failure (e.g. one line item having insufficient stock)
  rolls back the whole operation instead of leaving stock in an inconsistent state.
- **Frontend** is a single Vite/React SPA. `AuthContext` holds the logged-in user and JWT (persisted
  to `localStorage`); `ProtectedRoute` gates whole routes by login state and, optionally, by role;
  the `api` axios instance attaches the JWT to every request and redirects to `/login` on a 401.
  Each module (Customers/Products/Challans) has its own `List` / `Form` / `Detail` page under
  `src/pages/<module>/`.

---

## 10. Deploying (free hosting)

1. **Database**: create a free Postgres instance on Neon, Supabase, or Render Postgres. Copy its
   connection string into `DATABASE_URL`.
2. **Backend**: push `backend/` to its own Render/Railway/Fly.io service (or point them at this repo
   with `backend/` as the root directory). Set the environment variables from
   `backend/.env.example`. Build command: `npm install && npm run build && npx prisma migrate deploy`.
   Start command: `npm start`. Run `npm run seed` once (via a one-off job/shell) to create the test
   users.
3. **Frontend**: push `frontend/` to Vercel/Netlify (root directory `frontend/`). Set
   `VITE_API_BASE_URL` to the deployed backend's URL. Build command: `npm run build`. Output
   directory: `dist`.
4. Update the backend's `CORS_ORIGIN` env var to the deployed frontend URL once you have it.

---

## 11. API quick reference

All endpoints are prefixed with the backend base URL (default `http://localhost:4000`). All except
`/auth/login` and `/health` require an `Authorization: Bearer <token>` header.

```
POST   /auth/login
POST   /auth/register              (Admin only)
GET    /auth/me

POST   /customers                  (Admin, Sales)
GET    /customers                  (?search=&status=&customerType=&page=&limit=)
GET    /customers/:id
PUT    /customers/:id              (Admin, Sales)
POST   /customers/:id/notes        (Admin, Sales)

POST   /products                   (Admin, Warehouse)
GET    /products                   (?search=&category=&lowStock=&page=&limit=)
GET    /products/:id
PUT    /products/:id               (Admin, Warehouse)
POST   /products/:id/stock-movements   (Admin, Warehouse)

POST   /challans                   (Admin, Sales)
GET    /challans                   (?status=&customerId=&search=&page=&limit=)
GET    /challans/:id
PATCH  /challans/:id/status        (Admin, Sales, Warehouse)
```

See `postman_collection.json` for a ready-to-import collection covering every endpoint, including an
example of the "insufficient stock" error response.
