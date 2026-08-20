import { Response } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// GET /api/senders
export async function getSenders(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const senders = await prisma.sender.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({ senders });
    } catch (err: any) {
        console.error('Error fetching senders:', err);
        return res.status(500).json({ error: 'Failed to retrieve senders' });
    }
}

// POST /api/senders
export async function createSender(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { email, displayName, smtpHost, smtpPort, smtpUser, smtpPass, isDefault } = req.body;

        if (!email || !displayName) {
            return res.status(400).json({ error: 'Email and Display Name are required.' });
        }

        if (isDefault) {
            await prisma.sender.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        const count = await prisma.sender.count({ where: { userId } });

        const sender = await prisma.sender.create({
            data: {
                userId,
                email,
                displayName,
                smtpHost: smtpHost || 'smtp.ethereal.email',
                smtpPort: smtpPort ? parseInt(smtpPort, 10) : 587,
                smtpUser: smtpUser || undefined,
                smtpPass: smtpPass || undefined,
                isDefault: isDefault || count === 0,
            },
        });

        return res.status(201).json({ message: 'Sender account created successfully', sender });
    } catch (err: any) {
        console.error('Error creating sender:', err);
        return res.status(500).json({ error: 'Failed to create sender account' });
    }
}

// POST /api/senders/test
export async function testSenderSmtp(req: AuthenticatedRequest, res: Response) {
    try {
        const { smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

        const host = smtpHost || process.env.SMTP_HOST || 'smtp.ethereal.email';
        const port = smtpPort ? parseInt(smtpPort, 10) : parseInt(process.env.SMTP_PORT || '587', 10);
        const user = smtpUser || process.env.SMTP_USER;
        const pass = smtpPass || process.env.SMTP_PASS;

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
        });

        await transporter.verify();

        return res.json({ success: true, message: `Successfully connected to SMTP server ${host}:${port}` });
    } catch (err: any) {
        console.error('SMTP Verify Error:', err);
        return res.status(400).json({ success: false, error: err.message || 'SMTP connection failed' });
    }
}

// DELETE /api/senders/:id
export async function deleteSender(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const sender = await prisma.sender.findFirst({
            where: { id, userId },
        });

        if (!sender) {
            return res.status(404).json({ error: 'Sender account not found' });
        }

        await prisma.sender.delete({ where: { id } });

        return res.json({ message: 'Sender account removed', id });
    } catch (err: any) {
        console.error('Error deleting sender:', err);
        return res.status(500).json({ error: 'Failed to delete sender account' });
    }
}
