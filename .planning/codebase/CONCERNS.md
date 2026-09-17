# Technical Debt, Vulnerabilities & System Concerns

## 1. Dual Data Architecture Divergence

### The Issue
The repository maintains two divergent data persistence paradigms:
1. **Prisma Relational Blueprint**: `prisma/schema.prisma` and `docker-compose.yml` configure a production PostgreSQL 16 schema complete with 16 relational models, foreign keys, unique composite indexes, and enum types.
2. **Active Mock Data Layer**: In practice, all 15 backend services (`src/modules/*/*.service.ts`) import and mutate the in-memory `db` object in `src/common/data/mock-db.ts`, which persists to `src/common/data/hospital_persistent_store.json`.

### Impact & Risk
- If deploying to a production clustered environment, the system cannot scale horizontally: instances will not share state unless pointing to a shared database.
- Transitioning to PostgreSQL requires a full service-layer refactor, replacing native JavaScript array operations (`.find()`, `.filter()`, `.map()`, `.push()`) with asynchronous Prisma ORM queries (`prisma.appointment.findMany()`, `prisma.$transaction()`, etc.).

---

## 2. File-Based JSON Persistence & Race Conditions

### The Issue
In `src/common/data/mock-db.ts`:
- Mutations call `saveToDisk()`, which executes synchronous file writes (`fs.writeFileSync`) to write the entire 170KB+ JSON file on every update.
- No file-locking mechanism exists.

### Impact & Risk
- Under concurrent requests (e.g., rapid token allocations from multiple receptionists or simultaneous AI agent booking requests), simultaneous writes may lead to file corruption or lost updates.
- Synchronous file I/O blocks Node's event loop, creating latency spikes during heavy mutation volume.

---

## 3. High Cyclomatic Complexity & Monolithic Files

Several files exceed 50KB to 115KB, mixing presentation, business rules, mock data, and dialog management in a single module:

| File | Size | Concerns |
|---|---|---|
| `src/modules/ai-agent/ai.orchestrator.ts` | **~115 KB** | Monolithic prompt engineering, tool dispatching, markdown generation, fallback branching |
| `client/src/pages/admin/user-access.tsx` | **~105 KB** | User table, permission matrices, creation modals, role editing all in one file |
| `client/src/pages/pharmacist/pharmacy-workspace.tsx` | **~95 KB** | Dispense queue, inventory, POS, procurement, batch expiry in one component |
| `client/src/components/receptionist/FrontDeskBillingPOS.tsx` | **~89 KB** | Payment calculations, invoice generation, discount math, thermal receipt printing |
| `src/common/data/mock-db.ts` | **2,519 lines (~87 KB)** | Combines entity types, hardcoded demo seed data, disk persistence, helper methods |
| `client/src/components/reports/ReportsAnalyticsDashboard.tsx` | **~74 KB** | All BI charts, metric cards, export routines, filtering logic |
| `client/src/pages/patient/dashboard.tsx` | **~61 KB** | Care history, appointments, token HUD, bills, profile |
| `client/src/components/layout/HeaderBar.tsx` | **~59 KB** | Omnibar search, theme studio, user drawer, notification panel |
| `client/src/pages/admin/module-studio.tsx` | **~55 KB** | Module configuration and visual editor |

### Recommendation
Decompose these oversized components into smaller domain-specific sub-components, custom hooks, and utility modules.

---

## 4. Unbounded In-Memory Data Growth

### The Issue
- `db.dispenseRecords`, `db.auditLogs`, `db.notificationLogs`, `db.dailyTokens`, and `db.appointments` are retained in-memory in `mock-db.ts`.
- There is no truncation, TTL, or pagination mechanism for historical logs and audit events in the active store.

### Impact & Risk
- Prolonged server uptime with high test or demo activity will cause `hospital_persistent_store.json` to swell, increasing server memory footprint and `loadFromDisk`/`saveToDisk` serialization latency.

---

## 5. Security, Secrets & Access Control

1. **Default JWT Secret**:
   - `src/config/env.config.ts` provides a default fallback string (`hospital-jwt-secret-token-key-2026-antigravity`). If production deployments omit `JWT_SECRET`, tokens can be forged.
2. **Permissive Localhost CORS**:
   - `src/index.ts` allows any port originating from `localhost` or `127.0.0.1`. While ideal for multi-port terminal development, it must be restricted to explicit domains in staging/production.
3. **Hardcoded Demo Accounts**:
   - Pre-seeded demo credentials and passwords in `mock-db.ts` must be stripped or disabled in production mode.

---

## 6. Frontend Testing & State Synchronization Gaps

1. **Absence of Client Automated Tests**:
   - `client/` has no test framework configured (no Jest, Vitest, or React Testing Library). Regression bugs in critical financial calculations (e.g., `FrontDeskBillingPOS.tsx`) can only be caught through manual UI verification.
2. **Cross-Terminal State Synchronization**:
   - Because the frontend lacks a centralized reactive store or WebSocket push connection (state relies on local `useState` and periodic manual polling), actions performed in the Doctor Command Deck (e.g., calling next patient) do not instantaneously update the Receptionist Command Center without a manual refresh or poll interval.
