# Database Schema Documentation

## Overview

This project uses **TypeORM** as ORM with support for **SQLite** (development) and **PostgreSQL** (production). The schema is code-first, defined via TypeORM entity decorators.

## Entity Relationship Diagram

```
┌──────────┐         ┌──────────┐         ┌───────────────────┐
│   Farm   │ 1 ── N  │  Field   │ 1 ── N  │ ProductionCycle   │
└──────────┘         └──────────┘         └───────────────────┘
                                                    │
                                          ┌─────────┼─────────┐
                                          │         │         │
                                        1:N       1:N       1:N
                                          │         │         │
                                    ┌─────┴──┐ ┌────┴────┐ ┌──┴─────┐
                                    │ Input  │ │CropEvent│ │Harvest │
                                    └────────┘ └─────────┘ └────────┘

┌──────────┐ 1 ── N ┌──────────┐
│   Role   │────────│   User   │
└──────────┘        └──────────┘

┌──────────┐ N ── N ┌────────────┐
│   Role   │────────│ Permission │
└──────────┘        └────────────┘

┌──────────┐ 1 ── N ┌───────────────────┐
│   Crop   │────────│ ProductionCycle   │
└──────────┘        └───────────────────┘
```

## Tables

### Farm

Represents an agricultural farm.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `name` | varchar(100) | UNIQUE, NOT NULL | Farm name |
| `location` | varchar(100) | NOT NULL | Geographic location |
| `deletedAt` | timestamp | nullable | Soft delete timestamp |

**Relations:**
- One-to-Many → `Field`

---

### Field

Represents a specific field within a farm.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `farm_id` | integer | FK → Farm.id, NOT NULL | Parent farm |
| `name` | varchar(100) | NOT NULL | Field name |
| `area` | float | NOT NULL | Field area (hectares) |
| `deletedAt` | timestamp | nullable | Soft delete timestamp |

**Relations:**
- Many-to-One → `Farm`
- One-to-Many → `ProductionCycle`

---

### Crop

Represents a crop type and variety.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `type` | varchar | NOT NULL | Crop type (e.g., corn, coffee) |
| `variety` | varchar | NOT NULL | Crop variety |

**Relations:**
- One-to-Many → `ProductionCycle`

---

### ProductionCycle

Central entity that tracks a full production cycle for a field with a specific crop.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `field_id` | integer | FK → Field.id, NOT NULL | Associated field |
| `crop_id` | integer | FK → Crop.id, NOT NULL | Crop being grown |
| `sowingDate` | date | NOT NULL | Date of sowing |
| `expectedHarvestDate` | date | NOT NULL | Expected harvest date |
| `estimatedYield` | float | NOT NULL | Estimated yield |
| `currentCostPerArea` | float | NOT NULL | Current cost per area (recalculated on input changes) |
| `status` | varchar | NOT NULL, default: `'OPEN'` | Cycle status: `OPEN` or `CLOSED` |
| `totalRevenueAtClose` | float | nullable | Total revenue calculated at close |
| `totalCostAtClose` | float | nullable | Total cost calculated at close |
| `grossMarginAtClose` | float | nullable | Gross margin (revenue - costs) at close |
| `realYieldAtClose` | float | nullable | Actual yield at close |
| `deletedAt` | timestamp | nullable | Soft delete timestamp |

**Relations:**
- Many-to-One → `Field`
- Many-to-One → `Crop`
- One-to-Many → `Input`
- One-to-Many → `CropEvent`
- One-to-Many → `Harvest`

---

### Input

Represents production inputs (fertilizers, pesticides, labor, etc.) applied during a cycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `production_cycle_id` | integer | FK → ProductionCycle.id, NOT NULL, CASCADE | Parent cycle |
| `name` | varchar | nullable | Input name |
| `type` | varchar | NOT NULL, default: `'OTHER'` | Input type enum |
| `quantity` | float | NOT NULL | Quantity applied |
| `unitCost` | float | NOT NULL | Cost per unit |
| `unit` | varchar | nullable | Unit of measure |
| `applicationDate` | date | nullable | Date of application |
| `notes` | varchar | nullable | Additional notes |
| `input_type` | varchar | nullable | Legacy compatibility column |
| `createdAt` | timestamp | auto-generated | Creation timestamp |
| `updatedAt` | timestamp | auto-generated | Last update timestamp |

**Enum — InputType:**
- `FERTILIZER`
- `PESTICIDE`
- `LABOR`
- `OTHER`

**Relations:**
- Many-to-One → `ProductionCycle` (CASCADE on delete)

---

### CropEvent

Represents events that occur during a production cycle (irrigation, disease, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `production_cycle_id` | integer | FK → ProductionCycle.id, NOT NULL, CASCADE | Parent cycle |
| `eventType` | varchar | NOT NULL, default: `'OTHER'` | Event type enum |
| `eventDate` | date | NOT NULL | Date the event occurred |
| `description` | varchar | nullable | Event description |
| `severity` | varchar | nullable | Severity level enum |
| `resolvedAt` | date | nullable | Date the event was resolved |
| `createdAt` | timestamp | auto-generated | Creation timestamp |
| `updatedAt` | timestamp | auto-generated | Last update timestamp |

**Enum — EventType:**
- `IRRIGATION`
- `FUMIGATION`
- `DISEASE_DETECTED`
- `PRUNING`
- `FERTILIZATION`
- `OTHER`

**Enum — Severity:**
- `LOW`
- `MEDIUM`
- `HIGH`

**Relations:**
- Many-to-One → `ProductionCycle` (CASCADE on delete)

---

### Harvest

Represents a harvest record within a production cycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `cycle_id` | integer | FK → ProductionCycle.id, NOT NULL, CASCADE | Parent cycle |
| `quantityObtained` | float | NOT NULL | Total quantity harvested |
| `quality` | varchar | NOT NULL | Quality grade: `A`, `B`, or `C` |
| `unitSalePrice` | float | NOT NULL | Sale price per unit |
| `quantitySold` | float | NOT NULL | Quantity sold |

**Relations:**
- Many-to-One → `ProductionCycle` (CASCADE on delete)

---

### User

Represents a system user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `name` | varchar | NOT NULL | User's full name |
| `email` | varchar | UNIQUE, NOT NULL | User's email address |
| `passwordHash` | varchar | NOT NULL | Bcrypt hashed password |
| `isActive` | boolean | NOT NULL, default: `true` | Account active status |
| `roleId` | integer | FK → Role.id | Assigned role |
| `createdAt` | timestamp | auto-generated | Creation timestamp |
| `updatedAt` | timestamp | auto-generated | Last update timestamp |

**Relations:**
- Many-to-One → `Role` (eager loaded)

---

### Role

Represents a system role for RBAC.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `name` | varchar | UNIQUE, NOT NULL | Role name (admin, gerente, operador, auditor) |
| `description` | varchar | nullable | Role description |
| `createdAt` | timestamp | auto-generated | Creation timestamp |
| `updatedAt` | timestamp | auto-generated | Last update timestamp |

**Relations:**
- One-to-Many → `User`

---

### Permission

Represents a permission that can be assigned to roles. Currently defined in the schema but not enforced by guards.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, auto-increment | Primary key |
| `name` | varchar | UNIQUE, NOT NULL | Permission name |
| `description` | varchar | nullable | Permission description |
| `createdAt` | timestamp | auto-generated | Creation timestamp |
| `updatedAt` | timestamp | auto-generated | Last update timestamp |

**Relations:**
- Many-to-Many → `Role`

---

## Soft Deletes

The following entities use `@DeleteDateColumn()` for soft deletes:
- `Farm`
- `Field`
- `ProductionCycle`

When soft-deleted, records are not physically removed from the database — the `deletedAt` column is set to the current timestamp. TypeORM automatically excludes soft-deleted records from queries.

## Cascade Deletes

The following entities cascade on hard delete of their parent `ProductionCycle`:
- `Input` (ON DELETE CASCADE)
- `CropEvent` (ON DELETE CASCADE)
- `Harvest` (ON DELETE CASCADE)

## Business Constraints (Application-Level)

These constraints are enforced by the application logic, not by database constraints:

1. A field can only have **one OPEN production cycle** at a time.
2. A **CLOSED** production cycle cannot be modified.
3. `currentCostPerArea` is recalculated every time an input is added, updated, or deleted.
4. Harvests, inputs, and crop events cannot be added to a closed cycle.
5. Field area cannot be changed while it has an open cycle.
6. A cycle cannot be closed unless at least one harvest exists.
