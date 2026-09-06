# Hospital Management & AI Agent System
## Clinical Command Deck, Concurrency-Safe Token Engine & Git-Style Prescription Versioning

A high-integrity clinical operating system engineered with strict architectural invariants, mathematical token guarantees, API-level privacy walls, immutable git-style prescription diffing, and a medically guarded AI copilot runtime.

---

## 🏛️ System Invariants & Core Pillars

### 1. Brand Tokens & Design System Laws
- **Base Surface (`--color-50`)**: `#E0FBFC` (Clinical Ice Cyan)
- **Secondary Surface (`--color-100`)**: `#C2DFE3` (Soft Blue-Gray)
- **Structural Grid (`--color-300`)**: `#9DB4C0` (Muted Slate)
- **Label Ink (`--color-600`)**: `#5C6B73` (Dark Slate Gray)
- **Contrast Ink (`--color-900`)**: `#253237` (Deep Charcoal Ink)
- **Workspace Layout**: 3-Column Clinical Command Deck (Structural Rail Navigation, Operational Command Deck, Contextual Docked AI Copilot Drawer).

### 2. Mathematical Laws of Tokens
- **Unique Scope**: `doctor_id + appointment_date + token_number`.
- **Non-Reusability Rule**: Once cancelled, a token slot remains permanently CANCELLED for that day.
- **Capacity Constraint**: $A < L$ where $A = \text{Sum(RESERVED, ACTIVE, COMPLETED)}$ and $L = \text{daily\_patient\_limit}$.
- **Sequence Progression**: $T_{max} = A + C$ where $C$ is the count of cancelled tokens.

### 3. Queue Engine & "Call Next Patient" Skip Logic
- Separate Appointment Lifecycle (`PENDING`, `CONFIRMED`, `DECLINED`, `CANCELLED`, `RESCHEDULED`) and Queue Lifecycle (`NOT_CHECKED_IN`, `WAITING`, `CALLED`, `IN_CONSULTATION`, `COMPLETED`, `NO_SHOW`).
- **Call Next Algorithm**: Selects the next patient where `appointment.doctor_id == current_doctor_id`, `appointment.status == 'CONFIRMED'`, and `queue_entry.queue_status == 'WAITING'`, ordered by `token_number ASC`. Skips un-checked-in or non-waiting tokens.

### 4. Prescription Versioning (Git-Style Diff) & Clinical Auditing
- Prescriptions are never overwritten. Updating creates a new immutable version $v_2$ linked to $v_1$ with mandatory `correction_reason`.
- Doctor UI renders side-by-side git diff with strikethroughs; Patient UI receives only `is_current = TRUE`.
- Every clinical record modification generates an atomic append-only entry in `audit_logs`.

### 5. Medical AI Safety Guardrails
- **Diagnostic Deflection**: Automatically rejects diagnostic or prescription requests with medical disclaimer.
- **2-Step Confirmation Handshake**: Requires explicit verification before executing cancellations or reschedules.
- **Tool Registry**: Strict whitelist (`findDoctor`, `findService`, `findAvailableTokens`, `createBookingRequest`, `cancelAppointment`, `requestReschedule`, `getPatientClinicalHistory`, `getBasicPaymentStatus`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ / 20+ / 22+
- npm 9+
- PostgreSQL 14+ (or Docker Compose)

### 1. Installation
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Database Setup
```bash
# Run Prisma migrations / DDL
npm run prisma:migrate

# Seed realistic clinical data
npm run seed
```

### 3. Start Development Servers
```bash
# Option 1: Single command to run BOTH Backend & Frontend together
npm run dev:all

# Option 2: Run in separate terminals
# Terminal 1: Backend API (Port 4000)
npm run dev

# Terminal 2: Frontend Client (Port 3000)
cd client
npm run dev
```

---

## 📂 Architecture Structure
```
hospital-management-system/
├── prisma/
│   ├── schema.prisma                  # PostgreSQL Relational Schema
│   ├── seed.ts                        # Seed data (Admin, Doctors, Services, Tokens)
│   └── migrations/20260904_init/      # Raw PostgreSQL DDL
├── src/
│   ├── config/                        # Colors, Environment, 21 Policy configs
│   ├── common/                        # Errors, RBAC, Auth, Audit, Logger, Date utils
│   └── modules/                       # Auth, Patient, Doctor, Service, Token, Appointment,
│                                      # Queue, Clinical, Billing, Notification, Audit, AI Agent
└── client/                            # Next.js / React 18 3-Column Command Deck
```
