
import express from 'express';
import { createTicket, getTickets, replyTicket } from '../controllers/ticketController';
import authMiddleware from '../middleware/authMiddleware';
import { verifyTenant } from '../middleware/tenantMiddleware';

const router = express.Router();

// All Ticket Routes require Auth + Tenant Verification
router.use(authMiddleware);
router.use(verifyTenant);

router.post('/', createTicket);
router.get('/', getTickets);
router.post('/:id/reply', replyTicket);

export default router;
