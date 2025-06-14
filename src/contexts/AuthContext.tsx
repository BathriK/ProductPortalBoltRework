import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser } from '../services/authService'; // Import loginUser from authService

// Define user roles
export type UserRole = 'stakeholder' | 'product_manager' | 'admin';

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string; // Add passwordHash to the User interface
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loggedInUser = await loginUser(email, password);
      
      if (loggedInUser) {
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setIsLoading(false);
        return true;
      } else {
        // This case should ideally be caught by loginUser throwing an error
        setError('Login failed: User not returned');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('AuthContext: Error during login:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during login');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook to check user permissions
export function usePermissions() {
  const { user } = useAuth();
  
  return {
    canView: !!user, // All logged in users can view content
    canEdit: user?.role === 'product_manager' || user?.role === 'admin',
    canDelete: user?.role === 'admin',
    canDownload: user?.role === 'admin',
    canUpload: user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    isPM: user?.role === 'product_manager',
    isStakeholder: user?.role === 'stakeholder',
  };
}
