
import { Request, Response } from 'express';
import Ticket from '../models/Ticket';
import Notification from '../models/Notification';
import { scopeQuery } from '../middleware/tenantMiddleware';
import { logEvent } from '../services/auditService';
import { ROLES } from '../models/User';

// Create Ticket
export const createTicket = async (req: Request, res: Response) => {
    try {
        const { title, description, category, severity, snapshot } = req.body;
        const user = (req as any).user;

        // Auto-assign ownerId from the User's profile (Tenant Context)
        // If user is Owner, ownerId is their ID. If User, it's their Owner's ID.
        // We use the 'ownerId' field on the user object, which should be populated by authMiddleware.
        const ownerId = user.ownerId || user.id;

        if (!title || !description) {
            res.status(400).json({ success: false, message: 'Title and Description required' });
            return;
        }

        const newTicket = new Ticket({
            title,
            description,
            category,
            severity,
            snapshot,
            userId: user.id,
            ownerId: ownerId,
            status: 'NEW',
            messages: []
        });

        await newTicket.save();

        // Notify Admin (The Owner) - Unless the reporter IS the Owner
        if (user.id !== ownerId.toString()) {
            await Notification.create({
                recipientId: ownerId,
                type: 'SYSTEM_ALERT',
                title: 'New Issue Reported',
                message: `User reported: ${title}`,
                refId: newTicket._id,
                link: `/admin/tickets/${newTicket._id}`
            });
        }

        await logEvent(req, {
            event: 'TICKET_CREATED',
            level: 'INFO',
            userId: user.id,
            metadata: { ticketId: newTicket._id, category }
        });

        res.status(201).json({ success: true, ticket: newTicket });

    } catch (err: any) {
        console.error("Create Ticket Error:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Tickets (Scoped)
export const getTickets = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let query: any = {};

        if (user.role === ROLES.USER) {
            // Users see ONLY their own tickets
            query = { userId: user.id };
        } else {
            // Admins/Super Admins see tickets in their Scope
            // scopeQuery handles the OwnerId filtering automatically
            query = scopeQuery(req, {});
        }

        const tickets = await Ticket.find(query)
            .sort({ updatedAt: -1 })
            .populate('userId', 'username email'); // Show reporter info

        res.status(200).json({ success: true, tickets });
    } catch (err: any) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Reply to Ticket
export const replyTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content, isInternal } = req.body;
        const user = (req as any).user;

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            res.status(404).json({ success: false, message: 'Ticket not found' });
            return;
        }

        // Security Check: Access Control
        // Ideally we use a middleware or helper check, but simplified:
        // Users can reply if it's THEIR ticket.
        // Admins can reply if it's in THEIR tenant.
        const isOwner = ticket.userId.toString() === user.id;
        const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role);

        // Basic check: Admin must own the tenant (except Super Admin)
        const isTenantAdmin = isAdmin && (user.role === ROLES.SUPER_ADMIN || ticket.ownerId.toString() === user.ownerId);

        if (!isOwner && !isTenantAdmin) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        // Add Message
        ticket.messages.push({
            senderId: user.id,
            senderName: user.username || 'Unknown',
            content,
            isInternal: isAdmin ? !!isInternal : false, // Only admins can make internal notes
            timestamp: new Date()
        });

        // Update status if needed (e.g., Admin reply sets it to 'IN_PROGRESS')
        if (isTenantAdmin && ticket.status === 'NEW') {
            ticket.status = 'IN_PROGRESS';
        }

        await ticket.save();

        // Notification Logic
        if (isTenantAdmin && ticket.userId.toString() !== user.id) {
            // Admin replied -> Notify User
            await Notification.create({
                recipientId: ticket.userId,
                type: 'TICKET_REPLY',
                title: 'New Reply on Ticket',
                message: `Admin replied: ${content.substring(0, 50)}...`,
                refId: ticket._id,
                link: `/tickets/${ticket._id}`
            });
        }

        res.status(200).json({ success: true, ticket });

    } catch (err: any) {
        console.error("Reply Error:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
