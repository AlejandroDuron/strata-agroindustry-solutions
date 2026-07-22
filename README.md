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
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Business Flow](#business-flow)
- [Business Rules](#business-rules)
- [Database Schema](#database-schema)
- [Roles and Permissions](#roles-and-permissions)

## Getting Started

```bash
# 1. Clone the repository
git clone <repository-url>
cd strata-agroindustry-solutions

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Run in development mode
npm run start:dev

# 5. (Optional) Seed the database with sample data
npm run seed
```

The API will be available at `http://localhost:3000` and the Swagger docs at `http://localhost:3000/api`.

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | `sqlite` | Database engine (`sqlite` or `postgres`) |
| `DB_DATABASE` | `db.sqlite` | Database name/path |
| `DB_HOST` | — | PostgreSQL host (only if `DB_TYPE=postgres`) |
| `DB_PORT` | — | PostgreSQL port |
| `DB_USERNAME` | — | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
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
