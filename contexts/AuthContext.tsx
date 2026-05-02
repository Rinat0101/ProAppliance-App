import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { loginUser, loadTokens, clearTokens } from '~/services/auth';
import type { UserRole } from '~/types';
import { mockUser } from '~/data/mockData';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface AuthState {
  isAuthenticated: boolean;
  /** true while checking AsyncStorage on first mount */
  isLoading: boolean;
  error: string | null;
  /**
   * User role — determines which tab layout to show.
   * TODO: map from /api/v1/me response after login.
   */
  role: UserRole;
  /**
   * Current user's ID — used to filter jobs, schedule, etc.
   * TODO: replace mockUser.id with real ID from /api/v1/me response.
   */
  currentUserId: string;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                             */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    // TODO: replace with value from /api/v1/me once login is working
    role: 'technician',
    currentUserId: mockUser.id, // TODO: replace with real user ID from /api/v1/me
  });

  // On mount: check AsyncStorage for a saved session
  useEffect(() => {
    loadTokens().then((tokens) => {
      setState((prev) => ({
        ...prev,
        isAuthenticated: tokens !== null,
        isLoading: false,
      }));
    }).catch(() => {
      setState((prev) => ({ ...prev, isAuthenticated: false, isLoading: false }));
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await loginUser(username, password);
      setState((prev) => ({ ...prev, isAuthenticated: true, isLoading: false, error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, isAuthenticated: false, isLoading: false, error: msg }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setState((prev) => ({ ...prev, isAuthenticated: false, isLoading: false, error: null }));
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
