import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
	token: string | null;
	user: { id: string; role: string } | null;
	role?: string;
	setToken: (token: string | null) => void;
	setUser: (user: { id: string; role: string }) => void;
	setRole: (role: string) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			setRole: (role: string) => {
				if (role) {
					localStorage.setItem("role", role);
				}
				set({ role });
			},
			setToken: (token) => {
				if (token) {
					localStorage.setItem("token", token);
				}
				set({ token });
			},
			setUser: (user) => set({ user }),
			logout: () => {
				localStorage.removeItem("token");
				set({ token: null, user: null });
			},
		}),
		{
			name: "auth-storage",
		}
	)
);
