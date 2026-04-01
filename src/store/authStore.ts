'use client';
import { create } from 'zustand';
import type { SafeUser } from '@/types';

interface AuthStore {
  user: SafeUser | null;
  isAuthenticated: boolean;
  setUser: (user: SafeUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
