# Testing Strategy & Verification Suite

## 1. Overview & Test Runner
The application relies on an end-to-end integration and architectural test suite located at `test/system.test.ts`.
- **Test Runner**: Direct Node/TypeScript execution via `ts-node`.
- **Command**:
  ```bash
  npm test
  ```
- **Execution Speed**: High-speed in-memory execution (~2.5 seconds total runtime).
- **Test Results**: **51 PASSED | 0 FAILED** (100% pass rate across all invariants).

---

## 2. Test Suite Architecture (`test/system.test.ts`)
The test suite validates architectural invariants rather than shallow unit logic. It spans 10 comprehensive test groups:

### Group 1: Mathematical Token Engine & Non-Reusability
- Validates that sequential token allocation strictly follows $T_{\text{max}} + 1$.
- Confirms the **Non-Reusability Rule**: A cancelled token slot is permanently locked and never reassigned to another patient.
- Asserts that capacity limits prevent issuing tokens beyond the doctor's daily patient quota.

### Group 2: Queue Engine & "Call Next Patient" Skip Logic
- Verifies that patients with un-confirmed appointments or `NOT_CHECKED_IN` queue status are safely skipped.
- Validates that "Call Next Patient" selects the earliest waiting checked-in patient ordered strictly by `token_number ASC`.

### Group 3: Git-Style Prescription Versioning & Clinical Diffing
- Asserts that updating an existing prescription never mutates the original record.
- Confirms the generation of a new linked version record ($v_2$) containing doctor notes, mandatory `correctionReason`, and updated medications.
- Asserts that doctor queries retrieve the full version tree for side-by-side diffing, while patient queries receive only the verified record with `is_current = true`.

### Group 4: API-Level Privacy Walls & RBAC Boundaries
- Asserts that `privateNotes` written by doctors are systematically redacted from patient and receptionist responses.
- Verifies that role middleware forbids unauthorized role transitions and rejects access to admin routes.

### Group 5: Notification Gateway & 48h Reminder Engine
- Verifies the scheduled appointment reminder scanner which detects appointments within 48 hours and dispatches automated alerts.
- Validates multi-channel fallback between WhatsApp and SMS gateways with payload logging.

### Group 6: Medical Safety Interceptor & AI Guardrails
- Tests that queries prompting for diagnosis or medication (in both English and Roman Urdu, e.g., *"Mujhe bukhar hai dawa batao"*) are intercepted by the Medical Safety Guard.
- Verifies delivery of clinical triage disclaimers and emergency consultation recommendations.

### Group 7: Multi-Lingual Natural Language Parsing
- Validates conversational comprehension of Pakistani healthcare idioms in Roman Urdu (e.g., appointment status queries, pharmacy hours, token requests).
- Tests RAG guardrails to ensure stopword matching prevents false-positive tool calls.

### Group 8: Pharmacy Real-Time Medicine Lookup & Inventory Pricing
- Verifies real-time medicine inventory stock checking and unit pricing retrieval (in PKR) via AI tools and API endpoints.
- Verifies live dispensary queue reporting for pharmacist staff.

### Group 9: Admin Security, Audit Vault & User Access Management
- Verifies unique `@username` registration, duplicate username collision handling (409 Conflict), and illegal character sanitization.
- Validates atomic logging of user provisioning events in the Audit Vault.

### Group 10: Production Handover Standards - Clean Department Zero-State Invariant
- Validates that newly provisioned staff members (Doctor, Receptionist, Pharmacist) start with pristine, empty departments (0 queue items, 0 pending bookings).
- Ensures that existing demo accounts retain sample datasets for sales/training presentations without polluting newly created live staff departments.

---

## 3. Adding New Tests
When extending features:
1. Add new assertion groups in `test/system.test.ts`.
2. Follow the established assertion pattern:
   ```typescript
   assert(condition, 'Descriptive Test Name', 'Failure explanation');
   ```
3. Run `npm test` to ensure all 51 baseline tests plus new tests pass without error.
