## 🌐 Deployment Guide (Netlify + Render / Railway)

Because ReachInbox features a persistent **BullMQ worker process** and a **Redis connection**, the application is deployed in two complementary parts:
1. **Frontend (Next.js 14)**: Deployed to **Netlify** using Netlify's Next.js runtime plugin (`netlify.toml`).
2. **Backend (Express + BullMQ Worker + Redis)**: Deployed to a persistent Node.js host (such as **Render**, **Railway**, **Fly.io**, or **AWS EC2**) connected to a managed Redis instance (e.g. **Upstash Redis** or **Render Redis**).

---

### 🚀 Step 1: Deploying the Next.js Frontend to Netlify

1. **Push your repository** to GitHub / GitLab / Bitbucket.
2. Log in to [Netlify Dashboard](https://app.netlify.com/) and click **Add new site** ➔ **Import an existing project**.
3. Select your repository.
4. Netlify will automatically detect the `netlify.toml` file in the root directory:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`
5. **Configure Environment Variables** in Netlify (**Site settings ➔ Environment variables**):
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: `your_google_oauth_client_id.apps.googleusercontent.com`
6. Click **Deploy Site**. Netlify will build and host your Next.js frontend with SSL enabled.

---

### ⚙️ Step 2: Deploying Backend & BullMQ Worker (Render / Railway)

1. Create a managed **Redis** instance (e.g., free tier on [Upstash](https://upstash.com/) or [Render Redis](https://render.com/)).
2. Create a managed **PostgreSQL** database (e.g., [Neon.tech](https://neon.tech/) or Render Postgres).
3. Create a **Web Service** for `/backend` on Render/Railway:
   - **Build Command**: `cd backend && npm install && npx prisma db push && npm run build`
   - **Start Command**: `cd backend && npm run start`
4. Set Environment Variables:
   - `DATABASE_URL`: `postgresql://user:pass@host:5432/db`
   - `REDIS_HOST`: `your-redis-host.upstash.io`
   - `REDIS_PORT`: `6379`
   - `WORKER_CONCURRENCY`: `10`
   - `MAX_EMAILS_PER_HOUR`: `200`
   - `INTER_EMAIL_DELAY_MS`: `2000`
5. Once deployed, copy your backend URL (`https://your-backend-api.onrender.com`) and update the `to` field in `netlify.toml` or `NEXT_PUBLIC_API_URL` on Netlify.

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Database**: PostgreSQL or MySQL running locally (or SQLite for development)
- **Redis**: Running on `localhost:6379` (BullMQ persistent queue backend)

---

### 2. Environment Setup & Ethereal Email

#### Backend `.env` (`/backend/.env`)
```env
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000

# Relational Database (PostgreSQL / MySQL / SQLite)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public"

# Redis Connection for BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue Worker & Rate Limiter Configuration
WORKER_CONCURRENCY=10
PROCESSING_TIMEOUT_MS=120000
MAX_EMAILS_PER_HOUR=200
INTER_EMAIL_DELAY_MS=2000

# Ethereal Email (Auto-generated fallback or custom SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user@ethereal.email
SMTP_PASS=your_ethereal_password

# JWT Authentication Secret
JWT_SECRET=supersecret_reachinbox_jwt_token_key_2026
```

#### How to set up Ethereal Email
If no `SMTP_USER` / `SMTP_PASS` is specified in `.env`, the system automatically invokes `nodemailer.createTestAccount()` on boot, generates a real Ethereal test account automatically, and logs the credentials & Ethereal inbox URL to the terminal!

---

### 3. Backend Setup (Express, DB, Redis, BullMQ Worker)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Push Prisma database schema
npx prisma db push

# 4. Build TypeScript backend
npm run build

# 5. Start production server (starts Express API & BullMQ Worker concurrently)
npm run start
```
The backend API server and BullMQ worker will start on **`http://localhost:5000`**.

---

### 4. Frontend Setup (Next.js 14)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Build Next.js production web app
npm run build

# 4. Start Next.js web application
npm run start
```
The frontend web application will be available at **`http://localhost:3000`**.

---

## 🏗️ Architecture Overview

```
 ┌────────────────┐       HTTP / REST       ┌──────────────────────┐
 │  Next.js 14    │  ────────────────────►  │ Express API Backend  │
 │  Frontend UI   │                         └──────────┬───────────┘
 └────────────────┘                                    │
                                           Persist     │ Enqueue Job
                                           Job State   │ (No Cron)
                                                       ▼
 ┌────────────────┐      Pull Jobs (Conc: 10)  ┌──────────────────────┐
 │ Ethereal Email │  ◄───────────────────────  │  BullMQ Queue Engine │
 │ (Nodemailer)   │                            │   (Backed by Redis)  │
 └────────────────┘                            └──────────┬───────────┘
                                                          │ Atomic Rate Check
                                                          ▼
                                               ┌──────────────────────┐
                                               │  PostgreSQL / MySQL  │
                                               └──────────────────────┘
```

### 1. How Scheduling Works (No Cron)
- **No Cron Jobs**: Zero cron libraries (`node-cron`, `agenda`, `crontab`) are used.
- **BullMQ Delayed Queue**: When an email is scheduled, the backend creates an `EmailJob` record in PostgreSQL with status `SCHEDULED` and enqueues a **BullMQ delayed job** (`emailQueue.add('send-email', { emailJobId }, { delay, jobId })`).
- **Worker Execution**: BullMQ worker monitors the Redis delay set and triggers processing exactly when `scheduledAt` is reached.

### 2. Persistence Across Server Restarts
- **PostgreSQL / MySQL Authority**: Database acts as the primary ground truth.
- **Reconciliation Engine (`reconcileQueuedJobs()`)**: On backend startup, the engine queries PostgreSQL for all jobs with status `SCHEDULED` and ensures matching delayed jobs exist in BullMQ.
- **Stale Processing Recovery (`recoverStaleProcessingJobs()`)**: Automatically recovers jobs trapped in `PROCESSING` status if a server crashes mid-dispatch.
- **Idempotency**: Unique `jobId` parameters and atomic status checks (`SCHEDULED` ➔ `PROCESSING`) guarantee **no duplicate dispatches**.

### 3. Rate Limiting & Concurrency Implementation
- **Worker Concurrency**: Configurable via `WORKER_CONCURRENCY` env variable (default: `10`).
- **Inter-Email Delay**: Minimum delay between sends per sender (default: `2000` ms / 2 seconds), managed via Redis atomic sliding window timestamps (`reserveSendSlot()`).
- **Hourly Rate Limiting**: Tracked per sender using Redis atomic counters (`email-rate:{senderId}:{hourWindow}`).
- **Quota Exceeded Behavior**: Jobs exceeding the hourly limit (`MAX_EMAILS_PER_HOUR=200`) are **never dropped**. They are automatically postponed into the **next available 1-hour window** (`getNextHourWindowStart()`).

### 4. Behavior Under Load (1,000+ Emails)
- 1,000+ emails scheduled simultaneously are safely stored in PostgreSQL and added to BullMQ.
- Worker concurrency (`10`) and minimum delay (`2s`) throttle throughput.
- Hourly rate limit caps automatically spread remaining emails across subsequent hour windows seamlessly.

---

## 🗺️ Feature Mapping Matrix

### Backend Features

| Feature Component | Implementation File | Functionality Description |
| :--- | :--- | :--- |
| **Delayed Job Scheduler** | `src/services/queueService.ts` | BullMQ delayed queue engine (`no cron`) |
| **Server Persistence & Recovery** | `src/services/queueService.ts` | Startup PostgreSQL-to-BullMQ reconciliation & stale recovery |
| **Hourly Rate Limiting** | `src/services/rateLimiter.ts` | Redis atomic counter & next-hour window postponement |
| **Inter-Email Delay** | `src/services/rateLimiter.ts` | Sliding window send-slot reservation |
| **SMTP Transmission** | `src/services/emailService.ts` | Nodemailer dispatch via Ethereal Email with preview links |
| **Open Tracking & Unsubscribe** | `src/routes/trackingRoutes.ts` | 1x1 GIF tracking pixel & RFC List-Unsubscribe handler |
| **Spam Heuristic Checker** | `src/utils/spamChecker.ts` | Subject/body deliverability spam score calculator |

### Frontend Features

| Feature Component | Implementation File | Functionality Description |
| :--- | :--- | :--- |
| **Google OAuth Login** | `src/app/login/page.tsx` | Real Google OAuth authentication & session JWT storage |
| **Header User Profile** | `src/components/layout/Header.tsx` | Name, email, avatar image, and Sign Out dropdown |
| **Main Dashboard & Layout** | `src/components/layout/AppShell.tsx` | iOS glassmorphism UI layout with sidebar & header |
| **Scheduled Emails Inbox** | `src/app/dashboard/scheduled/page.tsx` | Scheduled jobs list with loading skeletons & empty state |
| **Sent Emails Inbox** | `src/app/dashboard/sent/page.tsx` | Sent jobs list with status tags, loading & empty states |
| **Compose Campaign Modal** | `src/components/compose/ComposeForm.tsx` | Email composer with CSV upload, schedule panel & live spam scanner |
| **CSV Lead Processor** | `src/components/compose/CsvUploader.tsx` | PapaParse parser with email validation & count detection |
| **Real-Time Spam Scanner Pill** | `src/components/compose/ComposeForm.tsx` | Deliverability risk indicator (`LOW`, `MEDIUM`, `HIGH`) |
| **Analytics Dashboard** | `src/app/dashboard/analytics/page.tsx` | Delivery status breakdown & volume throughput gauges |
| **Campaign Calendar** | `src/app/dashboard/calendar/page.tsx` | Monthly/weekly scheduling calendar view |
