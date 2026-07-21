# Strata Agroindustry Solutions API

Backend API for agricultural farms, cooperatives, and agro-exporters that need to digitize their field management and obtain real financial information from each production cycle. Built with NestJS, TypeORM, and PostgreSQL.

## Project Description

This API manages the complete agricultural production lifecycle — from planting to harvest and sale — with traceability per lot, input cost control, and profitability analysis per production cycle.

Core capabilities:
- Farm and field (lot) registration
- Crop catalog management
- Production cycle tracking (open → close)
- Input registration with dynamic cost-per-area recalculation
- Crop event logging (irrigation, fumigation, disease detection)
- Harvest recording with quality grading (A/B/C)
- Cycle closure with financial calculations (revenue, costs, gross margin)
- Low-yield alerts based on historical averages
- JWT authentication with role-based access control

## Project Structure

```
src/
├── app.module.ts                  # Root module, imports all feature modules
├── main.ts                        # Bootstrap, ValidationPipe, Swagger setup
├── auth/                          # Authentication & authorization
│   ├── auth.controller.ts         # POST /auth/register, POST /auth/login
│   ├── auth.service.ts            # JWT generation, password validation
│   ├── jwt.strategy.ts            # Passport JWT strategy
│   ├── constants.ts               # JWT secret config
│   ├── guards/
│   │   ├── jwt-auth.guard.ts      # Protects routes requiring authentication
│   │   └── roles.guard.ts         # Restricts access by role
│   ├── decorators/
│   │   └── roles.decorator.ts     # @Roles('admin') decorator
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   └── entities/
│       ├── role.entity.ts
│       └── permission.entity.ts
├── users/                         # User management (admin-only)
│   ├── users.controller.ts        # CRUD /users
│   ├── users.service.ts
│   ├── dto/
│   └── entities/
│       └── user.entity.ts
├── farms/                         # Farm registration
│   ├── farms.controller.ts        # CRUD /farms (soft delete)
│   ├── farms.service.ts
│   ├── dto/
│   └── entities/
│       └── farm.entity.ts
├── fields/                        # Field (lot) management
│   ├── fields.controller.ts       # CRUD /fields?farmId= (soft delete)
│   ├── fields.service.ts          # Area change blocked if cycle is open
│   ├── dto/
│   └── entities/
│       └── field.entity.ts
├── crops/                         # Crop catalog
│   ├── crops.controller.ts        # CRUD /crops
│   ├── crops.service.ts           # Duplicate type+variety prevention
│   ├── dto/
│   └── entities/
│       └── crop.entity.ts
├── production-cycle/              # Production cycle (core module)
│   ├── production-cycle.controller.ts  # CRUD + PATCH /:id/close
│   ├── production-cycle.service.ts     # Open/close logic, yield alerts
│   ├── dto/
│   └── entities/
│       └── production-cycle.entity.ts
├── inputs/                        # Input (insumo) management
│   ├── inputs.controller.ts       # CRUD /production-cycles/:cycleId/inputs
│   ├── inputs.service.ts          # Dynamic cost recalculation
│   ├── dto/
│   └── entities/
│       └── input.entity.ts
├── crop-events/                   # Crop event logging
│   ├── crop-events.controller.ts  # CRUD /production-cycles/:cycleId/events
│   ├── crop-events.service.ts
│   ├── dto/
│   └── entities/
│       └── crop-event.entity.ts
├── harvests/                      # Harvest registration
│   ├── harvests.controller.ts     # CRUD /harvests
│   ├── harvests.service.ts
│   ├── dto/
│   └── entities/
│       └── harvest.entity.ts
├── reports/                       # Financial reports (WIP)
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── dto/
├── database/                      # Database configuration & seeding
│   ├── database.module.ts         # TypeORM PostgreSQL connection
│   ├── bootstrap.ts               # Standalone seed runner
│   ├── seed.ts                    # Orchestrates auth + agroindustry seeds
│   ├── seeds/
│   │   └── agroindustry.seed.ts   # Creates sample farms, fields, cycles, etc.
│   └── factories/                 # Data factories for seeding/testing
│       ├── farm.factory.ts
│       ├── field.factory.ts
│       ├── crop.factory.ts
│       ├── production-cycle.factory.ts
│       ├── input.factory.ts
│       ├── crop-event.factory.ts
│       ├── harvest.factory.ts
│       └── index.ts
└── common/                        # Shared utilities
    └── interfaces/
```

## Business Flow

```
1. Login → Validate credentials → Generate JWT with roles
2. Register farm, field, and crop
3. Open production cycle (defines sowing date, expected harvest date, estimated yield)
4. During the cycle:
   a. Register inputs (POST /inputs) → Recalculates cost_per_area dynamically
   b. Register crop events (POST /events) → Irrigation, fumigation, disease, etc.
   c. Register harvests (POST /harvests) → Quantity, quality (A/B/C), price
5. Close production cycle (PATCH /production-cycle/:id/close):
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

### Business Rules

- A field can only have ONE open production cycle at a time
- A closed cycle cannot be modified (update blocked)
- Cost per area is recalculated every time an input is added, updated, or deleted
- Harvests, inputs, and events cannot be added to a closed cycle
- The field area cannot be changed while it has an open cycle

## Database Schema

PostgreSQL with TypeORM (synchronize: true for development).

### Entities and Relationships

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

### Table Details

| Table | Key Columns |
|-------|-------------|
| `farm` | id, name (unique), location, deletedAt |
| `field` | id, farm_id (FK), name, area, deletedAt |
| `crop` | id, type, variety |
| `production_cycle` | id, field_id (FK), crop_id (FK), sowingDate, expectedHarvestDate, estimatedYield, currentCostPerArea, status (OPEN/CLOSED), totalRevenueAtClose, totalCostAtClose, grossMarginAtClose, realYieldAtClose |
| `input` | id, production_cycle_id (FK), name, type (FERTILIZER/PESTICIDE/LABOR/OTHER), quantity, unitCost, unit, applicationDate, notes |
| `crop_event` | id, production_cycle_id (FK), eventType (IRRIGATION/FUMIGATION/DISEASE_DETECTED/PRUNING/FERTILIZATION/OTHER), eventDate, description, severity (LOW/MEDIUM/HIGH), resolvedAt |
| `harvest` | id, cycle_id (FK), quantityObtained, quality (A/B/C), unitSalePrice, quantitySold |
| `user` | id, name, email (unique), passwordHash, isActive, roleId (FK) |
| `role` | id, name (unique), description |
| `permission` | id, name (unique), description |

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd strata-agroindustry-solutions

# Install dependencies
npm install
```

### Database Setup

```bash
# Create the PostgreSQL database
createdb strata_agroindustry

# Or configure via environment variables:
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=strata_agroindustry
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `strata_agroindustry` | Database name |
| `JWT_SECRET` | `changeThisSecretInProduction` | JWT signing secret |
| `PORT` | `3000` | API port |

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Seed the database with sample data
npm run seed
```

### Swagger Documentation

Once the app is running, visit:
```
http://localhost:3000/api
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |

### Users (admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Farms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/farms` | Create a farm |
| GET | `/farms` | List active farms |
| GET | `/farms/:id` | Get farm by ID |
| PATCH | `/farms/:id` | Update farm |
| DELETE | `/farms/:id` | Soft delete farm |

### Fields
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/fields` | Create a field |
| GET | `/fields?farmId=` | List fields by farm |
| GET | `/fields/:id` | Get field by ID |
| PATCH | `/fields/:id` | Update field |
| DELETE | `/fields/:id` | Soft delete field |

### Crops
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/crops` | Create a crop |
| GET | `/crops` | List all crops |
| GET | `/crops/:id` | Get crop by ID |
| PATCH | `/crops/:id` | Update crop |
| DELETE | `/crops/:id` | Delete crop |

### Production Cycles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/production-cycle` | Open a new cycle |
| GET | `/production-cycle` | List all cycles |
| GET | `/production-cycle/:id` | Get cycle with all relations |
| PATCH | `/production-cycle/:id` | Update cycle (blocked if closed) |
| PATCH | `/production-cycle/:id/close` | Close cycle (calculates financials) |
| DELETE | `/production-cycle/:id` | Delete cycle |

### Inputs (nested under production cycles)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/production-cycles/:cycleId/inputs` | Add input (recalculates cost) |
| GET | `/production-cycles/:cycleId/inputs` | List inputs for cycle |
| GET | `/production-cycles/:cycleId/inputs/:id` | Get input by ID |
| PATCH | `/production-cycles/:cycleId/inputs/:id` | Update input (recalculates cost) |
| DELETE | `/production-cycles/:cycleId/inputs/:id` | Delete input (recalculates cost) |

### Crop Events (nested under production cycles)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/production-cycles/:cycleId/events` | Register event |
| GET | `/production-cycles/:cycleId/events` | List events for cycle |
| GET | `/production-cycles/:cycleId/events/:id` | Get event by ID |
| PATCH | `/production-cycles/:cycleId/events/:id` | Update event |
| DELETE | `/production-cycles/:cycleId/events/:id` | Delete event |

### Harvests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/harvests` | Register a harvest |
| GET | `/harvests?cycleId=` | List harvests (optional cycle filter) |
| GET | `/harvests/:id` | Get harvest by ID |
| PATCH | `/harvests/:id` | Update harvest |
| DELETE | `/harvests/:id` | Delete harvest |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/financial` | Financial summary by season (WIP) |

## Using the API with Postman

1. Import `postman_collection.json` into Postman
2. Run the **Login** request first — it auto-saves the JWT token to the `{{jwt_token}}` variable
3. All other requests use this token automatically via the `Authorization: Bearer {{jwt_token}}` header
4. Replace IDs in URLs (e.g., `:cycleId`, `:id`) with actual values from your database

## Testing

<!-- TODO: Add test documentation -->

## Roles and Permissions Matrix

<!-- TODO: Add roles and permissions matrix -->

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Authentication**: Passport + JWT
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger / OpenAPI
- **Password Hashing**: bcryptjs
