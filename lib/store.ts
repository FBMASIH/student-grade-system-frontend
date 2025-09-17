import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

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
        hydrated: boolean;
        setToken: (token: string) => void;
        setUser: (user: User) => void;
        setRole: (role: string) => void;
        logout: () => void;
        setHydrated: (value: boolean) => void;
}

const noopStorage: StateStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
};

export const useAuthStore = create<AuthState>()(
        persist(
                (set) => ({
                        token: null, // Don't read from localStorage here
                        user: null,
                        hydrated: false,
                        setToken: (token) => {
                                if (typeof window !== "undefined") {
                                        localStorage.setItem("token", token);
                                }
                                set({ token, hydrated: true });
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
                                set({ token: null, user: null, hydrated: true });
                        },
                        setHydrated: (value) => set({ hydrated: value }),
                }),
                {
                        name: "auth-storage",
                        storage: createJSONStorage(() =>
                                typeof window === "undefined" ? noopStorage : localStorage
                        ),
                        onRehydrateStorage: () => (state, error) => {
                                if (error) {
                                        if (typeof window !== "undefined") {
                                                localStorage.removeItem("token");
                                        }
                                        state?.logout?.();
                                        state?.setHydrated?.(true);
                                        return;
                                }

                                state?.setHydrated?.(true);

                                if (state?.token && typeof window !== "undefined") {
                                        localStorage.setItem("token", state.token);
                                }
                        },
                }
        )
);
