'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdminUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status with the new API
    const checkAuthStatus = async () => {
      try {
        console.log('AuthContext: Checking authentication status...');
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });

        console.log('AuthContext: Verify response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('AuthContext: Verify response data:', data);
          
          if (data.authenticated && data.user) {
            // Create user object compatible with existing interface
            const userData = {
              id: data.user.userId || 'admin',
              email: data.user.email,
              first_name: 'Admin',
              last_name: 'User',
              role: data.user.role,
              is_active: true,
              is_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            console.log('AuthContext: Created user data:', userData);
            console.log('AuthContext: Is admin check:', isAdmin(userData));
            
            if (isAdmin(userData)) {
              setUser(userData);
              console.log('AuthContext: User set successfully');
            } else {
              console.log('AuthContext: User is not admin, clearing user');
              setUser(null);
            }
          } else {
            console.log('AuthContext: Not authenticated or no user data');
            setUser(null);
          }
        } else {
          console.log('AuthContext: Verify request failed with status:', response.status);
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Error checking auth status:', error);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const isAdmin = (user: User | null): boolean => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Login failed' };
      }

      if (data.success && data.user) {
        // Create user object compatible with existing interface
        const userData = {
          id: 'admin',
          email: data.user.email,
          first_name: 'Admin',
          last_name: 'User',
          role: data.user.role,
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        if (isAdmin(userData)) {
          setUser(userData);
          return {};
        } else {
          return { error: 'Access denied. Admin privileges required.' };
        }
      }

      return { error: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setUser(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdminUser: isAdmin(user),
  };

  return (
    <AuthContext.Provider value={value}>
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