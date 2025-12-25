import axios from 'axios';
const API_URL = 'http://localhost:5001/api/v1/auth';
axios.defaults.withCredentials = true;

export interface User { id: string; username: string; role: string; }
export interface AuthResponse { success: boolean; user?: User; message?: string; error?: string; }

export const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        try {
            const response = await axios.post<AuthResponse>(`${API_URL}/login`, { username, password });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { success: false, message: 'Connection Failed' };
        }
    },
    logout: async (): Promise<void> => { await axios.post(`${API_URL}/logout`); },
    getMe: async (): Promise<AuthResponse> => { const response = await axios.get<AuthResponse>(`${API_URL}/me`); return response.data; }
};
