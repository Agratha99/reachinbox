import { Router } from 'express';
import { getLeadLists, createLeadList, deleteLeadList } from '../controllers/leadsController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getLeadLists);
router.post('/', requireAuth, createLeadList);
router.delete('/:id', requireAuth, deleteLeadList);

export default router;
