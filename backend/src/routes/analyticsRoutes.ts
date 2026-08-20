import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/summary', requireAuth, getAnalyticsSummary);

export default router;
