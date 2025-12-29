/// <reference types="vite/client" />
// frontend/src/services/recipeService.ts
import axios from 'axios';

// Ensure correct API URL based on environment
// NOTE: Must match what authService uses or what the proxy allows
const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/recipes`
    : 'http://localhost:5001/api/recipes';

// Create dedicated axios instance for Recipes
const api = axios.create({
    baseURL: API_URL,
    // [CRITICAL FIX] Enable sending Cookies (HttpOnly) to backend
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export interface Recipe {
    _id: string;
    name: string;
    description?: string;
    baseFormulaId: string;
    config: any;
    uiOptions?: any;
    isFavorite?: boolean;
    tags?: string[];
    isActive?: boolean;
    deletedAt?: string | null;
    version?: number;
    createdAt?: string;
}

export const recipeService = {
    // 1. Create
    createRecipe: async (recipeData: Partial<Recipe>) => {
        // No need to manually attach token; Cookie handles it.
        const response = await api.post('/', recipeData);
        return response.data;
    },

    // 2. Get All (Active Only)
    getRecipes: async () => {
        const response = await api.get('/');
        return response.data.recipes;
    },

    // 3. Delete (Soft)
    deleteRecipe: async (id: string) => {
        const response = await api.delete(`/${id}`);
        return response.data;
    },

    // 4. Update
    updateRecipe: async (id: string, updates: Partial<Recipe>) => {
        const response = await api.put(`/${id}`, updates);
        return response.data;
    },

    // 5. Toggle Favorite Helper
    toggleFavorite: async (id: string, currentState: boolean) => {
        return recipeService.updateRecipe(id, { isFavorite: !currentState });
    },

    // 6. [NEW] Toggle Active (Circuit Breaker)
    toggleActive: async (id: string, currentState: boolean) => {
        return recipeService.updateRecipe(id, { isActive: !currentState });
    },

    // 7. [NEW] Get Trash
    getTrash: async () => {
        const response = await api.get('/trash');
        return response.data.recipes;
    },

    // 8. [NEW] Restore
    restoreRecipe: async (id: string) => {
        const response = await api.post(`/${id}/restore`);
        return response.data;
    },

    // 9. [NEW] Hard Delete
    hardDeleteRecipe: async (id: string) => {
        const response = await api.delete(`/${id}/hard`);
        return response.data;
    }
};

export default recipeService;