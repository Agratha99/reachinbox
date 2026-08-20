import { Router } from 'express';
import {
    getScheduledEmails,
    getSentEmails,
    getEmailById,
    deleteEmailById,
    triggerSendEmailById,
    scheduleCampaign,
    sendImmediateEmail,
} from '../controllers/emailController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/scheduled', requireAuth, getScheduledEmails);
router.get('/sent', requireAuth, getSentEmails);
router.get('/:id', requireAuth, getEmailById);
router.delete('/:id', requireAuth, deleteEmailById);
router.post('/:id/trigger', requireAuth, triggerSendEmailById);
router.post('/schedule', requireAuth, scheduleCampaign);
router.post('/send', requireAuth, sendImmediateEmail);

export default router;
