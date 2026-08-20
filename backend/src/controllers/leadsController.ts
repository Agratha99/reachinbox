import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// GET /api/leads
export async function getLeadLists(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const lists = await prisma.leadList.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { leads: true } },
            },
        });

        return res.json({ lists });
    } catch (err: any) {
        console.error('Error fetching lead lists:', err);
        return res.status(500).json({ error: 'Failed to retrieve lead lists' });
    }
}

// POST /api/leads
export async function createLeadList(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, description, leads } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'List name is required.' });
        }

        const list = await prisma.leadList.create({
            data: {
                userId,
                name,
                description,
                leadsCount: Array.isArray(leads) ? leads.length : 0,
            },
        });

        if (Array.isArray(leads) && leads.length > 0) {
            const leadData = leads.map((l: any) => ({
                listId: list.id,
                email: typeof l === 'string' ? l : l.email,
                name: typeof l === 'object' ? l.name : undefined,
                company: typeof l === 'object' ? l.company : undefined,
            }));

            await prisma.leadItem.createMany({
                data: leadData,
            });
        }

        return res.status(201).json({ message: 'Lead list created successfully', list });
    } catch (err: any) {
        console.error('Error creating lead list:', err);
        return res.status(500).json({ error: 'Failed to create lead list' });
    }
}

// DELETE /api/leads/:id
export async function deleteLeadList(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const list = await prisma.leadList.findFirst({
            where: { id, userId },
        });

        if (!list) {
            return res.status(404).json({ error: 'Lead list not found' });
        }

        await prisma.leadList.delete({ where: { id } });

        return res.json({ message: 'Lead list deleted successfully', id });
    } catch (err: any) {
        console.error('Error deleting lead list:', err);
        return res.status(500).json({ error: 'Failed to delete lead list' });
    }
}
