# External & Internal Integrations

## Overview
This document details all external APIs, service integrations, communication protocols, AI runtimes, and local data persistence mechanisms integrated into the Hospital Management & AI Agent System.

---

## 1. Google Gemini AI Engine

### Architecture & Routing
- **Primary Model**: `gemini-3.8-flash` (configurable via `process.env.AI_MODEL`).
- **Client Implementation**: `src/modules/ai-agent/gemini-client.ts`.
- **Orchestration**: `src/modules/ai-agent/ai.orchestrator.ts` (manages multi-turn conversation, reasoning streams, tool calls, and grounding).

### Capabilities & Pipelines
1. **Multimodal Medical File Attachment Ingestion**:
   - Accepts base64-encoded PDF and image lab reports (e.g., CBC blood tests, aesthetic dermoscopy images).
   - Ingests files into Gemini's multimodal prompt for OCR analysis and clinical synthesis.
2. **Tool Dispatch Engine**:
   - Whitelist of specialized clinical tools executed in an iterative loop:
     - `doctor-discovery.tool.ts`: Doctor search by name, department, fee, and language.
     - `token-lookup.tool.ts`: Available token sequence inspection for doctor and date.
     - `booking-request.tool.ts`: Creating appointment booking requests with token reservations.
     - `cancellation.tool.ts`: Initiating token release with 2-step verification.
     - `reschedule.tool.ts`: Requesting appointment slot migrations.
     - `patient-history.tool.ts`: Fetching past consultations and current prescriptions.
     - `pharmacy-lookup.tool.ts`: Medicine availability and batch stock lookup.
     - `basic-billing.tool.ts`: Invoice and payment summary retrieval.
     - `packages-tracker.tool.ts`: Aesthetic package sessions tracker.
     - `lab-tests-tracker.tool.ts`: Diagnostic lab test results and status lookup.
     - `reports-generator.tool.ts`: Automated clinical summary and BI report generation.
     - `navigation.tool.ts`: Deep-link routing across terminal modules.
3. **Safety Guardrails**:
   - `medical-safety.guard.ts`: Diagnostic deflection filter intercepting diagnostic or treatment questions with clear disclaimers.
   - `confirmation.guard.ts`: 2-step handshake requiring explicit user confirmation before executing state mutations (e.g., cancellation or rescheduling).
4. **Retrieval-Augmented Generation (RAG)**:
   - `src/modules/ai-agent/rag/vector-store.ts`: In-memory semantic vector store for hospital services, procedures, doctor bios, and operational policies.
   - `src/modules/ai-agent/rag/retriever.service.ts`: Cosine similarity search retrieving relevant context chunks for grounding.

---

## 2. WhatsApp Business & Meta Cloud API

### Integration Points
- **Inbound Webhook**: `POST /api/ai/whatsapp/webhook` (`src/modules/ai-agent/whatsapp.routes.ts`).
- **Verification Endpoint**: `GET /api/ai/whatsapp/webhook` (`metaVerifyToken` challenge verification).
- **Outbound WhatsApp Notification Channel**: `src/modules/notification/channels/whatsapp.channel.ts`.
- **Bot Processing Service**: `src/modules/ai-agent/whatsapp-bot.service.ts`.

### Credentials & Environment
- `META_WHATSAPP_TOKEN`: Bearer token for the Meta Cloud API.
- `META_WHATSAPP_PHONE_NUMBER_ID`: Sender phone number ID assigned by Meta Business Manager.
- `META_WHATSAPP_VERIFY_TOKEN`: Verification token matching webhook subscription (default: `hospital_wa_verify_token_2026`).

### Development Simulation
- `client/src/components/common/WhatsAppSimulatorModal.tsx`: A live interactive UI widget simulating mobile WhatsApp conversations, template messages, and quick-reply action buttons directly in the browser without calling external Meta endpoints.

---

## 3. SMS Gateway & Notification Pipeline

### Architecture
- **Service**: `src/modules/notification/notification.service.ts`.
- **Channels**:
  - `src/modules/notification/channels/whatsapp.channel.ts`
  - `src/modules/notification/channels/sms.channel.ts`

### Multi-Channel Failover Logic
1. System reads patient's `primaryNotificationChannel` (e.g., WhatsApp).
2. Attempts delivery to primary channel.
3. If primary channel returns error or times out (`NOTIFICATION_FAILOVER_TIMEOUT_MS`: 3000ms), immediately falls back to `backupNotificationChannel` (e.g., SMS).
4. Records full delivery attempt trail, payload, and status in `NotificationLog`.

---

## 4. Database & Persistence Layer

### 1. Relational Blueprint (Prisma + PostgreSQL)
- **Engine**: PostgreSQL 16 Alpine (`docker-compose.yml`).
- **Connection Strings**: `DATABASE_URL`, `DIRECT_URL`.
- **Schema**: `prisma/schema.prisma` declaring 16 relational models, enums (`UserRole`, `AppointmentStatus`, `QueueStatus`, `TokenStatus`), and composite unique constraints (`uq_doctor_date_token`, `uq_prescription_version`).

### 2. Active Local Simulation Store (`mock-db.ts`)
- **Persistence Target**: `src/common/data/hospital_persistent_store.json`.
- **Lifecycle**:
  - On server boot, `loadFromDisk()` hydrates in-memory collections (`users`, `patients`, `doctors`, `appointments`, `dailyTokens`, `clinicalRecords`, `dispenseRecords`, `medicines`, `auditLogs`, etc.).
  - On mutations, `saveToDisk()` serializes active arrays back to JSON on disk.
  - Guarantees seamless demo experience, data persistence across server restarts, and offline zero-config operation.

---

## 5. Authentication & Authorization

### Protocol
- **Mechanism**: JSON Web Tokens (JWT) using HMAC SHA-256.
- **Header**: `Authorization: Bearer <token>`.
- **Expiration**: 7 days (`JWT_EXPIRES_IN: '7d'`).

### Role-Based Access Control (RBAC)
- Supported Roles: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`, `PHARMACIST`.
- Guard Middleware: `authMiddleware` (`src/common/middleware/auth.middleware.ts`) and `rbacMiddleware` (`src/common/middleware/rbac.middleware.ts`).
- Dynamic Module Access: `allowedModules` field on `DbUser` allowing custom permissions (e.g., granting a doctor access to billing or a receptionist access to pharmacy queue).

---

## 6. Multi-Port Dev Proxy (`client/multi-port-server.js`)

- **Protocol**: HTTP/1.1 with WebSocket forwarding (`ws: true`, `xfwd: true`).
- **Proxy Engine**: `http-proxy` forwarding incoming ports to `http://127.0.0.1:3000`.
- **Port Dispatch**:
  - `3001` -> Auto-logs in Doctor Terminal (`dr.aisha@hospital.com`).
  - `3002` -> Auto-logs in Receptionist Terminal (`receptionist@hospital.com`).
  - `3003` -> Auto-logs in Patient Terminal (`john.doe@example.com`).
  - `3004` -> Auto-logs in Admin Ops Vault (`admin@hospital.com`).
  - `3005` -> Auto-logs in Pharmacist Workspace (`pharmacy@hospital.com`).
- **Fallback UI**: Serves auto-refreshing clinical connecting splash screen if Vite dev server is temporarily spinning up.
