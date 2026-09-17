# System Architecture & Core Invariants

## High-Level System Architecture

The Hospital Management & AI Agent System is engineered as a domain-driven, modulated clinical operating system. It bridges rigorous mathematical token integrity, immutable medical record diffing, and clinical queue coordination with a medically guarded, multimodal Gemini AI copilot runtime.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND COMMAND DECK                                 │
│                                                                                        │
│   ┌─────────────────────┐  ┌───────────────────────────────┐  ┌─────────────────────┐   │
│   │ Structural Rail Nav │  │    Operational Command Deck    │  │ Docked AI Copilot   │   │
│   │  (Expandable w-16)  │  │  (Role-Specific Working Desk)  │  │   (Context Drawer)  │   │
│   └──────────┬──────────┘  └───────────────┬───────────────┘  └──────────┬──────────┘   │
└──────────────┼─────────────────────────────┼─────────────────────────────┼─────────────┘
               │                             │                             │
               ▼                             ▼                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   REVERSE PROXY & API GATEWAY                          │
│   • Ports 3001-3005 Multi-Port Terminal Router                                         │
│   • CORS localhost:* Dynamic Policy                                                    │
│   • Express Security Middlewares (Helmet, JSON Parser)                                 │
│   • JWT Authentication & RBAC Middleware with Dynamic Module Permission Layer          │
└────────────────────────────────────────────┬───────────────────────────────────────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                      EXPRESS API MODULES                                │
│                                                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │     Auth     │ │   Patient    │ │    Doctor    │ │   Service    │ │    Token     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Appointment  │ │    Queue     │ │   Clinical   │ │   Billing    │ │   Pharmacy   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Notification │ │    Audit     │ │    Admin     │ │   Reports    │ │   AI Agent   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└────────────────────────────────────────────┬───────────────────────────────────────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE SUBSYSTEM ENGINES                               │
│                                                                                        │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────────────────┐  │
│  │ Mathematical Token    │ │ Queue & Call-Next     │ │ Git-Style Prescription       │  │
│  │ Engine ($T_{max}=A+C$)│ │ Skip Engine           │ │ Versioning ($v_1 \to v_2$)   │  │
│  └───────────────────────┘ └───────────────────────┘ └──────────────────────────────┘  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────────────────┐  │
│  │ Medical AI Safety     │ │ Privacy Wall & RBAC   │ │ Append-Only Audit            │  │
│  │ Guardrails            │ │ Clinical Redaction    │ │ Event Ledger                 │  │
│  └───────────────────────┘ └───────────────────────┘ └──────────────────────────────┘  │
└────────────────────────────────────────────┬───────────────────────────────────────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                       STORAGE TIER                                      │
│                                                                                        │
│  ┌───────────────────────────────────────────────┐ ┌─────────────────────────────────┐ │
│  │ Active Persistence Engine (mock-db.ts)        │ │ Relational Schema Blueprint     │ │
│  │ -> src/common/data/hospital_persistent_store  │ │ -> Prisma Client & PostgreSQL   │ │
│  │    .json (Zero-config instant recovery)       │ │    (Target production RDBMS)    │ │
│  └───────────────────────────────────────────────┘ └─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Core Architectural Pillars & Invariants

### 1. Mathematical Laws of Tokens (`src/modules/token/token.service.ts`)
The token subsystem enforces zero-overlap sequential numbers across doctor schedules:
- **Composite Key Invariant**: Every token is strictly scoped to `(doctor_id, appointment_date, token_number)`.
- **Capacity Constraint**: Active appointments $A$ must satisfy:
  $$A < L \quad \text{where } A = \text{Count}(\text{RESERVED}, \text{ACTIVE}, \text{COMPLETED}) \text{ and } L = \text{daily\_patient\_limit}$$
- **Sequence Progression Law**:
  $$T_{max} = A + C \quad \text{where } C = \text{Count}(\text{CANCELLED})$$
- **Non-Reusability Rule**: Once a token is cancelled, its number slot is permanently locked. The next issued token will strictly be $T_{max} + 1$, preventing schedule collisions, double-booking, or patient confusion.

---

### 2. Queue Engine & "Call Next Patient" Skip Logic (`src/modules/queue/queue.service.ts`)
The system decouples the **Appointment Lifecycle** from the **Physical Queue Lifecycle**:
- **Appointment Lifecycle**: `PENDING` $\to$ `CONFIRMED` $\to$ `DECLINED` / `CANCELLED` / `RESCHEDULED`.
- **Queue Lifecycle**: `NOT_CHECKED_IN` $\to$ `WAITING` $\to$ `CALLED` $\to$ `IN_CONSULTATION` $\to$ `COMPLETED` / `NO_SHOW`.
- **Call-Next Algorithm**:
  1. Filters by `appointment.doctor_id === current_doctor_id` AND `appointment.appointment_date === today`.
  2. Requires `appointment.status === 'CONFIRMED'` AND `queue_entry.queue_status === 'WAITING'`.
  3. Sorts by `token.token_number ASC`.
  4. Skips patients who have not physically arrived (`NOT_CHECKED_IN`), have already been completed, or were cancelled.
  5. Transitions candidate to `CALLED`, sets `called_time = NOW()`, and notifies the patient terminal.

---

### 3. Git-Style Prescription Versioning & Audit Vault (`src/modules/clinical/`)
Prescription records follow append-only cryptographic immutability:
- **Zero-Overwrite Rule**: In-place updates to prescriptions are strictly disallowed.
- **Version Branching**: Modifying a prescription spawns a new immutable version ($v_{n+1}$) referencing the prior version ($v_n$).
- **Mandatory Correction Reason**: Requires explicit rationale (e.g., "Adjusted dosage due to mild rash", "Switching brand due to stock unavailability").
- **Clinician vs Patient UI Divergence**:
  - Clinician View (`PrescriptionDiffViewer.tsx`): Renders side-by-side git-style diffs highlighting modified medications, dosages, and strike-through removals.
  - Patient View: Receives only the single current active version (`is_current: true`).
- **Audit Ledger**: Every mutation generates an immutable entry in `audit_logs` tracking `actor_id`, `actor_type`, `action`, `resource_type`, `resource_id`, `previous_state`, `new_state`, and `timestamp`.

---

### 4. Medical AI Safety Guardrails & Handshake Protocol (`src/modules/ai-agent/safety/`)
AI interactions are mediated by safety barriers:
1. **Diagnostic Deflection Guard**:
   - Detects diagnostic queries ("Do I have cancer?", "Prescribe me amoxicillin").
   - Intercepts requests before tool execution and returns a standardized medical disclaimer (`UNRESOLVED_POLICIES.DIAGNOSTIC_DEFLECTION_MESSAGE`).
2. **2-Step Confirmation Handshake**:
   - High-impact operations (`CANCEL_APPOINTMENT`, `RESCHEDULE_APPOINTMENT`) cannot be performed in a single turn.
   - The agent stages an interactive confirmation card requiring explicit human approval (`confirmed: true`) before invoking the mutation tool.
3. **Multimodal OCR Extraction**:
   - Ingests base64 PDF/image lab attachments, performing document OCR and structured fact extraction without giving ungrounded medical diagnoses.

---

### 5. API Privacy Walls & RBAC Redaction (`src/common/middleware/rbac.middleware.ts`)
- **Doctor-Patient Boundary**: Historical clinical notes are restricted to doctors with an active relationship or explicit referral.
- **Clinical Note Sanitization**:
  - `private_notes` are redacted when clinical records are accessed by Receptionists or Patients.
  - Front-desk personnel only view administrative and billing metadata, preserving strict HIPAA/confidentiality boundaries.

---

### 6. Frontend 3-Column Command Deck Architecture

```
┌─────────────────┬─────────────────────────────────────────────────┬───────────────────────────────┐
│ Structural Rail │ Operational Command Deck                        │ Docked AI Copilot Drawer      │
│ (Icon Rail w-16 │ (Dense, role-customized operational center:     │ (Contextual intelligence:     │
│  expands to     │  Doctor Workspace, Front Desk Billing POS,      │  Live streaming thoughts,     │
│  w-64 on hover) │  Pharmacy Dispense Deck, Admin Audit Vault,     │  Action cards, OCR dock,      │
│                 │  Patient Portal)                                │  WhatsApp previewer)          │
└─────────────────┴─────────────────────────────────────────────────┴───────────────────────────────┘
```

- **Terminal Auto-Resolution**: Resolves role and user identity via window port (`3001` - `3005`), URL path (`/doctor`, `/admin`, etc.), query parameters (`?role=pharmacist`), or subdomain.
- **Dynamic Color Studio**: 6 curated palettes + custom color wheel studio storing preferences in `localStorage` and dynamically setting CSS variables.
- **Strict 14px Typography Ceiling**: Project-wide constraint capping all font sizes at $\le 14$px (`xs`: 11px, `sm`: 12px, `base`: 13px, `lg`-`9xl`: 14px).
