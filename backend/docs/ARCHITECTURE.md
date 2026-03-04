# SaaS Multi-Tenant Architecture

This document describes the core patterns used to enforce data isolation, performance, and security across the CRM.

## 1. Multi-Tenant Data Isolation (Prisma Interceptors)
We utilize a strong application-side isolation mechanism using **Prisma Interceptors** combined with `AsyncLocalStorage`.

- **`contextStore` (`src/core/context.ts`)**: Injects the `tenantId` and `userId` into the call-stack for every incoming HTTP request (handled via `auth.middleware.ts`).
- **Prisma Extension (`src/core/prisma.ts`)**: We extend the `$allModels` behavior. Every time a query like `findMany`, `findFirst`, `update`, `delete`, `aggregate`, or `groupBy` is executed, the interceptor automatically appends `where: { tenant_id: contextStore.tenantId }`. 
- **Bypass**: The only exceptions are explicit system operations where `isSystem: true` is set in the context, allowing cross-tenant aggregation (e.g., for super-admins).

**Rule for Developers**: You do NOT need to manually add `tenant_id` to your `where` clauses in services/controllers. Trust the interceptor.

## 2. Redis Caching Strategy
Caching is heavily used for the Dashboard analytics to prevent expensive aggregation queries from locking the database.

- **TTL Policy**: Dashboard metrics are cached for `300` seconds (5 minutes). 
- **Hooks & Invalidation**: We intercept standard Prisma operations. If an `Opportunity` is created, updated, or deleted, the Prisma interceptor explicitly calls `redisCache.invalidate('dashboard:metrics:${tenantId}:*')`. This ensures high cache-hit ratios while avoiding stale critical data.

## 3. Role-Based Access Control (RBAC)
Authorization is handled in two layers:
1. **Authentication (`auth.middleware.ts`)**: Verifies the JWT and sets the `tenant_id` context.
2. **Authorization (`rbac.middleware.ts`)**: Exposes a `requirePermission` middleware using granular permissions (e.g. `read:opportunity`, `delete:client`). The system defines four static roles:
   - `admin`: Full access to all operations.
   - `manager`: Can implicitly read/write/delete most entities (Clients, Opportunities, Tasks, Users).
   - `sales`: Can read/write daily operational entities but cannot delete.
   - `user`: Lowest privilege, mostly read-only access with ability to create personal Tasks.

## 4. How to add new Models
If you need to add a newly auditable or isolated feature (e.g., `Invoice`), you must:
1. Add `tenant_id Int` to the model in `schema.prisma`.
2. Add a relation: `tenant Tenant @relation(fields: [tenant_id], references: [id], onDelete: Cascade)`.
3. Add a compound index: `@@index([tenant_id])` for performance.
4. Add the model name ('Invoice') to the `AUDITABLE_MODELS` array inside `src/core/prisma.ts` so the interceptor automatically protects it.
