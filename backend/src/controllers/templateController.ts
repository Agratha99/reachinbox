import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// GET /api/templates
export async function getTemplates(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const templates = await prisma.template.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({ templates });
    } catch (err: any) {
        console.error('Error fetching templates:', err);
        return res.status(500).json({ error: 'Failed to retrieve templates' });
    }
}

// POST /api/templates
export async function createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, subject, body, category } = req.body;

        if (!name || !subject || !body) {
            return res.status(400).json({ error: 'Template Name, Subject, and Body are required.' });
        }

        const template = await prisma.template.create({
            data: {
                userId,
                name,
                subject,
                body,
                category: category || 'General',
            },
        });

        return res.status(201).json({ message: 'Template saved successfully', template });
    } catch (err: any) {
        console.error('Error creating template:', err);
        return res.status(500).json({ error: 'Failed to save template' });
    }
}

// DELETE /api/templates/:id
export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const template = await prisma.template.findFirst({
            where: { id, userId },
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        await prisma.template.delete({ where: { id } });

        return res.json({ message: 'Template deleted successfully', id });
    } catch (err: any) {
        console.error('Error deleting template:', err);
        return res.status(500).json({ error: 'Failed to delete template' });
    }
}
