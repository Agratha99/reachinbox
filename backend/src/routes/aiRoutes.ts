import { Router } from 'express';
import { generateEmailTemplate } from '../controllers/aiController';

const router = Router();

router.post('/generate-email', generateEmailTemplate);

export default router;
