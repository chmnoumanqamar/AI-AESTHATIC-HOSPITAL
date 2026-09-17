# Technology Stack

## Overview
The Hospital Management & AI Agent System is a full-stack, domain-driven TypeScript application comprising a modular Express backend, a PostgreSQL relational data blueprint with an active in-memory/JSON-persisted simulation engine, a high-density React 18 frontend built with Vite and Tailwind CSS, and a Google Gemini-driven clinical AI copilot runtime.

---

## 1. Runtime & Language Environment

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Runtime** | Node.js | `>=18.0.0` (Recommended 20+ / 22+) | CommonJS/ESM hybrid environment |
| **Language** | TypeScript | `^5.5.4` (Server & Client) | Strict typing across backend modules and React client |
| **Package Manager** | npm | `>=9.0.0` | Standard npm workspaces / dual `package.json` |

---

## 2. Backend Stack (`/src`)

### Core Framework & Networking
- **Express (`^4.21.0`)**: HTTP API router, middleware pipeline, static bundle serving.
- **Cors (`^2.8.5`)**: Cross-Origin Resource Sharing configured for multi-port terminal development (`localhost:*`).
- **Helmet (`^7.1.0`)**: HTTP security headers (with relaxed CSP for clinical dashboard assets).
- **Dotenv (`^16.4.5`)**: Environment variable loader.
- **Zod (`^3.23.8`)**: Runtime environment schema validation (`src/config/env.config.ts`).

### Authentication & Cryptography
- **jsonwebtoken (`^9.0.2`)**: JWT token generation and verification with 7-day expiration.
- **bcryptjs (`^2.4.3`)**: Password hashing and verification.
- **uuid (`^10.0.0`)**: Cryptographic UUID v4 generation for entities and audit tracking.

### Data Layer & Storage
- **Prisma ORM (`^5.19.1`)**: Relational PostgreSQL schema definitions, migrations (`prisma/migrations`), and client generator.
- **JSON File Persistence Engine**: `src/common/data/mock-db.ts` serializing to `src/common/data/hospital_persistent_store.json` (170KB+ dataset) for zero-setup local execution and rapid demo state persistence.
- **PostgreSQL (`postgres:16-alpine`)**: Target production database configured via Docker Compose.

### AI Engine & Agent Tools
- **Google Gemini API**: Configured for `gemini-3.8-flash` (with fallback mock runtime).
- **Custom RAG Engine**: In-memory vector store (`src/modules/ai-agent/rag/vector-store.ts`) and retriever service.
- **Tool Registry**: 12+ clinical action tools (doctor lookup, token booking, cancellation, rescheduling, patient history, pharmacy lookup, billing, lab tracker, package tracker, reports).

### Development & Process Tooling
- **ts-node-dev (`^2.0.0`)**: Hot-reloading development server with transpile-only mode.
- **ts-node (`^10.9.2`)**: CLI execution for database seeding and test suites.
- **concurrently (`^10.0.5`)**: Multi-process coordinator for running backend, client, and multi-port proxy concurrently.

---

## 3. Frontend Stack (`/client`)

### Framework & Build
- **React (`^18.3.1`)**: Functional component architecture with hooks.
- **React DOM (`^18.3.1`)**: Client-side DOM rendering.
- **Vite (`^5.4.3`)**: Lightning-fast ES module bundler and dev server.
- **@vitejs/plugin-react (`^4.3.1`)**: React fast-refresh plugin for Vite.

### Styling & Design System
- **Tailwind CSS (`^3.4.10`)**: Utility-first CSS framework customized with:
  - Custom 10-swatch earth/olive palette (`#582F0E` to `#333D29`).
  - Strict 14px maximum typography ceiling across all headings, badges, and body text.
  - Class-based Dark Mode support (`darkMode: 'class'`).
- **PostCSS (`^8.4.45`) & Autoprefixer (`^10.4.20`)**: CSS post-processing pipeline.
- **clsx (`^2.1.1`) & tailwind-merge (`^2.5.2`)**: Conditional class composition utilities.

### UI Icons & Components
- **lucide-react (`^0.439.0`)**: Comprehensive icon set for medical, terminal, navigation, and status indicators.

### Networking & Proxy
- **Axios (`^1.7.7`)**: HTTP client with request interceptors for JWT bearer tokens and response error handling.
- **http-proxy (`^1.18.1`)**: Embedded reverse proxy server powering the multi-port terminal suite (`client/multi-port-server.js`).

---

## 4. Multi-Port Architecture & Port Map

| Port | Target / Role | Dedicated URL / Path | Default User Credential |
|---|---|---|---|
| **4000** | Express API & Backend | `http://localhost:4000/api` | System Backend Service |
| **3000** | Vite Dev Server (Base) | `http://localhost:3000` | Universal Entry / Login |
| **3001** | Doctor Command Deck | `http://localhost:3001` or `/doctor` | `dr.aisha@hospital.com` |
| **3002** | Receptionist Terminal | `http://localhost:3002` or `/receptionist` | `receptionist@hospital.com` |
| **3003** | Patient Portal | `http://localhost:3003` or `/patient` | `john.doe@example.com` |
| **3004** | Admin Audit & Ops Vault | `http://localhost:3004` or `/admin` | `admin@hospital.com` |
| **3005** | Pharmacist Workspace | `http://localhost:3005` or `/pharmacist` | `pharmacy@hospital.com` |

---

## 5. Infrastructure & Containerization

- **Docker (`docker-compose.yml`)**:
  - `postgres`: PostgreSQL 16 Alpine container with healthchecks and auto-migrating init volume.
  - `backend`: Node.js container for Express API (`Dockerfile.backend`).
  - `client`: Vite/Nginx container for client delivery (`client/Dockerfile.client`).

---

## 6. Key Configuration Files

| Path | Purpose |
|---|---|
| `package.json` | Root backend dependencies, build scripts, test scripts, Prisma commands |
| `client/package.json` | Frontend dependencies, Vite build scripts, multi-port server script |
| `tsconfig.json` | Backend TypeScript configuration (`NodeNext`/`ES2022`, strict type-checking) |
| `client/tsconfig.json` | Frontend TypeScript configuration (`DOM`, `ESNext`, JSX transform) |
| `src/config/env.config.ts` | Zod schema validation for environment variables |
| `src/config/colors.config.ts` | Brand token definitions (`#E0FBFC`, `#C2DFE3`, `#9DB4C0`, `#5C6B73`, `#253237`) |
| `src/config/unresolved-policies.config.ts` | 21 configurable clinical, queue, token, and safety policies |
| `client/tailwind.config.js` | Custom 10-swatch palette and 14px maximum typography rule |
| `client/vite.config.ts` | Vite dev server setup, strict port 3000, API proxy to port 4000 |
