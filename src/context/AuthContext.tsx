import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser, Role } from '@/types';
import * as authService from '@/services/authService';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: Role, hospitalId?: string) => Promise<void>;
  signInWithRole: (role: Role) => Promise<void>;
  signOut: () => void;
  hasAccess: (roles: Role[]) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getCurrentSession());
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string, remember: boolean) {
    const u = await authService.signIn(email, password, remember);
    setUser(u);
  }

  async function signUp(name: string, email: string, password: string, role: Role, hospitalId?: string) {
    const u = await authService.signUp(name, email, password, role, hospitalId);
    setUser(u);
  }

  async function signInWithRole(role: Role) {
    const u = await authService.signInWithRole(role);
    setUser(u);
  }

  function signOut() {
    authService.signOutUser();
    setUser(null);
  }

  function refreshUser() {
    setUser(authService.getCurrentSession());
  }

  function hasAccess(roles: Role[]) {
    if (!user) return false;
    return roles.includes(user.role);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithRole, signOut, hasAccess, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
