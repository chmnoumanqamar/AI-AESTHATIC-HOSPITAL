# System Architecture

## 1. Architectural Philosophy & Overview
The **AI Aesthetic Hospital Clinical Operating System** is engineered around safety invariants, mathematical token guarantees, API-level privacy isolation, immutable clinical auditing, and guarded AI copilot runtimes.

The architecture comprises two primary tiers:
1. **Frontend**: A high-density React 18 / Tailwind Clinical Command Deck featuring 3-column navigation, isolated multi-terminal switching, and micro-animations.
2. **Backend**: A modular Express & TypeScript engine with strict service boundaries, mathematical token state machines, append-only audit logging, and medical guardrails.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        3-COLUMN CLINICAL COMMAND DECK                  │
├──────────────┬──────────────────────────────────────────┬──────────────┤
│ Column 1     │ Column 2                                 │ Column 3     │
│ Structural   │ Operational Command Deck                 │ Contextual   │
│ Rail Nav     │ - HeaderBar (Omnibar, Palette, DarkMode) │ Docked AI    │
│ (Icon/Expand)│ - Active Role View / Tab Canvas          │ Copilot      │
│              │ - Dynamic Datagrids & Diff Viewers       │ Drawer       │
└──────────────┴──────────────────────────────────────────┴──────────────┘
                                  │
                                  ▼ REST APIs / Port Proxies (3000-3005)
┌────────────────────────────────────────────────────────────────────────┐
│                     BACKEND MODULAR MONOLITH (Express)                 │
├────────────────────────────────────────────────────────────────────────┤
│ [Auth] [Tokens] [Appointments] [Queue] [Clinical] [Pharmacy] [Admin]  │
├────────────────────────────────────────────────────────────────────────┤
│ Middlewares: Auth (JWT) | RBAC | Audit Logging | Global Error Handler  │
├────────────────────────────────────────────────────────────────────────┤
│ Data Engine: In-Memory Runtime Store + Atomic Disk Persistence (JSON)  │
│ (Target Relational Architecture: Prisma ORM + PostgreSQL DDL)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Mathematical Laws of Tokens
The token system enforces invariant state transitions to eliminate double-booking and slot contention:

1. **Unique Key Constraint**:
   $$K = \text{doctor\_id} + \text{appointment\_date} + \text{token\_number}$$
   Each token slot is uniquely identified across time and doctor schedules.

2. **Non-Reusability Rule**:
   Once a token slot is marked `CANCELLED`, it is permanently locked for that doctor on that date. It is never recycled, reassigned, or resurrected.

3. **Capacity Constraint**:
   $$\text{Sum}(\text{RESERVED}, \text{ACTIVE}, \text{COMPLETED}) < \text{daily\_patient\_limit}$$
   New allocations are rejected if active commitments reach the doctor's configured ceiling.

4. **Sequence Progression**:
   $$T_{\text{next}} = T_{\text{max}} + 1$$
   Sequential allocation always increments beyond the highest previously issued token number, regardless of cancellations.

---

## 3. Queue Engine & "Call Next Patient" Skip Logic
The system decouples the **Appointment Lifecycle** from the **Physical Queue Lifecycle**:

- **Appointment Statuses**: `PENDING`, `CONFIRMED`, `DECLINED`, `CANCELLED`, `RESCHEDULED`.
- **Queue Statuses**: `NOT_CHECKED_IN`, `WAITING`, `CALLED`, `IN_CONSULTATION`, `COMPLETED`, `NO_SHOW`.

### "Call Next Patient" Selection Algorithm:
When a doctor triggers "Call Next Patient":
1. Query tokens where `doctor_id == current_doctor`.
2. Filter for `appointment.status == 'CONFIRMED'` AND `queue_entry.queue_status == 'WAITING'`.
3. Order strictly by `token_number ASC`.
4. Skip any patients who have not checked in or whose queue status is not `WAITING`.
5. Atomically transition the target patient to `CALLED` and dispatch real-time alerts.

---

## 4. Git-Style Prescription Versioning & Clinical Diffing
Prescriptions are treated as immutable historical records to protect medico-legal integrity:

- **Immutability**: Clinical prescriptions are never updated in-place.
- **Version Tree**: Modifications create a new version record $v_{n+1}$ linked to parent $v_n$.
- **Mandatory Reason**: Every update requires an explicit `correctionReason` entered by the physician.
- **Client Diff Presentation**:
  - **Doctor UI**: Renders side-by-side git-style diffs with strikethroughs and additions for replaced dosages, medications, or instructions.
  - **Patient UI / Pharmacy UI**: Receives only the single latest verified record where `is_current == TRUE`.
- **Audit Logging**: Every version creation logs previous state, new state, doctor identity, and timestamp into `audit_logs`.

---

## 5. API-Level Privacy Walls & RBAC Boundaries
- **Clinical Privacy Shield**:
  - `privateNotes` authored by doctors are strictly redacted (`sanitizeClinicalResponse`) from all patient and receptionist responses.
  - Only authenticated doctors and authorized administrators can inspect private clinical remarks.
- **Admin Isolation**:
  - Admin modules (`admin_users`, `admin_audit`, `admin_config`, `admin_database`, `admin_studio`) are strictly inaccessible to non-admin roles, even if malicious requests attempt to pass module identifiers.
- **Clean Department Onboarding Standard**:
  - When an administrator provisions a new staff member (Doctor, Receptionist, Pharmacist), their clinical deck starts with a pristine zero-state queue (0 items, 0 bookings), preventing accidental exposure to demo/factory data.

---

## 6. Medical AI Guardrails & Natural Language Orchestrator
The embedded AI assistant operates with a safety runtime:

1. **Diagnostic Deflection**: Any natural language prompt requesting medical diagnoses, drug prescriptions, or emergency triage is intercepted. A standardized clinical disclaimer is returned, directing the patient to emergency facilities or an in-person consultation.
2. **Two-Step Confirmation Handshake**: Destructive actions (canceling appointments, rescheduling) require explicit confirmation before database execution.
3. **Multi-Lingual Intent Parsing**: Understands both English and Roman Urdu idioms commonly used in healthcare settings.
