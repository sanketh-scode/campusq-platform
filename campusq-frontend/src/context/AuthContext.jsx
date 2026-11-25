import React, { createContext, useContext, useState } from 'react';
import { campusqApi } from '../api/apiClient';

const AuthContext = createContext(null);

export function getHomePathForRole(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin';
    case 'ADMIN':
      return '/admin';
    case 'VENDOR':
      return '/vendor';
    case 'STUDENT':
    case 'STAFF':
      return '/student';
    default:
      return '/login';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusq_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const persistSession = (data) => {
    const sessionUser = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      collegeCode: data.collegeCode || null,
      collegeName: data.collegeName || null,
      staffVerified: !!data.staffVerified,
      staffStatusNotice: data.staffStatusNotice || null,
    };
    localStorage.setItem('campusq_token', data.token);
    localStorage.setItem('campusq_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  const login = async (email, password) => {
    const data = await campusqApi.login({ email, password });
    return persistSession(data);
  };

  const loginWithGoogle = async (idToken) => {
    const data = await campusqApi.googleLogin(idToken);
    if (data.needsRegistration) {
      return data;
    }
    return { ...persistSession(data), needsRegistration: false };
  };

  const completeGoogleRegistration = async (payload) => {
    const data = await campusqApi.completeGoogleRegistration(payload);
    return persistSession(data);
  };

  const logout = () => {
    localStorage.removeItem('campusq_token');
    localStorage.removeItem('campusq_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, completeGoogleRegistration, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
