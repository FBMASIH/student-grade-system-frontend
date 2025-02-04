import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'student' | 'teacher' | 'admin' | null;

interface AuthState {
  token: string | null;
  role: UserRole;
  setToken: (token: string | null) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        }
        set({ token });
      },
      setRole: (role) => set({ role }),
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, role: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
