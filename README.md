# ExchangeSkill — Peer-to-Peer Skill Exchange for College Students

ExchangeSkill is a secure, real-time, peer-to-peer skill exchange platform designed for college students to swap their knowledge (coding, design, music, language, sports, academics, etc.) with zero monetary cost.

* **Live URL:** [https://swap-skill-web-dvdz.vercel.app/](https://swap-skill-web-dvdz.vercel.app/)
* **Team Members:** Swayam Garg, Ajay Kumar Sahani, Yash Suroshe

---

## 💡 Problem Statement Reference
College students often face tight budgets, making it expensive to pay for private tutoring, software development bootcamps, language lessons, or musical coaching. However, these same students possess valuable skills that their peers want to learn. 

**ExchangeSkill** solves this by establishing a zero-cost barter economy for knowledge. By linking students together through bidirectional skill-matching, real-time communications, and AI-powered study guides, it transforms campuses into collaborative learning ecosystems.

---

## 🛠️ Tech Stack

This project is set up as a **Turborepo** monorepo containing:

* **Frontend (`apps/web`)**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons, and Socket.io Client.
* **Backend (`apps/api`)**: Express.js, Node.js, Socket.io Server, and `node-cron` schedules.
* **Database**: MongoDB Atlas / Local MongoDB (via Mongoose ODM).
* **Generative AI**: Google Gemini 2.5 Flash API (used for structured JSON compatibility matchmaking and custom lesson plan markdown generation).
* **Auth**: Clerk Auth (Production Mode) with a pass-through mock sandbox for local development.

---

## 📂 Project Architecture

```
├── apps/
│   ├── web/                     # Next.js App Client
│   │   ├── app/                 # Pages: dashboard, browse, requests, sessions, profile, leaderboard
│   │   ├── components/          # Widgets: SkillChip, UserCard, SessionCard, ScheduleModal, RatingModal
│   │   ├── lib/                 # apiFetch helper, socket client instances
│   │   └── middleware.ts        # Clerk page-guards + mock developer sandbox bypass
│   └── api/                     # Express API Server
│       ├── prisma/              # DB Seeding scripts (runs Mongoose connection)
│       └── src/
│           ├── config/          # MongoDB Connection and Gemini configuration
│           ├── controllers/     # route controllers: user, request, session, rating, skills, dashboard
│           ├── middlewares/     # Clerk JWT requireAuth + mock sandbox auth injector
│           ├── routes/          # Express route bindings
│           ├── utils/           # Socket.io notification dispatch helpers & Gemini matchmaking engine
│           └── index.ts         # Server entry point + node-cron 15-minute reminders
├── docker-compose.yml           # Local MongoDB container launcher (optional)
└── package.json                 # Monorepo workspace configuration
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisite: Node.js & NPM
Ensure you have Node.js (>= 18) and npm installed.

### 2. Configure Environment Variables
Create an `.env` file in `apps/api/.env` and `.env.local` in `apps/web/.env.local` using the keys in their example files:

* **`apps/api/.env`**:
  ```env
  PORT=5000
  MONGODB_URI="your-mongodb-atlas-uri"
  GEMINI_API_KEY="your-google-gemini-api-key"
  ```

### 3. Start MongoDB
If you do not have MongoDB running locally, you can start one via Docker:
```bash
docker compose up -d
```

### 4. Seed the Database with Demo Data
To populate the database with 50 categories of skills, 8 sample students with teach/learn preferences, completed study sessions, ratings, and pending requests:
```bash
npm run db:seed --workspace=api
```

### 5. Launch the Development Servers
To start the Next.js frontend (on `http://localhost:3000`) and the Express API server (on `http://localhost:5000`) concurrently, run:
```bash
npm run dev
```

---

## 🔐 Authentication Modes

ExchangeSkill supports two authentication modes:

### Mode A: Developer Sandbox (Default / No Config required)
If you leave Clerk credentials blank:
* **Frontend Auth Bypass**: The frontend bypasses the Clerk login page.
* **Sandbox Switcher**: A dropdown select menu appears in the header. You can click to change profiles, instantly reloading the page as any of the 8 seeded demo users.
* **Mock Header**: Requests are signed with an `x-mock-user-id` header matching the selected student. The API backend automatically authenticates you as that user.
* **Use Case**: Makes testing the request loop (sending an invite from Carlos to Alex, switching profiles to Alex, and accepting it) fast and easy.

### Mode B: Clerk Production Auth
To activate Clerk sign-ins:
1. Enter your Clerk credentials (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`) inside `apps/web/.env.local` and `apps/api/.env`.
2. Restart the development servers.
3. Next.js middleware will automatically redirect you to Clerk's sign-in/sign-up forms. On first login, your account is synchronized to the MongoDB database.
