import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * GET /api/campaigns
 * List all campaigns owned by the authenticated user
 */
export async function getCampaigns(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
        const skip = (page - 1) * limit;

        const [campaigns, total] = await Promise.all([
            prisma.campaign.findMany({
                where: { userId: req.user.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: { id: true, email: true, displayName: true },
                    },
                    _count: {
                        select: { emailJobs: true },
                    },
                },
            }),
            prisma.campaign.count({
                where: { userId: req.user.id },
            }),
        ]);

        return res.json({
            campaigns,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err: any) {
        console.error('[getCampaigns Error]:', err.message);
        return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
}

/**
 * GET /api/campaigns/:id
 * Fetch campaign details and job statistics for the authenticated user
 */
export async function getCampaignById(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
        const { id } = req.params;

        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                userId: req.user.id, // User data isolation
            },
            include: {
                sender: {
                    select: { id: true, email: true, displayName: true },
                },
                emailJobs: {
                    take: 50,
                    orderBy: { scheduledAt: 'asc' },
                },
            },
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found or unauthorized' });
        }

        return res.json({ campaign });
    } catch (err: any) {
        console.error('[getCampaignById Error]:', err.message);
        return res.status(500).json({ error: 'Failed to fetch campaign details' });
    }
}
