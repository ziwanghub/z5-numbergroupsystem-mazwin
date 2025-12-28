import axios, { AxiosError } from "axios";
import { toast } from "sonner"; // Import Toast

// Environment Variable (configured in .env / .env.local)
const API_URL = "/api/v1";

// Interfaces
export interface User {
    id: string;
    username: string; // Email
    displayName: string;
    role: "ADMIN" | "USER" | "SUPER_ADMIN";
    avatarUrl?: string;
    createdAt: number;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    message?: string;
}

// Helper: Initials Avatar
export const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

// Axios Instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Critical: Send/Receive Cookies
});

// Response Interceptor: Handle 401 (Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Trigger generic session expired toast (debounce if needed, but simple for now)
            // We check only if it's NOT a login attempt (login 401 is handled by local try/catch with specific msg)
            if (!error.config.url.includes('/login')) {
                toast.error("Session expired. Please login again.");
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    // 1. REGISTER
    register: async (username: string, password: string, displayName: string): Promise<AuthResponse> => {
        try {
            const { data } = await api.post<AuthResponse>("/auth/register", {
                email: username, // Backend likely expects "email"
                password,
                displayName,
                username // Sending both just in case
            });
            return data;
        } catch (error) {
            return handleAxiosError(error);
        }
    },

    // 2. LOGIN
    login: async (username: string, password: string): Promise<AuthResponse> => {
        try {
            const { data } = await api.post<AuthResponse>("/auth/login", {
                username,
                password,
            });
            return data;
        } catch (error) {
            return handleAxiosError(error);
        }
    },

    // 3. GET CURRENT SESSION
    getMe: async (): Promise<AuthResponse> => {
        try {
            // Always call API. Cookie will be sent automatically.
            const { data } = await api.get<AuthResponse>("/auth/me");
            return data;
        } catch (error) {
            // 401/403 means not logged in
            return handleAxiosError(error);
        }
    },

    // 4. UPDATE PROFILE
    updateProfile: async (id: string, updates: Partial<{ displayName: string; password: string }>): Promise<AuthResponse> => {
        try {
            const { data } = await api.put<AuthResponse>(`/users/${id}`, updates);
            return data;
        } catch (error) {
            return handleAxiosError(error);
        }
    },

    // 5. LOGOUT
    logout: async (): Promise<void> => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout error", error);
        }
    },

    // 6. CHECK EMAIL
    checkEmail: async (email: string): Promise<{ available: boolean }> => {
        try {
            const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
            return data;
        } catch (error) {
            // If error, assume available to not block, or handle strictly.
            return { available: true };
        }
    }
};

// Helper Error Handler
function handleAxiosError(error: unknown): AuthResponse {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || "Request failed";
        return { success: false, message };
    }
    return { success: false, message: "An unexpected error occurred" };
}

export default authService;

