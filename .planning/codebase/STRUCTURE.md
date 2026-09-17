# Codebase Structure & Directory Tree

## Root Directory Organization

```
AI-AESTHATIC-HOSPITAL/
├── .planning/                  # Project planning, GSD workflows, and codebase maps
│   └── codebase/               # 7 structured codebase mapping documents
├── client/                     # Frontend Single Page Application (React 18 + Vite)
│   ├── public/                 # Static assets, favicons, logos
│   ├── src/                    # React application source code
│   ├── index.html              # Vite entry HTML
│   ├── multi-port-server.js    # Multi-port terminal dev reverse proxy (3001-3005)
│   ├── package.json            # Frontend npm dependencies and scripts
│   ├── tailwind.config.js      # Custom theme, palettes, 14px font clamp
│   ├── tsconfig.json           # Client TypeScript configuration
│   └── vite.config.ts          # Vite build and proxy settings
├── prisma/                     # Database ORM and relational schema
│   ├── migrations/             # Timestamped SQL DDL migrations
│   ├── schema.prisma           # Prisma relational schema (PostgreSQL)
│   └── seed.ts                 # Database initialization and verification script
├── src/                        # Backend Express API source code
│   ├── common/                 # Cross-cutting concerns, utilities, middleware, data
│   ├── config/                 # Environment variables, brand tokens, unresolved policies
│   ├── modules/                # Domain-specific backend modules (15 modules)
│   └── index.ts                # Main Express server entry point
├── test/                       # Automated architectural and AI test suites
│   ├── gemini-copilot.test.ts  # Gemini AI copilot & multimodal tests
│   └── system.test.ts          # Core invariant and architectural tests
├── docker-compose.yml          # Container configuration (Postgres, Backend, Client)
├── package.json                # Root npm dependencies and execution scripts
├── tsconfig.json               # Backend TypeScript configuration
├── AGENTS.md                   # Project rules and Git branch policies
├── README.md                   # System invariants, design system laws, and getting started
├── HANZALA.md                  # Hanzala branch feature overview and UI improvements
└── HANZALA_CHANGES.md          # Itemized technical changelog
```

---

## Backend Source Structure (`/src`)

### 1. Configuration (`src/config/`)
- `env.config.ts`: Zod schema validation for environment variables (`PORT`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.).
- `colors.config.ts`: Base brand tokens (`#E0FBFC`, `#C2DFE3`, `#9DB4C0`, `#5C6B73`, `#253237`).
- `unresolved-policies.config.ts`: 21 clinical, queue, token, and safety policies.

### 2. Common Infrastructure (`src/common/`)
- `data/`:
  - `mock-db.ts`: In-memory data store with array collections, initial seeds, and disk synchronization.
  - `hospital_persistent_store.json`: Persistent JSON store containing all entity records.
- `errors/`:
  - `AppError.ts`: Custom error class capturing HTTP status codes and operational flags.
  - `error-handler.ts`: Express global error handling middleware.
- `middleware/`:
  - `auth.middleware.ts`: JWT bearer token verification.
  - `rbac.middleware.ts`: Role-based route guard and clinical privacy response sanitization.
  - `audit.middleware.ts`: Automatic audit logging middleware for state mutations.
- `utils/`:
  - `logger.ts`: Structured console logging utility with colored badges.
  - `date-helper.ts`: Date parsing, time window checks, and date arithmetic.

### 3. Backend Modules (`src/modules/`)
Each module follows a structured separation of routes, controllers, and domain services:

| Module | Route File | Controller / Service Files | Responsibilities |
|---|---|---|---|
| **admin** | `admin.routes.ts` | `admin.controller.ts`, `admin.service.ts` | User access management, role switching, system config, database reset |
| **ai-agent** | `whatsapp.routes.ts` | `ai.controller.ts`, `ai.orchestrator.ts`, `gemini-client.ts`, `whatsapp-bot.service.ts` | Gemini AI orchestrator, tools (`/tools`), safety (`/safety`), RAG (`/rag`) |
| **appointment**| `appointment.routes.ts` | `appointment.controller.ts`, `appointment.service.ts`, `appointment-reminder.service.ts`| Booking requests, approval flows, rescheduling, reminders |
| **audit** | `audit.routes.ts` | `audit.controller.ts`, `audit.service.ts` | Querying append-only clinical audit records and actor timelines |
| **auth** | `auth.routes.ts` | `auth.controller.ts`, `auth.service.ts` | Login, registration, token issuance, profile queries |
| **billing** | `billing.routes.ts` | `billing.controller.ts`, `billing.service.ts` | Invoicing, payments, POS receipts, balance calculations |
| **clinical** | `clinical.routes.ts` | `clinical.controller.ts`, `clinical.service.ts`, `prescription-version.service.ts` | Clinical records, git-style prescription versions, diffing |
| **doctor** | `doctor.routes.ts` | `doctor.controller.ts`, `doctor.service.ts` | Doctor profiles, specialties, schedules, patient limits |
| **notification**| `notification.routes.ts`| `notification.controller.ts`, `notification.service.ts`, `/channels` | SMS and WhatsApp multi-channel notifications and retry failovers |
| **patient** | `patient.routes.ts` | `patient.controller.ts`, `patient.service.ts`, `patient-care.service.ts` | Patient demographic profiles, medical history, care packages |
| **pharmacy** | `pharmacy.routes.ts` | `pharmacy.controller.ts`, `pharmacy.service.ts` | Dispense queue, medicine catalog, batch tracking, stock procurement |
| **queue** | `queue.routes.ts` | `queue.controller.ts`, `queue.service.ts` | Check-in, call-next logic, status transitions, wait-time estimation |
| **reports** | `reports.routes.ts` | `reports.controller.ts`, `reports.service.ts` | Financial ledgers, clinical throughput metrics, BI analytics |
| **service** | `service.routes.ts` | `service.controller.ts`, `service.service.ts` | Hospital service offerings and procedure catalog |
| **token** | `token.routes.ts` | `token.controller.ts`, `token.service.ts` | Mathematical token allocation, sequence tracking, cancellation locking |

---

## Frontend Source Structure (`/client/src`)

### 1. App Shell & Layout (`components/layout/`)
- `CommandDeckShell.tsx`: The primary 3-column container layout.
- `StructuralRailNav.tsx`: Collapsible vertical navigation rail (16px collapsed, 64px expanded).
- `HeaderBar.tsx`: Dynamic Omnibar (`Ctrl+K`), Color Palette Studio, Light/Dark mode switcher, and notifications.

### 2. AI Copilot (`components/ai-copilot/`)
- `DockedCopilotDrawer.tsx`: Collapsible contextual AI assistant drawer.
- `AIChatMessageList.tsx`: Chat rendering supporting markdown, tool cards, and thoughts.
- `GeminiThinkingStream.tsx`: Visual streaming display of Gemini's reasoning steps.
- `InteractiveActionCard.tsx`: Rich interactive cards for booking, tokens, and prescription reviews.
- `FileAttachmentDock.tsx`: Base64 document and image upload dock for OCR analysis.
- `MarkdownRenderer.tsx`: Medical markdown renderer with sanitized tables and lists.
- `ChatHistoryDrawer.tsx`: Saved multi-session chat drawer.

### 3. Clinical & Queue Components (`components/`)
- `clinical/`: `ClinicalRecordEditor.tsx`, `ConsultationWorkspace.tsx`, `PrescriptionDiffViewer.tsx`.
- `queue/`: `CallNextActionButton.tsx`, `LiveQueueTable.tsx`.
- `receptionist/`: `BookingApprovalDeck.tsx`, `CheckInController.tsx`, `FrontDeskBillingPOS.tsx`, `RapidRegistrationModal.tsx`.
- `token/`: `DigitalTokenHUD.tsx`, `TokenMatrixGrid.tsx`.
- `reports/`: `ReportsAnalyticsDashboard.tsx`.
- `common/`: `AuditTimeline.tsx`, `ConfirmationModal.tsx`, `StatusBadge.tsx`, `WhatsAppSimulatorModal.tsx`.

### 4. Pages & Terminals (`pages/`)
- `admin/`: `user-access.tsx`, `config.tsx`, `database-maintenance.tsx`, `module-studio.tsx`, `queue-monitor.tsx`, `audit-vault.tsx`, `ledger.tsx`.
- `doctor/`: `dashboard.tsx` (Doctor Command Deck).
- `patient/`: `dashboard.tsx` (Patient Care Portal).
- `receptionist/`: `command-center.tsx` (Reception Desk & Walk-in Hub).
- `pharmacist/`: `pharmacy-workspace.tsx` (Pharmacy Dispense & Inventory Deck).
- `auth/`: `login.tsx` (Universal Authentication View).

### 5. Services & Utilities
- `services/api.ts`: Axios instance configured with base URL, token interceptors, and error handling.
- `utils/themePalette.ts`: Preset color definitions, CSS variable injector, and contrast calculators.
- `hooks/`: `useAICopilot.ts`, `useQueueStream.ts`, `useTokenMatrix.ts`.
