import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient } from '../lib/api-client';
import { SecureStorage } from '../lib/secure-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserPublic = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
};

type RegisterResponse = LoginResponse;

export type AuthContextValue = {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if we have a stored access token and fetch the current user
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = await SecureStorage.getAccessToken();
        if (!token) return;

        const me = await apiClient.get<UserPublic>('/auth/me');
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        // Token is invalid / expired — clear it so the app routes to login
        await SecureStorage.clearTokens();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      await SecureStorage.setAccessToken(data.accessToken);
      await SecureStorage.setRefreshToken(data.refreshToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setIsLoading(true);
      try {
        const data = await apiClient.post<RegisterResponse>('/auth/register', {
          email,
          password,
          displayName,
        });
        await SecureStorage.setAccessToken(data.accessToken);
        await SecureStorage.setRefreshToken(data.refreshToken);
        setUser(data.user);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Best-effort server-side logout; ignore network errors
      await apiClient.post('/auth/logout').catch(() => undefined);
    } finally {
      await SecureStorage.clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Guard — throws at module boundary if used outside the provider
// ---------------------------------------------------------------------------

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within <AuthProvider>');
  }
  return ctx;
}
