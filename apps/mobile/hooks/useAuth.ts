import { useAuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';

/**
 * Convenience hook that returns the full auth context value.
 *
 * Usage:
 *   const { user, isLoading, isAuthenticated, login, register, logout } = useAuth();
 *
 * Must be called within a component that is a descendant of <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  return useAuthContext();
}
