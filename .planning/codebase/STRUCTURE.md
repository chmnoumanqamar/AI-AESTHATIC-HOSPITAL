# Codebase Structure

## 1. Directory Tree Overview

```
AI-AESTHATIC-HOSPITAL/
├── .planning/                  # Project roadmap, codebase maps, and phase planning
│   └── codebase/              # Codebase intelligence & architectural documentation
├── client/                     # Frontend Application (React 18 + Vite + Tailwind)
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── components/         # Reusable UI component modules
│   │   │   ├── ai-copilot/     # Docked AI Copilot drawer and chat widgets
│   │   │   ├── clinical/       # Clinical consultation views, prescription diffing
│   │   │   ├── common/         # Buttons, Badges, Modals, Spinners, Tooltips
│   │   │   ├── layout/         # CommandDeckShell, StructuralRailNav, HeaderBar
│   │   │   ├── queue/          # Live queue boards and token call displays
│   │   │   ├── receptionist/   # Quick booking modals, check-in dialogs
│   │   │   ├── reports/        # BI Analytics, Revenue and Patient flow charts
│   │   │   └── token/          # Token cards, matrix slot pickers
│   │   ├── hooks/              # Custom React hooks (auth, theme, interval polling)
│   │   ├── pages/              # Role-specific workspaces and terminal views
│   │   │   ├── admin/          # Audit vault, Config, User access, Studio, DB Maintenance
│   │   │   ├── auth/           # Login screen with direct role presets
│   │   │   ├── doctor/         # Doctor command dashboard and consultation room
│   │   │   ├── patient/        # Patient self-service booking and history portal
│   │   │   ├── pharmacist/     # Pharmacy dispense workspace and stock inventory
│   │   │   └── receptionist/   # Front desk command center and POS
│   │   ├── services/           # Axios HTTP client instance & API client functions
│   │   ├── styles/             # Global CSS, Tailwind base directives, typography ceiling
│   │   ├── utils/              # Theme palette definitions, date formatting, helpers
│   │   ├── App.tsx             # Root application orchestrator and terminal resolver
│   │   └── main.tsx            # Vite DOM entry point
│   ├── multi-port-server.js    # Local multi-port proxy server (ports 3001-3005)
│   ├── index.html              # HTML shell
│   ├── package.json            # Client dependencies and scripts
│   ├── tailwind.config.js      # Tailwind design system & 14px font ceiling config
│   ├── tsconfig.json           # Client TypeScript configuration
│   └── vite.config.ts          # Vite build configuration
│
├── prisma/                     # Database schemas & migrations
│   ├── migrations/             # Historical PostgreSQL migration DDL scripts
│   ├── schema.prisma           # Prisma schema definition
│   └── seed.ts                 # Database seed data script
│
├── src/                        # Backend Application (Node.js + Express + TypeScript)
│   ├── common/                 # Shared cross-cutting concerns
│   │   ├── data/               # Persistent JSON storage & in-memory DB engine
│   │   ├── errors/             # AppError class and centralized error handler
│   │   ├── middleware/         # Auth, RBAC, and Audit trail middlewares
│   │   └── utils/              # ANSI logger, date manipulation helpers
│   ├── config/                 # Central configuration
│   │   ├── colors.config.ts    # Brand tokens and theme constants
│   │   ├── env.config.ts       # Typed environment variables
│   │   └── unresolved-policies.config.ts # Medical policy configuration
│   ├── modules/                # Domain-driven feature modules
│   │   ├── admin/              # User management, audit trail inspection, system stats
│   │   ├── ai-agent/           # AI orchestrator, tools registry, WhatsApp webhook
│   │   ├── appointment/        # Booking, cancellation, 48h reminder engine
│   │   ├── audit/              # Immutable audit trail queries
│   │   ├── auth/               # Authentication, login, password hashing, JWT
│   │   ├── billing/            # Invoices, fee structures, receipts
│   │   ├── clinical/           # Clinical records & Git-style prescription versioning
│   │   ├── doctor/             # Doctor profiles, schedules, specialties
│   │   ├── notification/       # SMS & WhatsApp dispatch channels
│   │   ├── patient/            # Patient demographics and medical histories
│   │   ├── pharmacy/           # Medicine stock inventory & dispensary queues
│   │   ├── queue/              # Token queue engine, check-in, call-next logic
│   │   ├── reports/            # Operational & financial reporting
│   │   ├── service/            # Hospital services catalog
│   │   └── token/              # Mathematical token generator and matrix
│   └── index.ts                # Express server entry point & route mounting
│
├── test/                       # Test suites
│   └── system.test.ts          # System integration and invariant test suite (51 tests)
│
├── .env.example                # Example environment variable specifications
├── AGENTS.md                   # Agent guidelines & Git safety rules
├── docker-compose.yml          # PostgreSQL container definitions
├── HANZALA.md                  # Feature and branch documentation
├── HANZALA_CHANGES.md          # Technical changelog of branch modifications
├── package.json                # Backend dependencies and root scripts
├── README.md                   # Project documentation and architectural overview
└── tsconfig.json               # Backend TypeScript configuration
```

---

## 2. Module Pattern & Internal Organization
Each domain module in `src/modules/<name>/` strictly follows a consistent pattern:
- `<name>.routes.ts`: Express router definitions, route paths, and middleware attachments.
- `<name>.controller.ts`: HTTP request handling, DTO parsing, response formatting.
- `<name>.service.ts`: Core business logic, domain invariants, data mutations.
- `<name>.dto.ts`: Zod schema validation and TypeScript interface types.

---

## 3. Frontend Architecture & Page Organization
- **Layout Shell (`CommandDeckShell.tsx`)**: Renders the persistent 3-column frame containing the navigation rail, the operational headerbar, the workspace canvas, and the docked AI assistant.
- **Role Portals (`pages/`)**: Distinct sub-folders for each user persona:
  - `doctor/`: Consultation and patient queue workflows.
  - `receptionist/`: Front-desk check-in, appointment confirmation, token issuance.
  - `patient/`: Self-service booking and prescription viewing.
  - `admin/`: Audit logs, user administration, system config, database maintenance.
  - `pharmacist/`: Real-time prescription fulfillment and medicine inventory management.
