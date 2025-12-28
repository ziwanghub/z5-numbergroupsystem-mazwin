import api from "./api";

const BASE_PATH = "/api/recipes";

const getConfig = () => {
    return {
        withCredentials: true
    };
};

export const recipeService = {
    // Create new recipe
    createRecipe: async (data: any) => {
        const response = await api.post(BASE_PATH, data, getConfig());
        return response.data;
    },

    // Get my recipes
    getRecipes: async () => {
        const response = await api.get(BASE_PATH, getConfig());
        return response.data.recipes;
    },

    // Delete recipe
    deleteRecipe: async (id: string) => {
        const response = await api.delete(`${BASE_PATH}/${id}`, getConfig());
        return response.data;
    }
};

