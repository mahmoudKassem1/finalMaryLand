import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  street?: string;
  city?: string;
  aptNumber?: string;
  addresses?: Array<{
    _id: string;
    street: string;
    city: string;
    aptNumber?: string;
    phone?: string;
    isDefault?: boolean;
  }>;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'maryland_client_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveToken = async (newToken: string | null) => {
    if (newToken) {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, newToken);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      }
    } else {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    }
    setToken(newToken);
  };

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setUser(response.data);
    } catch (err) {
      console.warn('Invalid session, logging out...');
      await saveToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let storedToken: string | null = null;
        if (Platform.OS === 'web') {
          storedToken = localStorage.getItem(TOKEN_KEY);
        } else {
          storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        }

        if (storedToken) {
          setToken(storedToken);
          // Set authorization header explicitly for the initial profile check
          apiClient.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
          await fetchProfile();
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token: receivedToken } = response.data;
    await saveToken(receivedToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${receivedToken}`;
    await fetchProfile();
  };

  const signup = async (userData: { name: string; email: string; password: string; phone?: string }) => {
    const response = await apiClient.post('/auth/signup', userData);
    const { token: receivedToken } = response.data;
    await saveToken(receivedToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${receivedToken}`;
    await fetchProfile();
  };

  const logout = async () => {
    await saveToken(null);
    delete apiClient.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};