import { Request, Response } from 'express';
import Recipe from '../models/Recipe';
import { logEvent } from '../services/auditService';

// Create New Recipe
export const createRecipe = async (req: Request, res: Response) => {
    try {
        const { name, description, baseFormulaId, config, uiOptions } = req.body;
        const userId = (req as any).user.id;

        if (!name || !baseFormulaId || !config) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
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

        await logEvent(req, {
            event: 'RECIPE_CREATED',
            level: 'INFO',
            metadata: { recipeId: newRecipe._id, name: newRecipe.name }
        });

        res.status(201).json({ success: true, recipe: newRecipe });

    } catch (err: any) {
        console.error('CREATE RECIPE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
};

// Get My Recipes
export const getMyRecipes = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const recipes = await Recipe.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, recipes });

    } catch (err) {
        console.error('GET RECIPES ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
};

// Delete Recipe
export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const deleted = await Recipe.findOneAndDelete({ _id: id, userId });

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Recipe not found or unauthorized' });
            return;
        }

        res.status(200).json({ success: true, message: 'Recipe deleted' });

    } catch (err) {
        console.error('DELETE RECIPE ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
};
