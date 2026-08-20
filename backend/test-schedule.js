const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSchedule() {
    try {
        console.log('Testing Database Connection and User Lookup...');
        const user = await prisma.user.findFirst({
            include: { senders: true },
        });

        if (!user) {
            console.error('ERROR: No test user found in database!');
            return;
        }

        console.log('Found user:', user.email, 'User ID:', user.id);

        let sender = user.senders?.[0];
        if (!sender) {
            console.log('No sender found, creating default sender...');
            sender = await prisma.sender.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    displayName: user.name,
                    isDefault: true,
                },
            });
        }
        console.log('Sender ID:', sender.id, 'Sender email:', sender.email);

        const scheduledAt = new Date(Date.now() + 5 * 60 * 1000);
        console.log('Creating campaign scheduled at:', scheduledAt.toISOString());

        const campaign = await prisma.campaign.create({
            data: {
                userId: user.id,
                senderId: sender.id,
                name: 'Test Schedule Campaign',
                subject: 'Test Subject',
                body: '<p>Test body</p>',
                status: 'SCHEDULED',
                startTime: scheduledAt,
                delayMs: 2000,
                hourlyLimit: 200,
                totalRecipients: 1,
            },
        });

        console.log('SUCCESS: Created Campaign ID:', campaign.id);

        const crypto = require('crypto');
        const idempotencyKey = crypto
            .createHash('sha256')
            .update(`${campaign.id}:test@example.com:${scheduledAt.toISOString()}:0`)
            .digest('hex');

        const job = await prisma.emailJob.create({
            data: {
                campaignId: campaign.id,
                senderId: sender.id,
                recipient: 'test@example.com',
                subject: 'Test Subject',
                body: '<p>Test body</p>',
                status: 'SCHEDULED',
                scheduledAt,
                idempotencyKey,
            },
        });

        console.log('SUCCESS: Created EmailJob ID:', job.id);

    } catch (err) {
        console.error('CRITICAL SCHEDULE ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testSchedule();
