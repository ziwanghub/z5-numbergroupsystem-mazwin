import { Router } from 'express';
import { getAllFormulas, createFormula, updateVersionStatus } from '../controllers/formulaController';
import authenticate from '../middleware/authMiddleware';

const router = Router();

// Public / Protected Routes
// For now, listing is protected? Or public? Given "Professional Data Workstation", let's make it protected.
router.get('/', authenticate, getAllFormulas);
router.post('/', authenticate, createFormula);
router.patch('/:formulaId/versions/:version/status', authenticate, updateVersionStatus);

export default router;
