# Code Conventions & Design Guidelines

## 1. Naming & File Structure Conventions

### Backend (`/src`)
- **Modules**: Located in `src/modules/<domain>/` following a strict separation of concerns:
  - `<domain>.routes.ts`: Express router definitions, route paths, middleware attachment.
  - `<domain>.controller.ts`: Request parsing, query/body validation, status code mapping.
  - `<domain>.service.ts`: Core business logic, invariants enforcement, database/mock-db interaction.
- **Tools & Guards**: Placed in subdirectories with explicit suffixes:
  - `src/modules/ai-agent/tools/<action>.tool.ts`
  - `src/modules/ai-agent/safety/<aspect>.guard.ts`
- **File Naming**: Strictly `kebab-case.ts` (e.g., `prescription-version.service.ts`, `medical-safety.guard.ts`).

### Frontend (`/client/src`)
- **Components**: Strictly `PascalCase.tsx` (e.g., `CommandDeckShell.tsx`, `PrescriptionDiffViewer.tsx`, `FrontDeskBillingPOS.tsx`).
- **Hooks**: Strictly `camelCase.ts` prefixed with `use` (e.g., `useAICopilot.ts`, `useQueueStream.ts`).
- **Utilities & Services**: `camelCase.ts` (e.g., `api.ts`, `themePalette.ts`).
- **Pages**: Grouped in subdirectories under `pages/<role>/` (e.g., `pages/doctor/dashboard.tsx`, `pages/admin/user-access.tsx`).

---

## 2. TypeScript Guidelines

- **Strict Type Checking**: Strict mode is enabled in both root and client `tsconfig.json`.
- **Entity Interfaces**: Prefixed with `Db` in `mock-db.ts` to denote database-level schemas (e.g., `DbUser`, `DbPatient`, `DbDailyToken`, `DbPrescriptionVersion`).
- **Input Validation**: Use Zod schemas for environment configuration (`src/config/env.config.ts`) and API payloads where appropriate.
- **Any Avoidance**: Avoid unrestricted `any` in core service layers; domain payloads and request contexts should declare explicit parameter types.

---

## 3. Error Handling & Operational Invariants

### Custom Error Hierarchy (`src/common/errors/`)
- All operational errors must throw instances of `AppError`:
  ```typescript
  throw new AppError(
    'Cannot allocate token: Daily limit reached for this physician',
    400,
    'TOKEN_CAPACITY_EXCEEDED'
  );
  ```
- Handled globally by `src/common/errors/error-handler.ts`:
  - Operational errors (`isOperational === true`) return clean JSON with status codes (`400`, `401`, `403`, `404`, `409`).
  - Unhandled exceptions return `500 Internal Server Error` with details logged server-side.

### Invariant Checks
- Invariants must be asserted prior to mutating data structures:
  - Token non-reusability and capacity ($A < L$) checked before token reservation.
  - Appointment confirmation checked before patient can be called in queue.
  - Mandatory `correctionReason` checked before prescription version creation.

---

## 4. Audit Logging & State Tracking

Every state-mutating operation (creation, status transition, cancellation, editing) must record an immutable audit entry:
```typescript
await recordAuditLog({
  actorId: user.id,
  actorType: user.role,
  action: 'PRESCRIPTION_VERSION_CREATED',
  resourceType: 'PRESCRIPTION',
  resourceId: prescription.id,
  previousState: oldVersion,
  newState: newVersion,
  metadata: { correctionReason }
});
```

---

## 5. UI Design System & Styling Conventions

### 1. Strict 14px Font Ceiling Rule
To ensure maximum clinical data density and avoid oversized text in dense dashboards:
- All Tailwind font scale utilities above `base` (`text-lg`, `text-xl`, ..., `text-9xl`) are deliberately clamped to `14px` (`lineHeight: 20px`) in `client/tailwind.config.js`.
- Font size hierarchy:
  - `text-xs`: 11px (line-height: 15px) — metadata, timestamps, badge labels.
  - `text-sm`: 12px (line-height: 16px) — secondary copy, table contents.
  - `text-base`: 13px (line-height: 18px) — primary body text, form inputs.
  - `text-lg` through `text-9xl`: 14px (line-height: 20px) — modal titles, card headers, metric numbers.

### 2. Tailored Earth / Olive Palette
The UI adheres to a curated 10-swatch earth/olive palette:
- `palette-1`: `#582F0E` (Deep Espresso Bronze / Emergency)
- `palette-2`: `#7F4F24` (Warm Walnut)
- `palette-3`: `#936639` (Caramel Amber / Warning)
- `palette-4`: `#A68A64` (Warm Sand)
- `palette-5`: `#B6AD90` (Muted Khaki)
- `palette-6`: `#C2C5AA` (Light Herbal Celadon / Borders)
- `palette-7`: `#A4AC86` (Muted Sage / Info)
- `palette-8`: `#656D4A` (Moss Olive / Success / Default Brand Primary)
- `palette-9`: `#414833` (Deep Olive Slate / Text)
- `palette-10`: `#333D29` (Deep Forest Charcoal)

### 3. Dynamic Color Studio & Theme Persistence
- Color preferences are managed via `client/src/utils/themePalette.ts`.
- Changes inject CSS custom variables (`--color-brand-50` through `--color-brand-900`).
- Settings persist in `localStorage` (`hospital_theme_color`, `hospital_custom_palette`).
- Dark mode toggle applies `.dark` class to document root.

### 4. Status Badges & Color Indicators
- Token States:
  - `AVAILABLE`: Neutral slate (`#C2C5AA`)
  - `RESERVED`: Warm amber (`#936639`)
  - `ACTIVE`: Moss olive (`#656D4A`)
  - `CANCELLED`: Strikethrough espresso (`#582F0E`)
- Queue States:
  - `WAITING`: Amber badge
  - `CALLED`: Pulsing cyan/blue badge
  - `IN_CONSULTATION`: Emerald/olive active badge
  - `COMPLETED`: Muted gray/green badge
  - `NO_SHOW`: Warning bronze badge
