import { Router } from 'express';
import { getCampaigns, getCampaignById } from '../controllers/campaignController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getCampaigns);
router.get('/:id', requireAuth, getCampaignById);

export default router;
