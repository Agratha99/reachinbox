import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// GET /api/emails/calendar
export async function getCalendarEvents(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const jobs = await prisma.emailJob.findMany({
            where: { campaign: { userId } },
            orderBy: { scheduledAt: 'asc' },
            select: {
                id: true,
                subject: true,
                recipient: true,
                status: true,
                scheduledAt: true,
                sentAt: true,
                campaign: { select: { name: true } },
            },
        });

        const events = jobs.map((j: any) => ({
            id: j.id,
            title: j.subject || j.campaign?.name || 'Email Dispatch',
            recipient: j.recipient,
            status: j.status.toLowerCase(),
            scheduledAt: j.scheduledAt,
            sentAt: j.sentAt,
            dateStr: new Date(j.scheduledAt).toISOString().split('T')[0],
        }));

        return res.json({ events });
    } catch (err: any) {
        console.error('Error fetching calendar events:', err);
        return res.status(500).json({ error: 'Failed to retrieve calendar events' });
    }
}
