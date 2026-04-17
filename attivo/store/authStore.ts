import { create } from 'zustand';
import { authService } from '../services/authService';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    await authService.signOut();
    set({ user: null, role: null, isAuthenticated: false });
  },
}));
