const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runE2ETest() {
    console.log('--- STARTING REACHINBOX E2E VERIFICATION TEST ---');

    const user = await prisma.user.findFirst({
        include: { senders: true }
    });

    if (!user || user.senders.length === 0) {
        console.error('X Test Failed: No default user or senders found in DB');
        return;
    }

    console.log(`[E2E] Found user: ${user.name} (${user.email}), sender: ${user.senders[0].email}`);

    const schedulePayload = JSON.stringify({
        senderId: user.senders[0].id,
        recipients: [
            { email: 'alpha.test@example.com', name: 'Alpha Recipient' },
            { email: 'beta.test@example.com', name: 'Beta Recipient' },
            { email: 'gamma.test@example.com', name: 'Gamma Recipient' }
        ],
        subject: 'ReachInbox E2E Verification - {{name}}',
        body: '<p>Hello <strong>{{name}}</strong>, this is an automated ReachInbox production test message.</p>',
        scheduledAt: new Date(Date.now() + 1000).toISOString(),
        delayMs: 1000,
        hourlyLimit: 200
    });

    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/emails/schedule',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(schedulePayload),
            'x-user-id': user.id
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', async () => {
            console.log('[E2E] Schedule API Response:', data);
            const parsed = JSON.parse(data);
            const campaignId = parsed.campaignId;

            console.log('[E2E] Waiting 8 seconds for fallback dispatcher to process scheduled jobs...');
            await new Promise(r => setTimeout(r, 8000));

            const jobs = await prisma.emailJob.findMany({
                where: { campaignId }
            });

            console.log(`\n=================================================`);
            console.log(`[E2E] PostgreSQL EmailJob Verification for Campaign ${campaignId}:`);
            for (const job of jobs) {
                console.log(`  - Job ID: ${job.id}`);
                console.log(`    Recipient: ${job.recipient} (${job.recipientName})`);
                console.log(`    Status: ${job.status}`);
                console.log(`    Attempts: ${job.attempts}`);
                console.log(`    Preview URL: ${job.previewUrl || 'N/A'}`);
            }
            console.log(`=================================================\n`);

            const sentCount = jobs.filter(j => j.status === 'SENT').length;
            console.log(`[E2E] Total Sent: ${sentCount} / ${jobs.length}`);

            if (sentCount === jobs.length) {
                console.log('✅ ALL E2E VERIFICATION CHECKS PASSED PERFECTLY!');
            } else {
                console.log('⚠️ Status breakdown:', jobs.map(j => ({ id: j.id, status: j.status })));
            }

            await prisma.$disconnect();
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(schedulePayload);
    req.end();
}

runE2ETest();
