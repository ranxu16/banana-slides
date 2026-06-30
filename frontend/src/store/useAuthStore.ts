import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/api/client';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  is_admin: boolean;
  is_active: boolean;
  project_count?: number;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (username: string, password: string) => {
        const res = await apiClient.post('/api/auth/login', { username, password });
        const { token, user } = res.data.data;
        set({ token, user });
      },

      register: async (username: string, password: string, email?: string) => {
        const res = await apiClient.post('/api/auth/register', { username, password, email });
        const { token, user } = res.data.data;
        set({ token, user });
      },

      logout: () => {
        set({ token: null, user: null });
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await apiClient.get('/api/auth/me');
          set({ user: res.data.data });
        } catch {
          // token 失效时自动登出
          set({ token: null, user: null });
        }
      },
    }),
    {
      name: 'banana-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
