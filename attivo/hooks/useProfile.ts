import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { playerService } from '../services/playerService';
import { coachService } from '../services/coachService';
import type { PlayerProfile, CoachProfile, UpdatePlayerInput, UpdateCoachInput } from '../types';

type Profile = PlayerProfile | CoachProfile;

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (input: UpdatePlayerInput | UpdateCoachInput) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, role } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user || !role) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (role === 'player') {
        const playerProfile = await playerService.getPlayer(user.id);
        setProfile(playerProfile);
      } else if (role === 'coach') {
        const coachProfile = await coachService.getCoachByUserId(user.id);
        setProfile(coachProfile);
      } else {
        // Admin or other roles don't have profiles
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (input: UpdatePlayerInput | UpdateCoachInput) => {
    if (!user || !role || !profile) {
      throw new Error('No user or profile to update');
    }

    try {
      setError(null);

      // Optimistic update
      const previousProfile = profile;
      setProfile({ ...profile, ...input } as Profile);

      if (role === 'player') {
        const updatedProfile = await playerService.updatePlayer(user.id, input as UpdatePlayerInput);
        setProfile(updatedProfile);
      } else if (role === 'coach') {
        const updatedProfile = await coachService.updateCoach(user.id, input as UpdateCoachInput);
        setProfile(updatedProfile);
      }
    } catch (err) {
      // Revert optimistic update on error
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      // Refetch to get the correct state
      await fetchProfile();
      throw err;
    }
  };

  const refetch = async () => {
    await fetchProfile();
  };

  // Fetch profile on mount and when user/role changes
  useEffect(() => {
    fetchProfile();
  }, [user?.id, role]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch,
  };
}
