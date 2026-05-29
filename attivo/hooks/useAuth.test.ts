import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

// Mock Supabase client before any imports
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

// Mock dependencies
jest.mock('../store/authStore');
jest.mock('expo-router');

describe('useAuth', () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  const mockAuthStore = {
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: false,
    signOut: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockAuthStore);
  });

  it('should expose user, role, isAuthenticated, and isLoading from authStore', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'player' as const,
      sport: 'tennis',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      ...mockAuthStore,
      user: mockUser,
      role: 'player',
      isAuthenticated: true,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.role).toBe('player');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should call authStore.signOut and navigate to login on signOut', async () => {
    const mockSignOut = jest.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      ...mockAuthStore,
      signOut: mockSignOut,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('should handle loading state correctly', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      ...mockAuthStore,
      isLoading: true,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle unauthenticated state correctly', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      ...mockAuthStore,
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
