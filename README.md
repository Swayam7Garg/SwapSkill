# ExchangeSkill — Peer-to-Peer Skill Exchange for Students

ExchangeSkill is a secure, real-time, peer-to-peer skill exchange platform designed for college students to swap their knowledge (coding, design, music, language, sports, academics, etc.) with zero cost. 

Match compatibility is computed using a mutual overlap matchmaking algorithm: matching your learning goals with peer teaching skills.

---

## 🛠️ Tech Stack & Monorepo Structure

This project is set up as a **Turborepo** monorepo:

-   **Frontend (`apps/web`)**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, and Socket.io Client.
-   **Backend (`apps/api`)**: Express.js + Node.js (REST API, `/api/v1` route prefix), Socket.io Server, and `node-cron` reminders.
-   **Database**: Supabase PostgreSQL via Prisma ORM.
-   **Auth**: Clerk JWT-based authentication with a pass-through mock sandbox for local development.
-   **Cache/Queue**: Upstash Redis (rate limiting/queues) with a pass-through MemoryCache fallback.

---

## 📂 Project Architecture

```
├── apps/
│   ├── web/                     # Next.js 14 App Client
│   │   ├── app/                 # Pages: dashboard, browse, requests, sessions, profile, leaderboard
│   │   ├── components/          # Widgets: SkillChip, UserCard, SessionCard, ScheduleModal, RatingModal
│   │   ├── lib/                 # apiFetch helper, tailwind mergers
│   │   └── middleware.ts        # Clerk page-guards + mock developer sandbox bypass
│   └── api/                     # Express API Server
│       ├── prisma/              # Schema and DB Seeding scripts
│       └── src/
│           ├── config/          # Prisma & Redis (with memory cache fallback) instances
│           ├── controllers/     # route controllers: user, request, session, rating, skills, dashboard
│           ├── middlewares/     # Clerk JWT requireAuth + mock sandbox auth injector
│           ├── routes/          # Express route bindings
│           ├── utils/           # Socket.io notification dispatch helpers
│           └── index.ts         # Server entry point + node-cron 15-minute reminders
├── docker-compose.yml           # Local PostgreSQL container launcher
└── package.json                 # Monorepo workspace configuration
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisite: Node.js & NPM
Ensure you have Node.js (>= 18) and npm installed.

### 2. Start PostgreSQL Database
If you do not have a PostgreSQL database running, you can launch one locally using the included Docker Compose file:
```bash
docker compose up -d
```
This spins up a Postgres container listening on `localhost:5432` with user `postgres` and password `postgres`.

### 3. Generate Prisma Client & Migrate Schema
Navigate to the root directory and compile your Prisma database schemas:

First, generate the Client models:
```bash
npm run db:generate --workspace=api
```

Second, run database migrations to create tables on your PostgreSQL database:
```bash
npm run db:migrate --workspace=api
```
*(When prompted, enter a migration name, e.g., `init`)*

### 4. Seed the Database with Demo Data
To populate the database with the pre-defined 50 skills, 8 sample students with teach/learn combos, completed sessions, ratings, and active swap requests, execute the seed script:
```bash
npm run db:seed --workspace=api
```

### 5. Launch the Monorepo Development Servers
To start the Next.js frontend (on `http://localhost:3000`) and the Express API server (on `http://localhost:5000`) concurrently, run:
```bash
npm run dev
```

---

## 🔐 Authentication Modes

ExchangeSkill supports two authentication pipelines:

### Mode A: Developer Sandbox (Default)
If you leave Clerk credentials blank or as `pk_test_placeholder` in `.env` configurations:
-   **Frontend Auth Bypass**: The frontend bypasses the Clerk log-in page.
-   **Sandbox Switcher**: A dropdown select menu appears in the header. You can click to change profiles, instantly reloading the page as any of the 8 seeded demo users.
-   **Mock Header**: Requests are signed with an `x-mock-user-id` header matching the selected student. The API backend automatically authenticates you as that user.
-   **Use Case**: Makes testing the request loop (sending an invite from Carlos to Alex, switching profiles to Alex, and accepting it) incredibly fast and interactive.

### Mode B: Clerk Production Auth
To activate Clerk sign-ins:
1.  Enter your Clerk credentials (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`) inside `apps/web/.env.local` and `apps/api/.env`.
2.  Restart the development servers.
3.  Next.js middleware will automatically redirect you to Clerk's sign-in/sign-up forms. On first login, your account is synchronized to the Postgres DB.
