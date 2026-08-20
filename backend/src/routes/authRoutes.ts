import { Router } from 'express';
import { googleAuth, getGoogleOAuthUrl, googleOAuthCallback, getCurrentUser, logout } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/google', getGoogleOAuthUrl);
router.get('/google/callback', googleOAuthCallback);
router.post('/google', googleAuth);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', requireAuth, logout);

export default router;
