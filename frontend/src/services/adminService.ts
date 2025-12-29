
import axios from 'axios';

const API_URL = '/api/admin';

// Using the same axios instance logic as authService or creating a new one if needed.
// Ensuring we send cookies (auth_token).
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // IMPORTANT: Send HttpOnly Cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface TenantCreationData {
    organizationName: string;
    email: string;
    password: string;
}

export const adminService = {
    // Create new Tenant (Admin)
    createTenant: async (data: TenantCreationData) => {
        try {
            const response = await api.post('/tenants', data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    },

    getTenants: async () => {
        try {
            const response = await api.get('/tenants');
            return response.data.tenants;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    },

    updateTenantStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
        try {
            const response = await api.patch(`/tenants/${id}/status`, { status });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    },

    deleteTenant: async (id: string) => {
        try {
            const response = await api.delete(`/tenants/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    },

    // Placeholder for future methods
    getSystemHealth: async () => {
        // return api.get('/system/health');
    }
};
