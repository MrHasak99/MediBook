import { Router } from 'express';
import { symptomCheck } from '../controllers/aiController';

const router = Router();

// Public — no auth required so unauthenticated users can also try the assistant
router.post('/symptom-check', symptomCheck);

export default router;
