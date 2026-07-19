# Base de Datos del Sistema

## Objetivo
Este esquema inicial permite manejar autenticación, roles, permisos y un módulo básico de productos y categorías para el sistema.

## Entidades principales

### 1. Role
Representa los roles del sistema.

Campos:
- id: number
- name: string
- description: string
- createdAt: Date
- updatedAt: Date

### 2. Permission
Representa las acciones o permisos disponibles.

Campos:
- id: number
- name: string
- description: string
- createdAt: Date
- updatedAt: Date

### 3. RolePermission
Tabla intermedia para asignar permisos a roles.

Campos:
- id: number
- roleId: number
- permissionId: number

### 4. User
Representa a los usuarios del sistema.

Campos:
- id: number
- name: string
- email: string
- passwordHash: string
- roleId: number
- isActive: boolean
- createdAt: Date
- updatedAt: Date

### 5. Category
Clasifica productos.

Campos:
- id: number
- name: string
- description: string
- isActive: boolean
- createdAt: Date
- updatedAt: Date

### 6. Product
Representa los productos del sistema.

Campos:
- id: number
- name: string
- description: string
- price: decimal
- stock: number
- categoryId: number
- isActive: boolean
- createdAt: Date
- updatedAt: Date

## Relaciones
- User -> Role: muchos a uno
- Role -> Permission: muchos a muchos
- Category -> Product: uno a muchos

## Recomendación de uso
- Desarrollo: `synchronize: true`
- Producción: usar migraciones
