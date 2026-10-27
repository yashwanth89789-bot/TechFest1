import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, setStoredToken, getStoredToken } from '../lib/api.ts';
import { useToast } from './ToastContext.tsx';

export interface UserProfile {
  id: string;
  college?: string | null;
  department?: string | null;
  graduationYear?: number | null;
  studentIdNumber?: string | null;
  phoneNumber?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  skills?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ORGANIZER' | 'ADMIN';
  avatarUrl?: string | null;
  profile?: UserProfile | null;
  unreadNotificationsCount?: number;
  totalRegistrationsCount?: number;
  certificatesCount?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (role: 'STUDENT' | 'ORGANIZER' | 'ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refreshProfile = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setStoredToken(data.token);
      setUser(data.user);
      showToast('success', `Welcome back, ${data.user.name}!`);
    } catch (err: any) {
      showToast('error', 'Login Failed', err.message || 'Please check your credentials.');
      throw err;
    }
  };

  const register = async (formData: any) => {
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setStoredToken(data.token);
      setUser(data.user);
      showToast('success', 'Account Created!', 'Welcome to TechFest Hub.');
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setUser(null);
      showToast('info', 'Signed out', 'You have been safely signed out.');
    }
  };

  const loginAsDemo = async (role: 'STUDENT' | 'ORGANIZER' | 'ADMIN') => {
    const demoCredentials = {
      STUDENT: { email: 'alex.student@college.edu', password: 'Password123!' },
      ORGANIZER: { email: 'sarah.organizer@college.edu', password: 'Password123!' },
      ADMIN: { email: 'admin@college.edu', password: 'Password123!' },
    };

    const creds = demoCredentials[role];
    await login(creds.email, creds.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
