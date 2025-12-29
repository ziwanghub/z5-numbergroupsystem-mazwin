import express from 'express';
import { createReview, getReviews } from '../controllers/reviewController';
import { protect } from '../middleware/authMiddleware';
import { verifyTenant } from '../middleware/tenantMiddleware';

const router = express.Router();

router.use(protect);
router.use(verifyTenant);

router.post('/', createReview);
router.get('/', getReviews);

export default router;
