import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// GET /api/analytics/summary
export async function getAnalyticsSummary(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Total counts across campaigns
        const [totalScheduled, totalSent, totalFailed, totalCampaigns, totalSenders] = await Promise.all([
            prisma.emailJob.count({ where: { campaign: { userId }, status: { in: ['SCHEDULED', 'PROCESSING'] } } }),
            prisma.emailJob.count({ where: { campaign: { userId }, status: 'SENT' } }),
            prisma.emailJob.count({ where: { campaign: { userId }, status: 'FAILED' } }),
            prisma.campaign.count({ where: { userId } }),
            prisma.sender.count({ where: { userId } }),
        ]);

        const totalDispatches = totalScheduled + totalSent + totalFailed;
        const successRate = totalDispatches > 0 ? Math.round((totalSent / (totalSent + totalFailed || 1)) * 100) : 100;

        // 2. Hourly throughput (last 60 mins)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const sentInLastHour = await prisma.emailJob.count({
            where: {
                campaign: { userId },
                status: 'SENT',
                sentAt: { gte: oneHourAgo },
            },
        });

        // Default hourly limit metric
        const maxHourlyLimit = 200;
        const throughputPercentage = Math.min(100, Math.round((sentInLastHour / maxHourlyLimit) * 100));

        // 3. 7-Day Volume Breakdown
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentSentJobs = await prisma.emailJob.findMany({
            where: {
                campaign: { userId },
                status: 'SENT',
                sentAt: { gte: sevenDaysAgo },
            },
            select: { sentAt: true },
        });

        const daysMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
            daysMap[key] = 0;
        }

        recentSentJobs.forEach((job: any) => {
            if (job.sentAt) {
                const key = new Date(job.sentAt).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
                if (daysMap[key] !== undefined) {
                    daysMap[key] += 1;
                }
            }
        });

        const weeklyTrend = Object.entries(daysMap).map(([day, count]) => ({ day, count }));

        return res.json({
            metrics: {
                totalDispatches,
                totalScheduled,
                totalSent,
                totalFailed,
                totalCampaigns,
                totalSenders,
                successRate,
                sentInLastHour,
                maxHourlyLimit,
                throughputPercentage,
            },
            weeklyTrend,
        });
    } catch (err: any) {
        console.error('Error fetching analytics:', err);
        return res.status(500).json({ error: 'Failed to compute analytics metrics' });
    }
}
