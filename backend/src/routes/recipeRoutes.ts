import express from 'express';
import { createRecipe, getMyRecipes, deleteRecipe } from '../controllers/recipeController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Validates Auth Token for all recipe routes
router.use(authMiddleware);

router.post('/', createRecipe);
router.get('/', getMyRecipes);
router.delete('/:id', deleteRecipe);

export default router;
