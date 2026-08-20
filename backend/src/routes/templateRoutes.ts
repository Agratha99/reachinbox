import { Router } from 'express';
import { getTemplates, createTemplate, deleteTemplate } from '../controllers/templateController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getTemplates);
router.post('/', requireAuth, createTemplate);
router.delete('/:id', requireAuth, deleteTemplate);

export default router;
