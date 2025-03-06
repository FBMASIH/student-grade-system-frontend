import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
	id: number;
	role: string;
	username?: string;
	firstName?: string;
	lastName?: string;
}

interface AuthState {
	token: string | null;
	user: User | null;
	setToken: (token: string) => void;
	setUser: (user: User) => void;
	setRole: (role: string) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null, // Don't read from localStorage here
			user: null,
			setToken: (token) => {
				if (typeof window !== "undefined") {
					localStorage.setItem("token", token);
				}
				set({ token });
			},
			setUser: (user) => set({ user }),
			setRole: (role) =>
				set((state) => ({
					user: state.user ? { ...state.user, role } : null,
				})),
			logout: () => {
				if (typeof window !== "undefined") {
					localStorage.removeItem("token");
				}
				set({ token: null, user: null });
			},
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => localStorage),
			skipHydration: true, // Add this line
		}
	)
);
