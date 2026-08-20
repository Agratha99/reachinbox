import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';

import campaignRoutes from './routes/campaignRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import leadsRoutes from './routes/leadsRoutes';
import templateRoutes from './routes/templateRoutes';
import { getCalendarEvents } from './controllers/calendarController';
import { trackEmailOpen } from './controllers/trackingController';
import { initQueueEngine, redisConnection, isRedisConnected, emailQueue } from './services/queueService';
import { prisma } from './db/prisma';
import { requireAuth } from './middleware/authMiddleware';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: (origin, callback) => {
            callback(null, origin || true);
        },
        credentials: true,
    })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// BullBoard Queue Dashboard for Recruiters/Ops
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

let bullBoardInitialized = false;
function setupBullBoard() {
    if (emailQueue && !bullBoardInitialized) {
        createBullBoard({
            queues: [new BullMQAdapter(emailQueue)],
            serverAdapter,
        });
        bullBoardInitialized = true;
    }
}
app.use('/admin/queues', (req, res, next) => {
    setupBullBoard();
    next();
}, serverAdapter.getRouter());

// Health check endpoint
app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    let queueCount = 0;

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e: any) {
        dbStatus = `error: ${e.message}`;
    }

    if (emailQueue && isRedisConnected) {
        try {
            queueCount = await emailQueue.getDelayedCount();
        } catch (e) { }
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        redis: isRedisConnected ? 'connected' : 'disconnected/fallback',
        queueDepth: queueCount,
    });
});

// Tracking pixel (Public)
app.get('/api/track/open/:id', trackEmailOpen);

// API Routes
app.use('/api/auth', authRoutes);
app.get('/api/emails/calendar', requireAuth, getCalendarEvents);
app.use('/api/emails', emailRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/templates', templateRoutes);

// Auto-seed default user & initial sample emails if database is empty
async function seedInitialData() {
    try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            console.log('[Seed] Seeding default test user Oliver Brown...');
            const user = await prisma.user.create({
                data: {
                    email: 'oliver.brown@domain.io',
                    name: 'Oliver Brown',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    senders: {
                        create: [
                            {
                                email: 'oliver.brown@domain.io',
                                displayName: 'Oliver Brown',
                                isDefault: true,
                            },
                            {
                                email: 'outreach@reachinbox.io',
                                displayName: 'ReachInbox Outreach Team',
                                isDefault: false,
                            },
                        ],
                    },
                },
                include: { senders: true },
            });

            const sender = user.senders[0];

            // Sample Scheduled Campaign
            const scheduledCampaign = await prisma.campaign.create({
                data: {
                    userId: user.id,
                    senderId: sender.id,
                    name: 'Quarterly Outreach',
                    subject: 'Meeting follow up - Scheduled',
                    body: '<p>Hi John, just wanted to follow up on our meeting yesterday regarding the new workflow features.</p>',
                    status: 'SCHEDULED',
                    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
                    totalRecipients: 2,
                },
            });

            const job1 = await prisma.emailJob.create({
                data: {
                    campaignId: scheduledCampaign.id,
                    senderId: sender.id,
                    recipient: 'john.smith@example.com',
                    recipientName: 'John Smith',
                    subject: 'Meeting follow up - Scheduled',
                    body: '<p>Hi John, just wanted to follow up on our meeting yesterday regarding the new workflow features.</p>',
                    status: 'SCHEDULED',
                    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
                    idempotencyKey: 'seed_scheduled_1',
                },
            });
            await prisma.emailJob.update({ where: { id: job1.id }, data: { bullmqJobId: job1.id } });

            const job2 = await prisma.emailJob.create({
                data: {
                    campaignId: scheduledCampaign.id,
                    senderId: sender.id,
                    recipient: 'sarah.wilson@example.com',
                    recipientName: 'Sarah Wilson',
                    subject: 'Product Update - Scheduled',
                    body: '<p>Hi Sarah, thanks for reaching out. Here is our latest product roadmap document.</p>',
                    status: 'SCHEDULED',
                    scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
                    idempotencyKey: 'seed_scheduled_2',
                },
            });
            await prisma.emailJob.update({ where: { id: job2.id }, data: { bullmqJobId: job2.id } });

            // Sample Sent Campaign
            const sentCampaign = await prisma.campaign.create({
                data: {
                    userId: user.id,
                    senderId: sender.id,
                    name: 'Onboarding Email',
                    subject: 'Oliver_hello there! | MUVYT618M#62W01',
                    body: `
            <p>Hey Oliver,</p>
            <p>You're standard check in for something.</p>
            <div style="background-color: #fef9c3; border: 1px solid #fde047; padding: 12px; border-radius: 8px; margin: 16px 0;">
              <strong>Extremely Exclusive:</strong> Only 4 Spots Available Per Month | $35,000 Investment
              <p style="margin-top: 4px; font-size: 13px;">To explore securing your private transformation, simply reply with <strong>"REQUIREMENTS"</strong></p>
            </div>
            <p>You wish for world-class performance.</p>
            <p>P.S. Always remember that your internal standard speak loud and bold!</p>
          `,
                    status: 'COMPLETED',
                    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    totalRecipients: 2,
                    sentCount: 2,
                },
            });

            const sentJob1 = await prisma.emailJob.create({
                data: {
                    campaignId: sentCampaign.id,
                    senderId: sender.id,
                    recipient: 'annette.clark@example.com',
                    recipientName: 'Annette Clark',
                    subject: 'Oliver_hello there! | MUVYT618M#62W01',
                    body: sentCampaign.body,
                    status: 'SENT',
                    scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    sentAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
                    messageId: '<ethereal_test_msg_01@reachinbox.io>',
                    previewUrl: 'https://ethereal.email/message/seed01',
                    idempotencyKey: 'seed_sent_1',
                },
            });
            await prisma.emailJob.update({ where: { id: sentJob1.id }, data: { bullmqJobId: sentJob1.id } });

            const sentJob2 = await prisma.emailJob.create({
                data: {
                    campaignId: sentCampaign.id,
                    senderId: sender.id,
                    recipient: 'david.miller@example.com',
                    recipientName: 'David Miller',
                    subject: 'Re: Project Update',
                    body: '<p>Thanks for the update, David. Looking forward to our call.</p>',
                    status: 'SENT',
                    scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
                    sentAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
                    messageId: '<ethereal_test_msg_02@reachinbox.io>',
                    previewUrl: 'https://ethereal.email/message/seed02',
                    idempotencyKey: 'seed_sent_2',
                },
            });
            await prisma.emailJob.update({ where: { id: sentJob2.id }, data: { bullmqJobId: sentJob2.id } });

            console.log('[Seed] Database seeded with initial test data matching reference screens.');
        }
    } catch (err: any) {
        console.error('[Seed] Error during seeding:', err.message);
    }
}

// Global Express Error Handler Middleware (Prevents server crashes on uncaught route errors)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[GlobalExpressError] Unhandled error captured:', err?.stack || err?.message || err);
    if (!res.headersSent) {
        res.status(err.status || 500).json({
            error: err.message || 'Internal Server Error',
        });
    }
});

// Crash-proof Process Level Event Listeners (Prevents Node runtime exit on unexpected exceptions)
process.on('uncaughtException', (err) => {
    console.error('[ProcessCrashGuard] Uncaught Exception caught safely:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[ProcessCrashGuard] Unhandled Rejection at:', promise, 'reason:', reason);
});

if (process.env.NODE_ENV !== 'test' && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, async () => {
        console.log(`=================================================`);
        console.log(`🚀 ReachInbox Backend API running on port ${PORT}`);
        console.log(`=================================================`);
        await seedInitialData();
        initQueueEngine();
    });
} else {
    seedInitialData().catch(console.error);
}

export default app;
export { app, seedInitialData };
