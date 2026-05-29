import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

/**
 * Custom hook that wraps useAuthStore and provides authentication utilities.
 * 
 * Exposes:
 * - user: Current authenticated user or null
 * - role: User's role (player, coach, admin) or null
 * - isAuthenticated: Boolean indicating if user is logged in
 * - isLoading: Boolean indicating if auth state is being loaded
 * - signOut: Function to sign out and navigate to login
 * 
 * Requirements: 1.6, 2.10
 */
export function useAuth() {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading, signOut: authStoreSignOut } = useAuthStore();

  /**
   * Sign out the current user and navigate to the login screen.
   * Calls authStore.signOut() to clear the session, then redirects to /(auth)/login.
   */
  const signOut = async () => {
    await authStoreSignOut();
    router.replace('/(auth)/login');
  };

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    signOut,
  };
}
