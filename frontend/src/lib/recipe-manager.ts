import { UserRecipe } from "../models/Recipe";

const STORAGE_KEY = "z5_user_recipes";

// Helper to generate UUIDs (simple version)
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const RecipeManager = {
    // --- Persistence ---

    listRecipes: (): UserRecipe[] => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            return JSON.parse(raw) as UserRecipe[];
        } catch (e) {
            console.error("Failed to load recipes", e);
            return [];
        }
    },

    getRecipe: (id: string): UserRecipe | null => {
        const recipes = RecipeManager.listRecipes();
        return recipes.find(r => r.id === id) || null;
    },

    saveRecipe: (recipe: Partial<UserRecipe>): UserRecipe => {
        const recipes = RecipeManager.listRecipes();
        const now = Date.now();

        if (recipe.id) {
            // Update existing
            const index = recipes.findIndex(r => r.id === recipe.id);
            if (index >= 0) {
                const updated: UserRecipe = {
                    ...recipes[index],
                    ...recipe,
                    updatedAt: now
                } as UserRecipe;
                recipes[index] = updated;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
                return updated;
            }
        }

        // Create new
        const newRecipe: UserRecipe = {
            id: generateId(),
            name: recipe.name || "Untitled Recipe",
            description: recipe.description || "",
            version: 1,
            steps: recipe.steps || [],
            createdAt: now,
            updatedAt: now,
            author: "User",
            tags: [],
            ...recipe
        } as UserRecipe;

        recipes.push(newRecipe);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        return newRecipe;
    },

    deleteRecipe: (id: string): void => {
        const recipes = RecipeManager.listRecipes();
        const filtered = recipes.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    },

    // --- Sharing (Base64) ---

    encodeRecipe: (recipe: UserRecipe): string => {
        try {
            const json = JSON.stringify(recipe);
            return btoa(unescape(encodeURIComponent(json)));
        } catch (e) {
            console.error("Failed to encode recipe", e);
            return "";
        }
    },

    decodeRecipe: (base64Str: string): UserRecipe | null => {
        try {
            const json = decodeURIComponent(escape(atob(base64Str)));
            const recipe = JSON.parse(json);
            // Basic validation
            if (!recipe.steps || !Array.isArray(recipe.steps)) {
                throw new Error("Invalid recipe format");
            }
            return recipe as UserRecipe;
        } catch (e) {
            console.error("Failed to decode recipe", e);
            return null;
        }
    }
};
