import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

// Transparent 1x1 GIF Buffer
const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

// GET /api/track/open/:jobId
export async function trackOpen(req: Request, res: Response) {
    try {
        const id = req.params.jobId || req.params.id;

        if (id) {
            const job = await prisma.emailJob.findUnique({ where: { id } });
            if (job) {
                await prisma.emailJob.update({
                    where: { id },
                    data: {
                        openCount: { increment: 1 },
                        openedAt: job.openedAt || new Date(),
                    },
                });
            }
        }
    } catch (err) {
        console.warn('Tracking pixel error:', err);
    }

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.status(200).send(TRANSPARENT_GIF);
}

export const trackEmailOpen = trackOpen;

// GET /api/track/click/:jobId
export async function trackClick(req: Request, res: Response) {
    try {
        const { jobId } = req.params;
        const targetUrl = (req.query.url as string) || 'https://reachinbox.ai';

        if (jobId) {
            const job = await prisma.emailJob.findUnique({ where: { id: jobId } });
            if (job) {
                await prisma.emailJob.update({
                    where: { id: jobId },
                    data: {
                        clickCount: { increment: 1 },
                        clickedAt: job.clickedAt || new Date(),
                    },
                });
            }
        }

        return res.redirect(targetUrl);
    } catch (err) {
        console.warn('Track click error:', err);
        return res.redirect('https://reachinbox.ai');
    }
}

// GET /api/track/unsubscribe
export async function handleUnsubscribe(req: Request, res: Response) {
    try {
        const email = (req.params.email || req.query.email as string || '').toLowerCase();

        if (email) {
            await prisma.unsubscribedRecipient.upsert({
                where: { email },
                create: { email, reason: 'User requested unsubscribe via tracking link' },
                update: {},
            });
        }

        return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #fff;">
          <h2>You have been unsubscribed</h2>
          <p>Your email address (${email}) will no longer receive emails from this sender.</p>
        </body>
      </html>
    `);
    } catch (err) {
        return res.status(500).send('Error processing unsubscription.');
    }
}
