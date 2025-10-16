import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface UserData {
  username: string;
  token: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: UserData | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: () => boolean;
  canManageTemplates: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('role');
    
    if (token && username) {
      setUser({ username, token, name: name || undefined, role: role || undefined });
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(username, password);
      const userData: UserData = { 
        username, 
        token: response.token,
        name: response.user?.name,
        role: response.user?.role
      };
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', username);
      if (response.user?.name) {
        localStorage.setItem('name', response.user.name);
      }
      if (response.user?.role) {
        localStorage.setItem('role', response.user.role);
      }
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    setUser(null);
  };

  const isAdmin = (): boolean => {
    // admin y embl son administradores
    const username = user?.username.toUpperCase();
    return username === 'ADMIN' || username === 'EMBL';
  };

  const canManageTemplates = (): boolean => {
    // Solo administradores pueden gestionar plantillas
    return isAdmin();
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAdmin,
    canManageTemplates,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};


