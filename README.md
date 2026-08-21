# ReachInbox - Autonomous Email Scheduler

ReachInbox is a full-stack email scheduling and campaign management project built using **Next.js, Express, PostgreSQL, Redis, and BullMQ**.

## 1. Backend Setup

### Prerequisites

Make sure the following are installed and running:

* Node.js 18+
* PostgreSQL
* Redis

### Install and Run Backend

```bash
cd backend
npm install
npx prisma db push
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### Redis

Redis should be running on:

```text
localhost:6379
```

Check Redis:

```bash
redis-cli ping
```

Expected:

```text
PONG
```

### BullMQ Worker

BullMQ is used to process scheduled emails in the background.

If the worker is configured as a separate process:

```bash
cd backend
npm run worker
```

The worker handles scheduled jobs, email sending, rate limiting, concurrency, and job status updates.

---

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## 3. Ethereal Email & Environment Variables

Ethereal Email is used as a test SMTP service for development. It allows emails to be sent and viewed through a preview URL without sending them to real recipients.

Create an Ethereal account from:

[Ethereal Email](https://ethereal.email?utm_source=chatgpt.com)

Add the SMTP credentials to `backend/.env`.

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public"

REDIS_HOST=localhost
REDIS_PORT=6379

WORKER_CONCURRENCY=10
PROCESSING_TIMEOUT_MS=120000
MAX_EMAILS_PER_HOUR=200
INTER_EMAIL_DELAY_MS=2000

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user@ethereal.email
SMTP_PASS=your_ethereal_password

JWT_SECRET=your_jwt_secret
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

If SMTP credentials are not provided, Nodemailer can also create an Ethereal test account automatically using `nodemailer.createTestAccount()`.

After an email is sent, an Ethereal preview URL can be used to view the email.

---

# 4. Architecture Overview

```text
             Next.js Frontend
                    |
                    v
              Express API
               /        \
              /          \
             v            v
       PostgreSQL        Redis
       (Database)        (Queue)
                           |
                           v
                        BullMQ
                           |
                           v
                         Worker
                           |
                           v
                     Nodemailer
                           |
                           v
                    Ethereal Email
```

### How Scheduling Works

1. User schedules an email from the frontend.
2. The email job is saved in PostgreSQL with `SCHEDULED` status.
3. A delayed BullMQ job is added to Redis.
4. Redis keeps track of the scheduled execution time.
5. When the time is reached, the BullMQ worker picks up the job.
6. The worker checks the sending limits and sends the email.
7. The email status is updated in PostgreSQL.

The project uses **BullMQ delayed jobs instead of cron polling** for scheduling.

### Persistence on Restart

PostgreSQL is used as the main source of truth for email jobs.

When the application starts, the system checks PostgreSQL for scheduled jobs and verifies that they also exist in the BullMQ/Redis queue.

If a scheduled job is missing from the queue, it is added back.

Jobs that were stuck in `PROCESSING` because of an unexpected shutdown can also be recovered and scheduled again.

```text
PostgreSQL
    |
    | SCHEDULED jobs
    v
Check BullMQ / Redis
    |
    +---- Job exists ----> Continue
    |
    +---- Job missing ---> Re-enqueue
```

### Rate Limiting & Concurrency

The project uses Redis to control email sending.

**Hourly limit:**

```env
MAX_EMAILS_PER_HOUR=200
```

Redis keeps a sender-specific counter. If the hourly limit is reached, remaining jobs are postponed until the next hour.

**Delay between emails:**

```env
INTER_EMAIL_DELAY_MS=2000
```

Redis is also used to reserve sending slots so that emails from the same sender are not sent too quickly.

**Worker concurrency:**

```env
WORKER_CONCURRENCY=10
```

BullMQ allows multiple email jobs to be processed at the same time while keeping the number of concurrent jobs configurable.

---

# 5. Features Implemented

## Backend

### Scheduler

* BullMQ delayed email scheduling
* Redis-backed job queue
* Scheduled email execution
* Automatic job postponement

### Persistence

* PostgreSQL database
* Prisma ORM
* Persistent email job status
* Startup queue reconciliation
* Scheduled job recovery after restart
* Recovery of stale processing jobs

### Rate Limiting

* Per-sender hourly email limit
* Redis-based counters
* Automatic postponement when the limit is reached
* Configurable delay between emails

### Concurrency

* BullMQ worker concurrency
* Multiple email jobs processed in parallel
* Configurable worker count
* Processing timeout handling
* Redis-based coordination

## Frontend

### Login

* Google OAuth login
* JWT session management

### Dashboard

* Campaign overview
* Scheduled email information
* Sent email information

### Compose

* Create email campaigns
* Compose email content
* CSV contact importer
* Schedule date and time
* Spam/deliverability score

### Tables & Views

* Scheduled email table
* Sent email table
* Recipient and email status information
* Ethereal email preview links
* Calendar view for scheduled emails
