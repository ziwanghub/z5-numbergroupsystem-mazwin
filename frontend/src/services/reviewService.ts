import api from './api';

export const reviewService = {
    createReview: async (data: { recipeId: string; rating: number; comment?: string }) => {
        try {
            const response = await api.post('/reviews', data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    },

    getReviews: async (recipeId?: string) => {
        try {
            const response = await api.get('/reviews', { params: { recipeId } });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    }
};
