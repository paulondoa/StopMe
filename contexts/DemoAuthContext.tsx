import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_ACCOUNT, DEFAULT_FRIENDS, authenticateUser, createDemoAccount, DefaultUser } from '@/lib/defaultAuth';

interface DemoAuthContextType {
  user: DefaultUser | null;
  friends: any[];
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const DemoAuthContext = createContext<DemoAuthContextType>({} as DemoAuthContextType);

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DefaultUser | null>(null);
  const [friends] = useState(DEFAULT_FRIENDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login with default account for demo
    setTimeout(() => {
      setUser(DEFAULT_ACCOUNT);
      setLoading(false);
    }, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const authenticatedUser = authenticateUser(email, password);
    
    if (authenticatedUser) {
      setUser(authenticatedUser);
      setLoading(false);
      return { error: null };
    } else {
      setLoading(false);
      return { error: { message: 'Invalid email or password' } };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = createDemoAccount(name, email, password);
    setUser(newUser);
    setLoading(false);
    
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
  };

  return (
    <DemoAuthContext.Provider
      value={{
        user,
        friends,
        signIn,
        signUp,
        signOut,
        loading,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error('useDemoAuth must be used within DemoAuthProvider');
  }
  return context;
};