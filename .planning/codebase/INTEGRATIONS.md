# External & Internal System Integrations

## 1. Multi-Port Terminal Proxy Integration (`client/multi-port-server.js`)
The application implements an architecture for role-based terminal isolation:
- **Port 3000**: Core Vite React server serving client application assets.
- **Dedicated Role Ports**:
  - `3001`: Clinical Doctor Command Deck (`dr.aisha@hospital.com`)
  - `3002`: Reception & Queue Desk (`receptionist@hospital.com`)
  - `3003`: Patient Self-Service Portal (`john.doe@example.com`)
  - `3004`: Admin Security Vault & Audit Ledger (`admin@hospital.com`)
  - `3005`: Pharmacy & Dispensary Suite (`pharmacy@hospital.com`)
- **Isolation Mechanism**: Built using `http-proxy` with WebSocket upgrade forwarding. Each browser window opened on `localhost:300X` possesses an independent browser storage boundary (`localStorage`), allowing simultaneously active multi-role demonstrations without session crosstalk.
- **Production Path Fallback**: In hosted production (single port), role routing seamlessly adapts via path routing (`/doctor`, `/receptionist`, `/patient`, `/admin`, `/pharmacist`), subdomain headers, or URL query parameters (`?role=doctor`).

---

## 2. Authentication & Authorization Integration
- **Token Protocol**: Bearer Token Authentication using JSON Web Tokens (`jsonwebtoken`).
- **Signature & Verification**: Signed with `JWT_SECRET` with configurable expiry (`JWT_EXPIRES_IN`, default 7 days).
- **Client Handling**: Centralized Axios request interceptor attaches `Authorization: Bearer <token>` to all outbound requests.
- **Role Boundary Walls**:
  - `authMiddleware` decodes token and binds `req.user`.
  - `requireRole(['ADMIN', 'DOCTOR', ...])` strictly rejects unauthorized access.
  - Non-admin users are strictly stripped of all `admin_*` module capabilities even if manually requested.
  - Diagnostic and clinical record endpoints filter out `privateNotes` from non-doctor responses.

---

## 3. Medical AI Copilot & WhatsApp Gateway Integration
- **Endpoints**:
  - `POST /api/ai/chat`: Clinical Copilot chat endpoint with optional Bearer Auth (allowing guest discovery or patient-authenticated context).
  - `POST /api/ai/whatsapp/webhook`: Two-way messaging webhook simulating WhatsApp Business API.
- **Natural Language & Linguistic Routing**:
  - Supports English and Roman Urdu ("Meri appointment kab hai?", "Augmentin stock mein hai?", etc.).
  - Integrates Medical Safety Guard that halts diagnostic prescription advice and renders appropriate triage guidance.
- **Tool Integration Registry**:
  - `findDoctor`: Doctor directory query by specialty or name.
  - `findService`: Clinical service directory and fee structures.
  - `findAvailableTokens`: Real-time token slot querying.
  - `createBookingRequest`: Appointment creation hook with token reservation.
  - `cancelAppointment`: Appointment cancellation with mathematical token lock.
  - `requestReschedule`: Rescheduling workflows.
  - `getPatientClinicalHistory`: Patient-scoped history retrieval.
  - `getBasicPaymentStatus`: Billing and payment ledger querying.
  - `pharmacyLookup`: Real-time medicine inventory stock and pricing verification.

---

## 4. Notification Gateway System
- **Module**: `src/modules/notification/`
- **Supported Channels**:
  - **WhatsApp**: Integrated via `WhatsAppChannel` simulating Twilio/Meta Cloud API with automatic fallback.
  - **SMS**: Integrated via `SmsChannel` with formatted plain-text delivery.
- **Automated Scheduled Workflows**:
  - 48-Hour Appointment Reminder Engine (`appointment-reminder.service.ts`).
  - Queue Call Alert: Sends SMS/WhatsApp alerts when a patient's token is transitioned to `CALLED`.
  - Prescription Issuance: Automatically sends digital prescription receipts upon doctor finalization.
- **Audit Logging**: Every dispatched notification logs attempt count, primary channel, fallback status, and payload in `notification_logs`.

---

## 5. Storage & Database Integration
- **Active Engine**: In-memory data store with file persistence (`src/common/data/mock-db.ts`).
  - Synchronizes mutations to `src/common/data/hospital_persistent_store.json` using atomic file writes.
  - Automatically re-seeds if the persistent file is missing or corrupted.
- **PostgreSQL / Prisma Target**:
  - Configured in `prisma/schema.prisma` with standard connection pooling via `DATABASE_URL` and `DIRECT_URL`.
  - DDL schema matches the exact database entities used in the domain logic.
