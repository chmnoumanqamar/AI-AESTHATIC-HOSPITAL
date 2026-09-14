# Coding Standards & Conventions

## 1. TypeScript & Code Style Standards
- **Target & Module**: ES2022 / CommonJS for backend, ESNext / Bundler for Vite frontend.
- **Strict Typing**: Explicit types for parameters and return types across all services and API endpoints. `any` is minimized and restricted to dynamic JSON payloads.
- **Naming Conventions**:
  - **Files**: Kebab-case with descriptive role extensions (e.g., `doctor.service.ts`, `auth.controller.ts`, `command-center.tsx`).
  - **Classes & Components**: PascalCase (e.g., `AuthService`, `CommandDeckShell`, `DockedCopilotDrawer`).
  - **Functions & Variables**: camelCase (e.g., `allocateToken`, `sanitizeClinicalResponse`, `currentDoctorId`).
  - **Constants & Enums**: UPPER_SNAKE_CASE (e.g., `BRAND_TOKENS`, `ORIGINAL_HOSPITAL_MODULES`, `QueueStatus.WAITING`).

---

## 2. API Design & Validation
- **Request Validation**: Incoming request payloads must be validated using `zod` schemas defined in `<module>.dto.ts`.
- **Error Handling with `AppError`**:
  - Domain and validation failures must throw standard `AppError` instances:
    - `AppError.badRequest(message)` (400)
    - `AppError.unauthorized(message)` (401)
    - `AppError.forbidden(message)` (403)
    - `AppError.notFound(message)` (404)
    - `AppError.conflict(message)` (409)
  - Unhandled exceptions bubble up to `errorHandler` middleware in `src/common/errors/error-handler.ts`, which returns structured JSON responses:
    ```json
    {
      "success": false,
      "error": {
        "statusCode": 400,
        "message": "Descriptive error message"
      }
    }
    ```

---

## 3. Logging & Audit Standards
- **Application Logger**: Use `logger` from `src/common/utils/logger.ts`. Avoid raw `console.log` in production service code.
- **Audit Logging**:
  - Clinical, queue, and security mutations must generate an atomic audit record.
  - Required fields: `actorId`, `actorType`, `action`, `resourceType`, `resourceId`, `previousState`, `newState`, `timestamp`.
  - Sensitive patient data (such as passwords and unencrypted clinical private notes) must be redacted before persisting into `audit_logs`.

---

## 4. Frontend UI & Styling Invariants

### Strict 14px Font Ceiling
- In accordance with the project's clinical high-density design standards, **no text element may exceed 14px**.
- Headings (`h1`, `h2`, `h3`) utilize font-weight (`font-bold`, `font-semibold`), uppercase tracking, and color contrast rather than oversized font sizes.
- Tailwind classes should favor `text-xs` (12px) and `text-sm` (14px).

### Brand Colors & Dynamic Theming
- Primary surfaces and interactive elements utilize the dynamic palette system in `client/src/utils/themePalette.ts`.
- Standard brand tokens:
  - Surface Cyan: `#E0FBFC`
  - Soft Blue-Gray: `#C2DFE3`
  - Structural Slate: `#9DB4C0`
  - Muted Ink: `#5C6B73`
  - Dark Contrast Ink: `#253237`
- Theme changes dispatch a global window event `hospital_theme_color_changed` and persist into `localStorage.hospital_theme_color`.
- Dark mode toggle sets or removes the `dark` class on `document.documentElement` and emits `hospital_theme_changed`.

---

## 5. Git & Collaboration Rules
- **Active Working Branch**: All development work must be performed on the `hanzala` branch.
- **Push Policy**: **NEVER** execute `git push` without explicit confirmation and approval from the user.
- **Main Branch Protection**: Never push directly to `main`.
