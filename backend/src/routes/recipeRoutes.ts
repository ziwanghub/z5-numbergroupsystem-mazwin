
import express from 'express';
import { createRecipe, getMyRecipes, deleteRecipe, updateRecipe, getTrash, restoreRecipe, hardDeleteRecipe } from '../controllers/recipeController';
import authMiddleware from '../middleware/authMiddleware';
import { verifyTenant } from '../middleware/tenantMiddleware';

const router = express.Router();

// Validates Auth Token & Tenant Isolation for all recipe routes
router.use(authMiddleware);
router.use(verifyTenant); // [NEW] Enforce Tenancy

router.post('/', createRecipe);
router.get('/', getMyRecipes);
router.delete('/:id', deleteRecipe);

// [NEW] Trash Management
router.get('/trash', getTrash);
router.post('/:id/restore', restoreRecipe);
router.delete('/:id/hard', hardDeleteRecipe);

// [NEW] Route for updating
router.put('/:id', updateRecipe);

export default router;
