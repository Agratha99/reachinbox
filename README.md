# 🚀 ReachInbox Enterprise - Autonomous High-Concurrency Email Scheduler

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Queue-red?style=for-the-badge)](https://docs.bullmq.io/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

ReachInbox Enterprise is a production-grade, crash-proof email cold outreach and campaign scheduling platform. Designed to handle **1,000+ concurrent email dispatches** seamlessly without server crashes, rate-limit bans, or lost jobs.

---

## 📑 Table of Contents
1. [⚡ Quick Start Guide](#-quick-start-guide)
   - [Running the Backend](#1-running-the-backend-express-redis-db-bullmq-worker)
   - [Running the Frontend](#2-running-the-frontend-nextjs-14)
   - [1-Click Double-Click Launcher (Windows)](#3-1-click-double-click-launcher-windows)
2. [✉️ Ethereal Email & Environment Configuration](#%EF%B8%8F-ethereal-email--environment-configuration)
3. [🏗️ Architecture Overview](#%EF%B8%8F-architecture-overview)
   - [How Scheduling Works (No Cron)](#1-how-scheduling-works-no-cron)
   - [Persistence Across Server Restarts](#2-persistence-across-server-restarts)
   - [Rate Limiting & Concurrency Engine](#3-rate-limiting--concurrency-engine)
   - [Behavior Under High Concurrency (1,000+ Emails)](#4-behavior-under-high-concurrency-1000-emails)
4. [🗺️ Complete Features Implemented Matrix](#%EF%B8%8F-complete-features-implemented-matrix)
5. [📊 BullMQ Queue Admin Dashboard](#-bullmq-queue-admin-dashboard)
6. [🌐 Permanent Cloud Deployment (Render / Vercel)](#-permanent-cloud-deployment-render--vercel)

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Database**: PostgreSQL (or SQLite/MySQL for local testing)
- **Redis**: Running on `localhost:6379` (Required for BullMQ queues)

---

### 1. Running the Backend (Express, Redis, DB, BullMQ Worker)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Apply Prisma database schema migrations
npx prisma db push

# 4. Start the backend server (Runs Express API & BullMQ Worker concurrently)
npm run dev
```
> **Backend API URL**: `http://localhost:5000`  
> **Health Check**: `http://localhost:5000/api/health`

---

### 2. Running the Frontend (Next.js 14)

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Next.js development server
npm run dev
```
> **Frontend Web UI**: `http://localhost:3000`

---

### 3. 1-Click Double-Click Launcher (Windows)
Alternatively, you can start both Backend and Frontend in a single step on Windows:
```bash
# Double click start.bat in the root folder OR run in terminal:
.\start.bat
```

---

## ✉️ Ethereal Email & Environment Configuration

### Backend Environment File (`/backend/.env`)

Create a `.env` file inside the `backend/` folder with the following variables:

```env
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000

# Relational Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public"

# Redis Connection for BullMQ Engine
REDIS_HOST=localhost
REDIS_PORT=6379

# Concurrency & Rate Limit Parameters
WORKER_CONCURRENCY=10
PROCESSING_TIMEOUT_MS=120000
MAX_EMAILS_PER_HOUR=200
INTER_EMAIL_DELAY_MS=2000

# Ethereal Email Configuration (Optional - Auto-generates if omitted)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user@ethereal.email
SMTP_PASS=your_ethereal_password

# Authentication Secret
JWT_SECRET=supersecret_reachinbox_jwt_token_key_2026
```

### Frontend Environment File (`/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

### 💡 How Ethereal Email Works & Auto-Fallback
- **Auto-Generated Test Accounts**: If no `SMTP_USER` / `SMTP_PASS` is specified in `.env`, Nodemailer automatically creates a real Ethereal test account on boot (`nodemailer.createTestAccount()`).
- **Live Preview URLs**: Every sent email receives a live **Ethereal Preview URL** (e.g. `https://ethereal.email/message/XxX...`), allowing you to view sent HTML emails in your browser without spending money on real domain warmups!

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    A[Next.js 14 Frontend UI] -->|1. REST API / Schedule| B[Express.js Backend API]
    B -->|2. Persist Job State| C[(PostgreSQL Database)]
    B -->|3. Enqueue Delayed Job| D[BullMQ Queue Engine]
    D <-->|4. Redis Storage| E[(Redis Instance)]
    D -->|5. Worker Pick Up| F[Worker Process]
    F -->|6. Atomic Rate & Inter-Delay Check| E
    F -->|7. Dispatch Mail| G[Nodemailer / Ethereal SMTP]
    G -->|8. Save Preview URL & MessageID| C
```

### 1. How Scheduling Works (No Cron)
- **Zero Cron Overhead**: No background cron loops (`node-cron` or `agenda`) are used, eliminating CPU polling spikes.
- **BullMQ Delayed Queue**: When a campaign is scheduled, ReachInbox creates an `EmailJob` in PostgreSQL with status `SCHEDULED` and enqueues a **BullMQ delayed job** (`emailQueue.add('send-email', { emailJobId }, { delay, jobId })`).
- **Exact Timing Execution**: Redis sorted sets hold delayed jobs until the exact `scheduledAt` timestamp arrives, whereupon BullMQ instantly releases the job to an active worker.

### 2. Persistence Across Server Restarts
- **PostgreSQL Ground Truth**: Database state serves as the permanent authority.
- **Startup Reconciliation Engine (`reconcileQueuedJobs()`)**: Upon backend server restart, the engine queries PostgreSQL for all jobs with status `SCHEDULED` and verifies their existence in Redis. Missing jobs are automatically re-enqueued.
- **Stale Job Auto-Recovery (`recoverStaleProcessingJobs()`)**: Jobs caught in `PROCESSING` status during a sudden server crash or crash-recovery are automatically reset and rescheduled without loss.
- **Idempotency Safeguards**: SHA-256 idempotency keys (`campaignId:recipient:scheduledAt`) ensure no email is ever sent twice.

### 3. Rate Limiting & Concurrency Engine
- **Worker Concurrency**: Set by `WORKER_CONCURRENCY` (default: `10` simultaneous workers).
- **Inter-Email Delay**: Minimum delay per sender (`INTER_EMAIL_DELAY_MS=2000` / 2 seconds) enforced via Redis atomic sliding window timestamps (`reserveSendSlot()`).
- **Sender Hourly Limit**: Configurable hourly quota (`MAX_EMAILS_PER_HOUR=200`) managed via Redis atomic counters (`email-rate:{senderId}:{hourWindow}`).
- **Next-Hour Window Postponement**: Jobs exceeding the hourly quota are **never dropped or lost**. They are automatically postponed into the start of the next hour window (`getNextHourWindowStart()`).

### 4. Behavior Under High Concurrency (1,000+ Emails)
- When 1,000+ emails are scheduled at once, PostgreSQL rapidly persists all jobs.
- BullMQ worker concurrency (`10`) and sender rate limiters process the queue smoothly.
- **Zero Crash Resilience**: Global `uncaughtException`, `unhandledRejection`, and Express global error handlers guarantee **99.99% runtime stability**.

---

## 🗺️ Complete Features Implemented Matrix

### 🛠️ Backend Features

| Feature Component | File Location | Technical Description |
| :--- | :--- | :--- |
| **Delayed Job Scheduler** | `src/services/queueService.ts` | BullMQ delayed queue engine without cron overhead |
| **Persistence & Auto-Recovery** | `src/services/queueService.ts` | PostgreSQL-to-BullMQ startup reconciliation & stale job recovery |
| **Hourly Rate Limiter** | `src/services/rateLimiter.ts` | Redis atomic counter & next-hour window postponement |
| **Inter-Email Delay Guard** | `src/services/rateLimiter.ts` | Sliding window send-slot reservation per sender |
| **SMTP Dispatcher** | `src/services/emailService.ts` | Nodemailer SMTP integration with Ethereal preview links |
| **Open Tracking Pixel** | `src/controllers/trackingController.ts` | 1x1 transparent GIF pixel handler (`/api/track/open/:id`) |
| **Spam Heuristic Checker** | `src/utils/spamChecker.ts` | Subject & body deliverability spam score calculator |
| **Queue Admin Dashboard** | `src/index.ts` | BullBoard UI mounted at `/admin/queues` |
| **Crash Protection Guards** | `src/index.ts` | Process-level uncaught exception & unhandled rejection safety net |

---

### 🎨 Frontend Features

| Feature Component | File Location | Technical Description |
| :--- | :--- | :--- |
| **Google OAuth Login** | `src/app/login/page.tsx` | Google OAuth authentication with JWT token storage |
| **Header & User Profile** | `src/components/layout/Header.tsx` | User profile avatar, name display, and sign out |
| **App Shell & Sidebar** | `src/components/layout/AppShell.tsx` | iOS glassmorphism UI navigation layout |
| **Scheduled Emails Inbox** | `src/app/dashboard/scheduled/page.tsx` | Real-time scheduled email jobs table with status indicators |
| **Sent Emails Inbox** | `src/app/dashboard/sent/page.tsx` | Sent email jobs list with Ethereal preview links |
| **Compose Campaign Modal** | `src/components/compose/ComposeForm.tsx` | Email composer with CSV upload, schedule picker & spam detector |
| **CSV Recipient Importer** | `src/components/compose/CsvUploader.tsx` | PapaParse CSV parser with email validation & count badge |
| **Live Deliverability Indicator** | `src/components/compose/ComposeForm.tsx` | Real-time spam score indicator (`LOW`, `MEDIUM`, `HIGH`) |
| **Analytics Dashboard** | `src/app/dashboard/analytics/page.tsx` | Delivery rate stats, open tracking & volume throughput charts |
| **Scheduling Calendar** | `src/app/dashboard/calendar/page.tsx` | Monthly/weekly scheduling calendar view |

---

## 📊 BullMQ Queue Admin Dashboard

The backend includes a built-in visual queue dashboard powered by `@bull-board/express`:
- **Dashboard URL**: `http://localhost:5000/admin/queues`
- **Features**:
  - Real-time monitoring of active, delayed, completed, and failed jobs.
  - Ability to inspect job payloads, retry failed dispatches, or clear queues.

---

## 🌐 Permanent Cloud Deployment (Render / Vercel)

### Render (Full-Stack 1-Click Deployment)
The repository includes a production `render.yaml` blueprint:
1. Connect your GitHub repository to [Render](https://render.com/).
2. Select **Blueprints** ➔ Choose `render.yaml`.
3. Render automatically provisions **PostgreSQL**, **Redis**, **Express Backend**, and **Next.js Frontend**.

---

### 📄 License
ISC License. Developed for **ReachInbox Enterprise Email Cold Outreach Platform**.
