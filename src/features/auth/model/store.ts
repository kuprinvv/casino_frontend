import { create } from 'zustand';
import { AuthAPI } from '@shared/api/auth';
import { apiClient } from '@shared/api/client';

// Тип User согласно API
export interface User {
  login: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (login: string, password: string) => Promise<void>;
  register: (name: string, login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuth: () => void;
}

// Функция для получения пользователя из localStorage
const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('casino_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

// Функция для сохранения пользователя в localStorage
const saveUserToStorage = (user: User | null) => {
  if (user) {
    localStorage.setItem('casino_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('casino_user');
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromStorage(),
  isAuthenticated: apiClient.isAuthenticated() && !!getUserFromStorage(),
  isLoading: false,

  // Вход через API
  login: async (login: string, password: string) => {
    set({ isLoading: true });
    try {
      await AuthAPI.login({ login, password });
      
      const user: User = {
        login,
      };
      
      saveUserToStorage(user);
      
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Регистрация через API
  register: async (name: string, login: string, password: string) => {
    set({ isLoading: true });
    try {
      await AuthAPI.register({ name, login, password });
      
      const user: User = {
        login,
        name,
      };
      
      saveUserToStorage(user);
      
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Выход через API
  logout: async () => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      // Даже если запрос не удался, очищаем состояние на клиенте
      console.error('Logout error:', error);
    } finally {
      saveUserToStorage(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user: User | null) => {
    saveUserToStorage(user);
    set({ user, isAuthenticated: user !== null && apiClient.isAuthenticated() });
  },

  checkAuth: () => {
    const user = getUserFromStorage();
    const isAuth = apiClient.isAuthenticated() && !!user;
    set({ 
      user,
      isAuthenticated: isAuth 
    });
  },
}));

