import { Router } from 'express';
import { getSenders, createSender, testSenderSmtp, deleteSender } from '../controllers/senderController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getSenders);
router.post('/', requireAuth, createSender);
router.post('/test', requireAuth, testSenderSmtp);
router.delete('/:id', requireAuth, deleteSender);

export default router;
