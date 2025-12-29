
import express from 'express';
import { createTenant, getTenants, updateTenantStatus, deleteTenant } from '../controllers/adminController';
import authMiddleware from '../middleware/authMiddleware';
import checkRole from '../middleware/roleMiddleware';

const router = express.Router();

// 🔒 Global Protection: Authenticated & Super Admin ONLY
router.use(authMiddleware);
router.use(checkRole('SUPER_ADMIN'));

// Routes
router.post('/tenants', createTenant);
router.get('/tenants', getTenants);
router.patch('/tenants/:id/status', updateTenantStatus);
router.delete('/tenants/:id', deleteTenant);

export default router;
