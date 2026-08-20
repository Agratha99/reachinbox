import { Router } from 'express';
import { trackOpen, trackClick, handleUnsubscribe } from '../controllers/trackingController';

const router = Router();

router.get('/open/:jobId.png', trackOpen);
router.get('/open/:jobId', trackOpen);
router.get('/click/:jobId', trackClick);
router.get('/unsubscribe', handleUnsubscribe);
router.get('/unsubscribe/:email', handleUnsubscribe);

export default router;
