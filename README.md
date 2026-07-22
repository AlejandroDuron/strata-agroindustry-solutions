# Strata Agroindustry Solutions API

Backend for agricultural farms, cooperatives, and agro-exporters that need to digitize their field management and obtain real financial information from each production cycle.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| ORM | TypeORM |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Authentication | Passport + JWT |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI |

## Table of Contents

- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Business Flow](#business-flow)
- [Business Rules](#business-rules)
- [Database Schema](#database-schema)
- [Test Users (Seed)](#test-users-seed)
- [Roles and Permissions](#roles-and-permissions)

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **PostgreSQL** >= 14 (running and accessible)

> Make sure the database specified in `DB_NAME` exists before running the app. You can create it with:
> ```sql
> CREATE DATABASE strata_agroindustry;
> ```

## Getting Started

```bash
# 1. Clone the repository
git clone <repository-url>
cd strata-agroindustry-solutions

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env if you need to change DB_PASSWORD or other values

# 4. Create the PostgreSQL databases
psql -U postgres -c "CREATE DATABASE strata_agroindustry;"
psql -U postgres -c "CREATE DATABASE strata_agroindustry_test;"

# 5. Seed the database (creates roles, users, and sample data)
npm run seed:fresh

# 6. Run in development mode
npm run start:dev
```

> **Important:** The seed step (5) is required. Without it, there are no roles or users in the database and the API won't be functional.

The API will be available at `http://localhost:3000` and the Swagger docs at `http://localhost:3000/api`.

## Running Tests

```bash
# Unit tests
npm run test

# End-to-end tests (requires the strata_agroindustry_test database to exist)
npm run test:e2e

# Unit tests with coverage report
npm run test:cov
```

> The e2e tests connect to a real PostgreSQL database (`strata_agroindustry_test` as defined in `.env.test`). Make sure it exists before running them.

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
| `DB_NAME` | `strata_agroindustry` | PostgreSQL database name |
| `JWT_SECRET` | — | Secret for signing JWT tokens |
| `JWT_EXPIRATION` | `7d` | Token expiration time |
| `PORT` | `3000` | API port |
| `NODE_ENV` | `development` | Runtime environment |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in development mode with hot-reload |
| `npm run build` | Compile the project |
| `npm run start:prod` | Run the compiled version |
| `npm run seed` | Populate the database with sample data |
| `npm run seed:fresh` | Drop all tables, recreate them, and seed from scratch |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

## API Documentation

### Swagger

With the application running, visit:

```
http://localhost:3000/api
```

All endpoints are documented there with their request/response schemas.

### Postman

All API endpoints can be found in the Postman collection at [`docs/postman_collection.json`](docs/postman_collection.json).

1. Import `docs/postman_collection.json` into Postman
2. Run the **Login** request first — it auto-saves the JWT to the `{{jwt_token}}` variable
3. All other requests use that token via the `Authorization: Bearer {{jwt_token}}` header

## Business Flow

```
1. Login → Validate credentials → Generate JWT with roles
2. Register farm, field, and crop
3. Open production cycle (sowing date, expected harvest date, estimated yield)
4. During the cycle:
   a. Register inputs → Dynamically recalculates cost_per_area
   b. Register crop events → Irrigation, fumigation, disease, etc.
   c. Register harvests → Quantity, quality (A/B/C), price
5. Close production cycle:
   a. Validates at least 1 harvest exists (400 if not)
   b. Calculates total revenue: Σ(quantitySold × unitSalePrice)
   c. Calculates total cost: Σ(quantity × unitCost)
   d. Calculates gross margin: revenue - costs
   e. Calculates real yield: Σ(quantityObtained)
   f. Compares real yield vs historical average for the field
   g. If yield drops >20% below historical → generates alert
   h. Updates status to CLOSED
6. Financial reports: aggregate data by season and historical
```

## Business Rules

- A field can only have **ONE** open production cycle at a time
- A closed cycle **cannot be modified** (update blocked)
- Cost per area is recalculated every time an input is added, updated, or deleted
- Harvests, inputs, and events cannot be added to a closed cycle
- The field area cannot be changed while it has an open cycle

## Database Schema

### Relationships

```
FARM (1) ──── (N) FIELD (1) ──── (N) PRODUCTION_CYCLE
                                          │
                                          ├── (N) INPUT
                                          ├── (N) CROP_EVENT
                                          └── (N) HARVEST

CROP (1) ──── (N) PRODUCTION_CYCLE

USER (N) ──── (1) ROLE
ROLE (N) ──── (N) PERMISSION
```

### Main Entities

| Entity | Key Columns |
|--------|-------------|
| `farm` | id, name (unique), location, deletedAt |
| `field` | id, farm_id, name, area, deletedAt |
| `crop` | id, type, variety |
| `production_cycle` | id, field_id, crop_id, sowingDate, expectedHarvestDate, estimatedYield, currentCostPerArea, status (OPEN/CLOSED), totalRevenueAtClose, totalCostAtClose, grossMarginAtClose, realYieldAtClose |
| `input` | id, production_cycle_id, name, type (FERTILIZER/PESTICIDE/LABOR/OTHER), quantity, unitCost, unit, applicationDate |
| `crop_event` | id, production_cycle_id, eventType (IRRIGATION/FUMIGATION/DISEASE_DETECTED/PRUNING/FERTILIZATION/OTHER), eventDate, severity (LOW/MEDIUM/HIGH) |
| `harvest` | id, cycle_id, quantityObtained, quality (A/B/C), unitSalePrice, quantitySold |
| `user` | id, name, email (unique), passwordHash, isActive, roleId |
| `role` | id, name (unique), description |

## Test Users (Seed)

After running `npm run seed` or `npm run seed:fresh`, the following users are available for testing:

| Role | Email | Password |
|------|-------|----------|
| admin | `admin@strata.com` | `Admin123!` |
| gerente | `gerente@strata.com` | `Gerente123!` |
| operador | `operador@strata.com` | `Operador123!` |
| auditor | `auditor@strata.com` | `Auditor123!` |

To obtain a JWT token, send a `POST /auth/login` request:

```json
{
  "email": "admin@strata.com",
  "password": "Admin123!"
}
```

The response will include an `access_token` that you can use in the `Authorization: Bearer <token>` header for all subsequent requests.

## Roles and Permissions

### Roles

| Role | Description |
|------|-------------|
| `admin` | Full access — user management, resource deletion, and reports |
| `gerente` | Farm, field, crop, and cycle management plus reports. Cannot delete most resources |
| `operador` | Operational recording: harvests, crop events, and inputs |
| `auditor` | Read-only access to financial and yield reports |

> `GET` endpoints (lists and details) without a `@Roles` decorator are accessible to **any authenticated user**, regardless of role.

### Permissions Matrix

| Module | Action | Endpoint | admin | gerente | operador | auditor |
|--------|--------|----------|:-----:|:-------:|:--------:|:-------:|
| **Auth** | Register | `POST /auth/register` | Yes | Yes | Yes | Yes |
| | Login | `POST /auth/login` | Yes | Yes | Yes | Yes |
| **Users** | List | `GET /users` | Yes | No | No | No |
| | Get by ID | `GET /users/:id` | Yes | No | No | No |
| | Create | `POST /users` | Yes | No | No | No |
| | Update | `PATCH /users/:id` | Yes | No | No | No |
| | Delete | `DELETE /users/:id` | Yes | No | No | No |
| **Farms** | List | `GET /farms` | Yes | Yes | Yes | Yes |
| | Get by ID | `GET /farms/:id` | Yes | Yes | Yes | Yes |
| | Create | `POST /farms` | Yes | Yes | No | No |
| | Update | `PATCH /farms/:id` | Yes | Yes | No | No |
| | Delete | `DELETE /farms/:id` | Yes | No | No | No |
| **Fields** | List | `GET /fields?farmId=` | Yes | Yes | Yes | Yes |
| | Get by ID | `GET /fields/:id` | Yes | Yes | Yes | Yes |
| | Create | `POST /fields` | Yes | Yes | No | No |
| | Update | `PATCH /fields/:id` | Yes | Yes | No | No |
| | Delete | `DELETE /fields/:id` | Yes | Yes | No | No |
| **Crops** | List | `GET /crops` | Yes | Yes | Yes | Yes |
| | Get by ID | `GET /crops/:id` | Yes | Yes | Yes | Yes |
| | Create | `POST /crops` | Yes | Yes | No | No |
| | Update | `PATCH /crops/:id` | Yes | Yes | No | No |
| | Delete | `DELETE /crops/:id` | Yes | No | No | No |
| **Production Cycles** | List | `GET /production-cycle` | Yes | Yes | Yes | Yes |
| | Get by ID | `GET /production-cycle/:id` | Yes | Yes | Yes | Yes |
| | Create | `POST /production-cycle` | Yes | Yes | No | No |
| | Update | `PATCH /production-cycle/:id` | Yes | Yes | No | No |
| | Close | `PATCH /production-cycle/:id/close` | Yes | Yes | No | No |
| | Delete | `DELETE /production-cycle/:id` | Yes | No | No | No |
| **Crop Events** | List | `GET /production-cycles/:cycleId/events` | Yes | Yes | Yes | Yes |
| | Get by ID | `GET /production-cycles/:cycleId/events/:id` | Yes | Yes | Yes | Yes |
| | Create | `POST /production-cycles/:cycleId/events` | Yes | Yes | Yes | No |
| | Update | `PATCH /production-cycles/:cycleId/events/:id` | Yes | Yes | Yes | No |
| | Delete | `DELETE /production-cycles/:cycleId/events/:id` | Yes | No | No | No |
| **Inputs** | List | `GET /production-cycles/:cycleId/inputs` | Yes | Yes | Yes | Yes |
| | Get by ID | `GET /production-cycles/:cycleId/inputs/:id` | Yes | Yes | Yes | Yes |
| | Create | `POST /production-cycles/:cycleId/inputs` | Yes | Yes | Yes | No |
| | Update | `PATCH /production-cycles/:cycleId/inputs/:id` | Yes | Yes | Yes | No |
| | Delete | `DELETE /production-cycles/:cycleId/inputs/:id` | Yes | No | No | No |
| **Harvests** | List | `GET /harvests` | Yes | Yes | Yes | Yes |
| | Get by ID | `GET /harvests/:id` | Yes | Yes | Yes | Yes |
| | Create | `POST /harvests` | Yes | Yes | Yes | No |
| | Update | `PATCH /harvests/:id` | Yes | Yes | Yes | No |
| | Delete | `DELETE /harvests/:id` | Yes | No | No | No |
| **Reports** | Yield History | `GET /reports/yield-history` | Yes | Yes | No | Yes |
| | Financial | `GET /reports/financial` | Yes | Yes | No | Yes |

### Notes

- **Auth** endpoints (`/auth/login`, `/auth/register`) are public — no JWT or role required.
- `GET` endpoints without `@Roles` only require a valid JWT (any authenticated role has access).
- The `RolesGuard` validates the `role` field from the JWT payload against the roles specified by the `@Roles` decorator.
- The `Permission` entity exists in the database but is not currently used by guards — authorization is purely role-based.

---

Detailed database documentation available at [`docs/database.md`](docs/database.md).
