
const USERS_KEY = "z5_users";
const SESSION_KEY = "z5_session";

export interface User {
    id: string;
    username: string; // Used as Email
    displayName: string;
    role: "ADMIN" | "USER" | "SUPER_ADMIN";
    avatarUrl?: string; // Auto-generated initials
    createdAt: number;
}

// Internal interface for storage (includes password)
interface StoredUser extends User {
    passwordHash: string; // Simplified for local demo
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    message?: string;
}

// Helper: Initials Avatar
export const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

export const authService = {
    // 1. REGISTER
    register: async (username: string, password: string, displayName: string): Promise<AuthResponse> => {
        await new Promise(r => setTimeout(r, 800)); // Simulate net lag

        const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

        // Check duplicate
        if (users.find(u => u.username === username)) {
            return { success: false, message: "Email already registered" };
        }

        const newUser: StoredUser = {
            id: crypto.randomUUID(),
            username,
            displayName,
            role: "USER", // Default role
            passwordHash: btoa(password), // Simple encoding for demo (NOT SECURE for prod)
            createdAt: Date.now()
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Auto Login
        localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

        // Return safe user object (no password)
        const { passwordHash, ...safeUser } = newUser;
        return { success: true, user: safeUser };
    },

    // 2. LOGIN
    login: async (username: string, password: string): Promise<AuthResponse> => {
        await new Promise(r => setTimeout(r, 600));

        const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        const encodedPass = btoa(password);

        const user = users.find(u => u.username === username && u.passwordHash === encodedPass);

        if (!user) {
            return { success: false, message: "Invalid email or password" };
        }

        // Set Session
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));

        const { passwordHash, ...safeUser } = user;
        return { success: true, user: safeUser };
    },

    // 3. GET CURRENT SESSION
    getMe: async (): Promise<AuthResponse> => {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) {
            return { success: false, message: "No session" };
        }
        try {
            const user = JSON.parse(sessionStr);
            const { passwordHash, ...safeUser } = user; // Ensure usage of StoredUser doesn't leak if legacy data
            return { success: true, user: safeUser };
        } catch (e) {
            return { success: false, message: "Invalid session" };
        }
    },

    // 4. UPDATE PROFILE
    updateProfile: async (id: string, updates: Partial<{ displayName: string; password: string }>): Promise<AuthResponse> => {
        const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        const index = users.findIndex(u => u.id === id);

        if (index === -1) return { success: false, message: "User not found" };

        const updatedUser = { ...users[index] };

        if (updates.displayName) updatedUser.displayName = updates.displayName;
        if (updates.password) updatedUser.passwordHash = btoa(updates.password);

        users[index] = updatedUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Update Session if it's the current user
        const currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
        if (currentSession.id === id) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
        }

        const { passwordHash, ...safeUser } = updatedUser;
        return { success: true, user: safeUser };
    },

    // 5. LOGOUT
    logout: async (): Promise<void> => {
        localStorage.removeItem(SESSION_KEY);
    }
};
