import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../db/prisma';
import { sendMail } from './emailService';
import { checkAndIncrementHourlyRate, reserveSendSlot } from './rateLimiter';
import { processEmailTemplate } from '../utils/spintax';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '10', 10);
const PROCESSING_TIMEOUT_MS = parseInt(process.env.PROCESSING_TIMEOUT_MS || '120000', 10);
const QUEUE_NAME = 'reachinbox-email-queue';

export let redisConnection: Redis | null = null;
export let emailQueue: Queue | null = null;
export let emailWorker: Worker | null = null;
export let isRedisConnected = false;

let fallbackIntervalTimer: NodeJS.Timeout | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

export function initQueueEngine() {
    try {
        redisConnection = new Redis({
            host: REDIS_HOST,
            port: REDIS_PORT,
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
        });

        redisConnection.on('error', (err) => {
            if (isRedisConnected) {
                console.warn('[QueueEngine] Redis connection lost:', err.message);
            }
            isRedisConnected = false;
            startEmergencyFallbackLoop();
        });

        redisConnection.on('connect', async () => {
            console.log('[QueueEngine] Connected to Redis successfully');
            isRedisConnected = true;
            stopEmergencyFallbackLoop();
            await setupBullMQ();
            await reconcileQueuedJobs();
            await recoverStaleProcessingJobs();
            startWorkerHeartbeat();
        });
    } catch (e: any) {
        console.warn('[QueueEngine] Redis init skipped:', e.message);
        startEmergencyFallbackLoop();
    }
}

async function setupBullMQ() {
    if (!redisConnection) return;
    try {
        emailQueue = new Queue(QUEUE_NAME, { connection: redisConnection });
        emailWorker = new Worker(
            QUEUE_NAME,
            async (job: Job) => {
                const { emailJobId } = job.data;
                if (!emailJobId) return;
                await processSingleEmailJob(emailJobId);
            },
            {
                connection: redisConnection,
                concurrency: WORKER_CONCURRENCY,
                settings: {
                    backoffStrategy: (attemptsMade: number) => Math.pow(2, attemptsMade) * 5000,
                },
            }
        );

        emailWorker.on('completed', (job) => {
            console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
        });

        emailWorker.on('failed', (job, err) => {
            console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
        });
    } catch (err: any) {
        console.warn('[QueueEngine] BullMQ setup error:', err.message);
    }
}

/**
 * Schedule or re-schedule a BullMQ delayed job using deterministic emailJobId
 */
export async function scheduleEmailJob(emailJobId: string, scheduledAt: Date): Promise<boolean> {
    const now = Date.now();
    const delay = Math.max(0, scheduledAt.getTime() - now);

    if (emailQueue && isRedisConnected) {
        try {
            await emailQueue.add(
                'send-email',
                { emailJobId },
                {
                    jobId: emailJobId,
                    delay,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                }
            );
            return true;
        } catch (err: any) {
            console.warn(`[QueueEngine] Queue add failed for job ${emailJobId}, relying on DB fallback`, err.message);
        }
    }
    return false;
}

/**
 * Startup Reconciliation Engine: Scans PostgreSQL for SCHEDULED jobs and ensures BullMQ jobs exist in Redis
 */
export async function reconcileQueuedJobs() {
    console.log('[Reconciliation] Starting PostgreSQL -> BullMQ queue reconciliation...');
    try {
        const scheduledJobs = await prisma.emailJob.findMany({
            where: { status: 'SCHEDULED' },
            take: 1000,
        });

        let countReconciled = 0;
        for (const job of scheduledJobs) {
            if (emailQueue && isRedisConnected) {
                const existingJob = await emailQueue.getJob(job.id);
                if (!existingJob) {
                    await scheduleEmailJob(job.id, job.scheduledAt);
                    countReconciled++;
                }
            }
        }
        console.log(`[Reconciliation] Reconciled ${countReconciled} missing BullMQ delayed jobs.`);
    } catch (err: any) {
        console.error('[Reconciliation] Error during job reconciliation:', err.message);
    }
}

/**
 * Recover stale PROCESSING jobs where lockedUntil < NOW()
 */
export async function recoverStaleProcessingJobs() {
    try {
        const now = new Date();
        const staleJobs = await prisma.emailJob.findMany({
            where: {
                status: 'PROCESSING',
                lockedUntil: { lte: now },
            },
        });

        if (staleJobs.length > 0) {
            console.log(`[StaleRecovery] Found ${staleJobs.length} stale PROCESSING jobs. Resetting to SCHEDULED...`);
            for (const job of staleJobs) {
                await prisma.emailJob.update({
                    where: { id: job.id },
                    data: {
                        status: 'SCHEDULED',
                        processingAt: null,
                        lockedUntil: null,
                    },
                });
                await scheduleEmailJob(job.id, new Date());
            }
        }
    } catch (err: any) {
        console.error('[StaleRecovery] Error recovering stale jobs:', err.message);
    }
}

/**
 * Core Execution Engine: Atomically claims job, checks rate limit, enforces send-slot delay, dispatches SMTP
 */
export async function processSingleEmailJob(emailJobId: string): Promise<boolean> {
    // 1. Fetch EmailJob record with Sender and Campaign details
    const job = await prisma.emailJob.findUnique({
        where: { id: emailJobId },
        include: {
            campaign: true,
            sender: true,
        },
    });

    if (!job) return false;

    // Idempotency check: Skip if already sent, failed, or cancelled
    if (job.status === 'SENT' || job.status === 'FAILED' || job.status === 'CANCELLED') {
        return true;
    }

    // 1b. Check Unsubscribe Suppression List
    const isUnsubscribed = await prisma.unsubscribedRecipient.findUnique({
        where: { email: job.recipient },
    });

    if (isUnsubscribed) {
        console.log(`[QueueEngine] Skipping dispatch to unsubscribed recipient: ${job.recipient}`);
        await prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
                status: 'CANCELLED',
                errorMessage: 'Recipient has unsubscribed from cold outreach.',
            },
        });
        return true;
    }

    // 2. Atomic Database Job Claim (idempotent status transition to PROCESSING)
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + PROCESSING_TIMEOUT_MS);

    const claimedCount = await prisma.emailJob.updateMany({
        where: {
            id: emailJobId,
            status: 'SCHEDULED',
        },
        data: {
            status: 'PROCESSING',
            processingAt: now,
            lockedUntil,
            attempts: { increment: 1 },
        },
    });

    if (claimedCount.count === 0 && job.status !== 'PROCESSING') {
        return true;
    }

    // 3. Distributed Atomic Hourly Rate Limit Check
    if (redisConnection && isRedisConnected) {
        const rateCheck = await checkAndIncrementHourlyRate(
            redisConnection,
            job.senderId,
            job.campaign.hourlyLimit
        );

        if (!rateCheck.allowed) {
            console.log(
                `[RateLimiter] Sender ${job.senderId} reached hourly limit (${job.campaign.hourlyLimit}/hr). Rescheduling job ${emailJobId} for next window ${rateCheck.nextWindow.toISOString()}`
            );
            await prisma.emailJob.update({
                where: { id: emailJobId },
                data: {
                    status: 'SCHEDULED',
                    scheduledAt: rateCheck.nextWindow,
                    processingAt: null,
                    lockedUntil: null,
                },
            });

            if (emailQueue && isRedisConnected) {
                await emailQueue.remove(emailJobId).catch(() => { });
                await scheduleEmailJob(emailJobId, rateCheck.nextWindow);
            }
            return false;
        }

        // 4. Reserve Send Slot for Minimum Inter-Email Delay
        const slotMs = await reserveSendSlot(
            redisConnection,
            job.senderId,
            job.campaign.delayMs || 2000
        );

        const delayMs = slotMs - Date.now();
        if (delayMs > 50) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    // 5. Parse Spintax and Merge Variables ({{firstName}}, {{companyName}}, {Hi|Hey})
    const personalizedSubject = processEmailTemplate(job.subject, {
        email: job.recipient,
        name: job.recipientName,
    });

    let personalizedBody = processEmailTemplate(job.body, {
        email: job.recipient,
        name: job.recipientName,
    });

    // 6. HTML Body Sanitization prior to tracking pixel injection
    let cleanHtmlBody = sanitizeHtml(personalizedBody, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'u', 'span', 'div']),
        allowedAttributes: {
            '*': ['style', 'class'],
            a: ['href', 'name', 'target'],
            img: ['src', 'alt', 'width', 'height'],
        },
    });

    // 7. Inject Open Tracking Pixel & Click Proxy
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const openPixelUrl = `${baseUrl}/api/track/open/${job.id}.png`;
    const trackingPixelHtml = `<img src="${openPixelUrl}" width="1" height="1" style="display:none !important;" alt="" />`;

    // Inject Unsubscribe Footer
    const unsubscribeUrl = `${baseUrl}/api/track/unsubscribe?email=${encodeURIComponent(job.recipient)}`;
    const unsubscribeFooterHtml = `
    <div style="margin-top: 32px; pt-16 border-t border-gray-200 text-align: center; font-size: 11px; color: #9ca3af;">
      <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">unsubscribe here</a>.</p>
    </div>
  `;

    cleanHtmlBody += trackingPixelHtml + unsubscribeFooterHtml;

    const fromString = job.sender.displayName
        ? `"${job.sender.displayName}" <${job.sender.email}>`
        : job.sender.email;

    // 8. SMTP Transmission via Nodemailer with List-Unsubscribe Compliance Headers
    const result = await sendMail({
        from: fromString,
        to: job.recipient,
        subject: personalizedSubject,
        html: cleanHtmlBody,
        smtpHost: job.sender.smtpHost || undefined,
        smtpPort: job.sender.smtpPort || undefined,
        smtpUser: job.sender.smtpUser || undefined,
        smtpPass: job.sender.smtpPass || undefined,
        headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
    });

    if (result.success) {
        await prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                messageId: result.messageId,
                previewUrl: result.previewUrl,
                errorMessage: null,
                processingAt: null,
                lockedUntil: null,
            },
        });

        await prisma.campaign.update({
            where: { id: job.campaignId },
            data: { sentCount: { increment: 1 } },
        });

        const remaining = await prisma.emailJob.count({
            where: {
                campaignId: job.campaignId,
                status: { in: ['SCHEDULED', 'PROCESSING'] },
            },
        });

        if (remaining === 0) {
            await prisma.campaign.update({
                where: { id: job.campaignId },
                data: { status: 'COMPLETED' },
            });
        }

        return true;
    } else {
        const isPermanent = job.attempts >= 3;
        const nextStatus = isPermanent ? 'FAILED' : 'SCHEDULED';

        await prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
                status: nextStatus,
                errorMessage: result.error || 'SMTP dispatch failure',
                processingAt: null,
                lockedUntil: null,
            },
        });

        if (isPermanent) {
            await prisma.campaign.update({
                where: { id: job.campaignId },
                data: { failedCount: { increment: 1 } },
            });
        } else {
            const retryDelayMs = Math.pow(2, job.attempts) * 5000;
            await scheduleEmailJob(emailJobId, new Date(Date.now() + retryDelayMs));
        }

        return false;
    }
}

/**
 * Emergency Fallback Loop when Redis is temporarily offline
 */
function startEmergencyFallbackLoop() {
    if (fallbackIntervalTimer) return;
    console.warn('[FallbackDispatcher] Activating 1-second database emergency dispatch loop...');

    fallbackIntervalTimer = setInterval(async () => {
        try {
            const now = new Date();
            const dueJobs = await prisma.emailJob.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: { lte: now },
                },
                take: 50,
                orderBy: { scheduledAt: 'asc' },
            });

            for (const job of dueJobs) {
                try {
                    await processSingleEmailJob(job.id);
                } catch (jobErr: any) {
                    console.error(`[FallbackDispatcher] Error processing job ${job.id}:`, jobErr.message);
                }
            }
        } catch (err: any) {
            // Quiet fail
        }
    }, 1000);
}

function stopEmergencyFallbackLoop() {
    if (fallbackIntervalTimer) {
        clearInterval(fallbackIntervalTimer);
        fallbackIntervalTimer = null;
        console.log('[FallbackDispatcher] Deactivated emergency DB dispatch loop (Redis active).');
    }
}

function startWorkerHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(async () => {
        if (redisConnection && isRedisConnected) {
            const workerKey = `worker:heartbeat:${process.pid}`;
            await redisConnection.set(workerKey, Date.now().toString(), 'EX', 15).catch(() => { });
        }
    }, 5000);
}
