import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Use sessionStorage so opening the app starts at the login page unless explicitly logged in in this session
      const token = sessionStorage.getItem('nexus_token');
      if (token) {
        try {
          const res = await authService.getMe();
          setUser(res.user);
        } catch (err) {
          console.error('Session expired or invalid:', err);
          sessionStorage.removeItem('nexus_token');
          sessionStorage.removeItem('nexus_user');
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('nexus_user');
          setUser(null);
        }
      } else {
        // Clear any old persistent tokens to prevent automatic jump into dashboard
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    sessionStorage.setItem('nexus_token', res.token);
    sessionStorage.setItem('nexus_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    sessionStorage.removeItem('nexus_token');
    sessionStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        login,
        logout,
        hasRole,
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
