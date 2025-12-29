
import { Request, Response } from 'express';
import Recipe from '../models/Recipe';
import { logEvent } from '../services/auditService';
import { scopeQuery } from '../middleware/tenantMiddleware';

// Create New Recipe
export const createRecipe = async (req: Request, res: Response) => {
    try {
        const { name, description, baseFormulaId, config, uiOptions, isFavorite, tags } = req.body;
        const userId = (req as any).user.id;
        const ownerId = (req as any).ownerId || userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        if (!name || !baseFormulaId || !config) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }

        if (typeof config !== 'object') {
            res.status(400).json({ success: false, message: 'Invalid config payload' });
            return;
        }

        const newRecipe = new Recipe({
            userId,
            ownerId, // [NEW]
            name,
            description,
            baseFormulaId,
            config,
            uiOptions,
            isFavorite,
            tags
        });

        await newRecipe.save();
        await logEvent(req, { event: 'RECIPE_CREATED', userId, metadata: { recipeId: newRecipe._id } });

        res.status(201).json({ success: true, recipe: newRecipe });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
};

// Get My Recipes
export const getMyRecipes = async (req: Request, res: Response) => {
    try {
        // [NEW] Use Scope Query for Isolation
        const query = scopeQuery(req, { deletedAt: null });
        const recipes = await Recipe.find(query).sort({ createdAt: -1 });

        res.status(200).json({ success: true, recipes });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
};

// Delete Recipe
export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const softDeleted = await Recipe.findOneAndUpdate(
            { _id: id, userId },
            { $set: { deletedAt: new Date() } },
            { new: true }
        );

        if (!softDeleted) {
            res.status(404).json({ success: false, message: 'Recipe not found or unauthorized' });
            return;
        }

        try {
            await logEvent(req, {
                event: 'RECIPE_DELETED', // Soft Delete
                level: 'INFO',
                metadata: { recipeId: id, mode: 'soft' }
            });
        } catch (ignore) { }

        res.status(200).json({ success: true, message: 'Recipe moved to trash' });

    } catch (err) {
        console.error('DELETE RECIPE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Server error' });
    }
};

// [NEW] Update Recipe (Rename, Toggle Favorite, Update Tags, Toggle Active)
export const updateRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const { name, description, isFavorite, tags, uiOptions, isActive } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const updatedRecipe = await Recipe.findOneAndUpdate(
            { _id: id, userId },
            {
                $set: {
                    ...(name && { name }),
                    ...(description && { description }),
                    ...(isFavorite !== undefined && { isFavorite }),
                    ...(isActive !== undefined && { isActive }),
                    ...(tags && { tags }),
                    ...(uiOptions && { uiOptions })
                }
            },
            { new: true }
        );

        if (!updatedRecipe) {
            res.status(404).json({ success: false, message: 'Recipe not found or unauthorized' });
            return;
        }

        if (name || isFavorite !== undefined || isActive !== undefined) {
            try {
                await logEvent(req, {
                    event: 'RECIPE_UPDATED',
                    level: 'INFO',
                    metadata: { recipeId: id, updates: Object.keys(req.body) }
                });
            } catch (ignore) { }
        }

        res.status(200).json({ success: true, recipe: updatedRecipe });

    } catch (err: any) {
        console.error('UPDATE RECIPE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err?.message || 'Server error' });
    }
};

// [NEW] Get Trash (Soft Deleted Items)
export const getTrash = async (req: Request, res: Response) => {
    try {
        const query = scopeQuery(req, { deletedAt: { $ne: null } });
        const trash = await Recipe.find(query).sort({ deletedAt: -1 });

        res.status(200).json({ success: true, recipes: trash });

    } catch (err) {
        console.error('GET TRASH ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Server error' });
    }
};

// [NEW] Restore Recipe
export const restoreRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const restored = await Recipe.findOneAndUpdate(
            { _id: id, userId },
            { $set: { deletedAt: null } },
            { new: true }
        );

        if (!restored) {
            res.status(404).json({ success: false, message: 'Recipe not found or unauthorized' });
            return;
        }

        await logEvent(req, {
            event: 'RECIPE_RESTORED',
            level: 'INFO',
            metadata: { recipeId: id }
        });

        res.status(200).json({ success: true, message: 'Recipe restored', recipe: restored });

    } catch (err) {
        console.error('RESTORE RECIPE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Server error' });
    }
};

// [NEW] Hard Delete (Permanent)
export const hardDeleteRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const deleted = await Recipe.findOneAndDelete({ _id: id, userId });

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Recipe not found or unauthorized' });
            return;
        }

        await logEvent(req, {
            event: 'RECIPE_HARD_DELETED',
            level: 'WARNING',
            metadata: { recipeId: id }
        });

        res.status(200).json({ success: true, message: 'Recipe permanently deleted' });

    } catch (err) {
        console.error('HARD DELETE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Server error' });
    }
};
