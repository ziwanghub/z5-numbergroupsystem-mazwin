import { Request, Response } from 'express';
import Recipe from '../models/Recipe';
import { logEvent } from '../services/auditService';

// Create New Recipe
export const createRecipe = async (req: Request, res: Response) => {
    try {
        const { name, description, baseFormulaId, config, uiOptions } = req.body;
        const userId = (req as any).user.id;

        // Guard against missing auth context to avoid silent failures.
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        if (!name || !baseFormulaId || !config) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }

        // Enforce config object shape early to prevent schema mismatches.
        if (typeof config !== 'object') {
            res.status(400).json({ success: false, message: 'Invalid config payload' });
            return;
        }

        const newRecipe = new Recipe({
            userId,
            name,
            description,
            baseFormulaId,
            config,
            uiOptions: uiOptions || { color: 'blue', icon: 'hash' }
        });

        await newRecipe.save();

        // Audit logging must not block recipe persistence.
        try {
            await logEvent(req, {
                event: 'RECIPE_CREATED',
                level: 'INFO',
                metadata: { recipeId: newRecipe._id, name: newRecipe.name }
            });
        } catch (logError) {
            console.error('RECIPE_CREATED AUDIT ERROR:', logError);
        }

        res.status(201).json({ success: true, recipe: newRecipe });

    } catch (err: any) {
        console.error('CREATE RECIPE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err?.message || 'Server error' });
    }
};

// Get My Recipes
export const getMyRecipes = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        // Guard against missing auth context to avoid unhandled access.
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const recipes = await Recipe.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, recipes });

    } catch (err) {
        console.error('GET RECIPES ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Server error' });
    }
};

// Delete Recipe
export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        // Guard against missing auth context to avoid accidental deletes.
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const deleted = await Recipe.findOneAndDelete({ _id: id, userId });

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Recipe not found or unauthorized' });
            return;
        }

        res.status(200).json({ success: true, message: 'Recipe deleted' });

    } catch (err) {
        console.error('DELETE RECIPE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Server error' });
    }
};
