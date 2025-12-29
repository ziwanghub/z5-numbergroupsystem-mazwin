import { Request, Response } from 'express';
import Review from '../models/Review';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

export const createReview = async (req: AuthRequest, res: Response) => {
    try {
        const { recipeId, rating, comment } = req.body;

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const review = new Review({
            recipeId,
            userId: req.user._id,
            ownerId: req.user.ownerId, // Enforce Tenancy
            rating,
            comment
        });

        await review.save();

        // Optional: Notify Admin if rating is low? Or just log it.
        // For now, positive reinforcement system doesn't trigger alerts unless critical.

        res.status(201).json({ message: 'Review submitted', review });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

export const getReviews = async (req: AuthRequest, res: Response) => {
    try {
        const { recipeId } = req.query;
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        // Basic Filter: By Tenant (ownerId) and optionally by Recipe
        const query: any = { ownerId: req.user.ownerId };
        if (recipeId) query.recipeId = recipeId;

        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'username email')
            .limit(50); // Hard limit for now

        res.json({ reviews });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
