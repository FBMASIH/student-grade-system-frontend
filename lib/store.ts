import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
	token: string | null;
	role: "student" | "teacher" | "admin" | null;
	setToken: (token: string | null) => void;
	setRole: (role: "student" | "teacher" | "admin" | null) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			role: null,
			setToken: (token) => set({ token }),
			setRole: (role) => set({ role }),
			logout: () => set({ token: null, role: null }),
		}),
		{ name: "auth-storage" }
	)
);
