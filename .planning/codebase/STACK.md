# Technology Stack

## 1. Overview & Runtime Environment
- **Runtime**: Node.js (v18+ / v20+ / v22+ compatible)
- **Language**: TypeScript 5.5.4 (Strict typing across backend and client)
- **Architecture Pattern**: Modular Monolith with separate Frontend (Vite/React) and Backend (Express/Node) connected via REST APIs and isolated multi-port proxies.
- **Operating System Compatibility**: Cross-platform (Windows PowerShell / POSIX Linux / macOS)

---

## 2. Backend Stack (`/src`)

### Core Framework & Server
- **Web Framework**: Express 4.21.0
- **TypeScript Execution (Dev)**: `ts-node` 10.9.2, `ts-node-dev` 2.0.0 (with `--respawn --transpile-only`)
- **Configuration & Environment**: `dotenv` 16.4.5, centralized typed config in `src/config/env.config.ts`

### Security & Authentication
- **Security Headers**: `helmet` 7.1.0 (with `contentSecurityPolicy: false` for internal client asset handling)
- **CORS**: `cors` 2.8.5 with regex matcher supporting localhost across any isolated terminal port (`3000-3005`)
- **Authentication**: JWT (`jsonwebtoken` 9.0.2) via Bearer token header
- **Password Hashing**: `bcryptjs` 2.4.3 (salted hashing with backward-compatible migration fallback for demo profiles)

### Validation & Utilities
- **Schema Validation**: `zod` 3.23.8 for request body and query parameter validation
- **Identifiers**: `uuid` 10.0.0 (v4 RFC-compliant UUID generation)
- **Logging**: Custom structured ANSI logger (`src/common/utils/logger.ts`) with log level filtering (`debug`, `info`, `warn`, `error`)

### Data Layer & Storage
- **Relational ORM Schema**: `prisma` 5.19.1 & `@prisma/client` 5.19.1 (targeting PostgreSQL 14+)
- **Active Runtime Database**: Hybrid in-memory clinical database engine (`src/common/data/mock-db.ts`) with synchronous JSON atomic disk persistence (`src/common/data/hospital_persistent_store.json`)
- **Database Migrations**: Initial PostgreSQL DDL in `prisma/migrations/20260904_init/`

---

## 3. Frontend Stack (`/client`)

### Core Libraries & Bundler
- **Library**: React 18.3.1 & React-DOM 18.3.1
- **Build Tool / Dev Server**: Vite 5.4.3 (`@vitejs/plugin-react` 4.3.1)
- **HTTP Client**: Axios 1.7.7 with centralized interceptors, automatic JWT injection, and port-aware base URL resolution

### Styling & Design System
- **CSS Framework**: TailwindCSS 3.4.10 with `postcss` 8.4.45 and `autoprefixer` 10.4.20
- **Utility Helpers**: `clsx` 2.1.1, `tailwind-merge` 2.5.2
- **Icons**: `lucide-react` 0.439.0 (modern SVG clinical and operational iconography)
- **Design Tokens**: Custom HSL and hex clinical brand tokens (`#E0FBFC`, `#C2DFE3`, `#9DB4C0`, `#5C6B73`, `#253237`)
- **Typography Ceiling**: Strict project-wide 14px font size ceiling (`max-text-[14px]`) configured across all components
- **Dynamic Theming**: Color Palette Studio with 6 curated medical palettes, live custom color picker, and dark/light mode toggle

### Multi-Terminal Dev Infrastructure
- **Proxy Server**: `http-proxy` 1.18.1 in `client/multi-port-server.js` exposing dedicated localhost ports `3001` (Doctor), `3002` (Receptionist), `3003` (Patient), `3004` (Admin), and `3005` (Pharmacist) with full HTTP and WebSocket hot-reloading proxying to Vite on `3000`.

---

## 4. Testing & Tooling
- **Test Runner**: Direct `ts-node` test runner executing comprehensive domain tests (`test/system.test.ts`)
- **Process Orchestration**: `concurrently` 10.0.5 running `npm run dev:all` (Backend on 4000, Vite client on 3000, Multi-port proxy on 3001-3005)
- **Containerization**: Docker Compose (`docker-compose.yml`) defining PostgreSQL 15 alpine container service
