import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import checkRole from '../middleware/roleMiddleware';

const router = express.Router();

// ==========================================
// 🔓 PUBLIC ROUTES
// ==========================================
router.post('/register', register);
router.post('/login', login);

// ==========================================
// 🔐 PROTECTED ROUTES (Login Required)
// ==========================================
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

// ==========================================
// 👮‍♂️ RBAC ROUTES (Phase E Verification)
// ==========================================

// 1. Admin Test: เฉพาะ ADMIN หรือ SUPER_ADMIN
router.get(
    '/admin-test',
    authMiddleware,
    checkRole('ADMIN', 'SUPER_ADMIN'),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'ACCESS GRANTED: You are in the Admin Area.',
            user: req.user
        });
    }
);

// 2. Audit Test: เฉพาะ AUDITOR หรือ SUPER_ADMIN
router.get(
    '/audit-test',
    authMiddleware,
    checkRole('AUDITOR', 'SUPER_ADMIN'),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'ACCESS GRANTED: You are in the Audit Dashboard.',
            user: req.user
        });
    }
);

export default router;
