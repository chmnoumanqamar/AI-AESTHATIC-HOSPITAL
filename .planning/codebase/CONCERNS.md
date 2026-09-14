# Technical Concerns, Risks & Architecture Roadmap

## 1. Dual Database Layer: Mock DB vs PostgreSQL Migration
- **Current State**: The active runtime and API layer operate against an in-memory data store (`src/common/data/mock-db.ts`) persisted to disk via synchronous JSON writes (`hospital_persistent_store.json`). Meanwhile, a complete PostgreSQL relational schema exists in `prisma/schema.prisma`.
- **Risk**: 
  - In a multi-process or horizontally scaled deployment (e.g., Docker Swarm, Kubernetes, multiple Node instances behind PM2/Nginx), in-memory state will diverge, causing race conditions and inconsistent token/queue states across instances.
- **Recommended Remediation**:
  - Implement a Prisma data access repository layer that implements the same interfaces as `mock-db.ts`.
  - Provide a configuration toggle (`DATABASE_DRIVER=prisma` vs `DATABASE_DRIVER=memory`) to smoothly migrate from file persistence to hosted PostgreSQL.

---

## 2. File I/O Serialization & Concurrency Bottlenecks
- **Current State**: Persistent updates serialize the entire database state to `hospital_persistent_store.json` using synchronous file system operations (`fs.writeFileSync`).
- **Risk**:
  - As patient records, audit logs, and prescription versions accumulate, serializing the full dataset on every minor state change will increase event-loop block time and disk latency under high concurrent load.
- **Recommended Remediation**:
  - Debounce or batch disk writes, or transition audit logs and historical transactions directly to append-only streams / relational tables.

---

## 3. Public AI Chatbot Rate Limiting
- **Current State**: The `/api/ai/chat` endpoint is publicly accessible without mandatory authentication to allow prospective patients to explore hospital services and book appointments.
- **Risk**:
  - Vulnerability to automated scraping, prompt injection abuse, or denial-of-service spikes if traffic surges.
- **Recommended Remediation**:
  - Integrate IP-based rate limiting middleware (e.g., `express-rate-limit`) on `/api/ai/*` endpoints.
  - Implement captcha or session-based fingerprinting for unauthenticated chat interactions.

---

## 4. Production Secret & Credential Hardening
- **Current State**: Default demo passwords (e.g., `Password123!`, `1234567`) and placeholder `JWT_SECRET` values exist in seed scripts and `.env.example`.
- **Risk**:
  - Risk of deploying factory demo credentials to public environments.
- **Recommended Remediation**:
  - Enforce validation during application boot in `src/config/env.config.ts` requiring high-entropy secrets when `NODE_ENV === 'production'`.
  - Ensure demo seed accounts are disabled or password-reset forced upon live clinic handover.

---

## 5. Real-Time WebSocket Queue Broadcasting
- **Current State**: Frontend queue synchronization currently utilizes polling intervals and local state callbacks.
- **Opportunity**:
  - Upgrading the queue engine to native WebSockets (`Socket.IO` or WS) will provide immediate sub-second visual updates across doctor consultation rooms, waiting room display screens, and patient mobile devices without polling overhead.
