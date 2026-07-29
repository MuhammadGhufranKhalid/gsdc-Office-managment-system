import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { resolveTenantScope } from '../middleware/tenant.js';
import { getStats } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/stats', protect, resolveTenantScope, getStats);

export default router;
