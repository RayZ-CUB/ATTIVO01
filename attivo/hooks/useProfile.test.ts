import { playerService } from '../services/playerService';
import { coachService } from '../services/coachService';
import type { PlayerProfile, CoachProfile, User } from '../types';

// Mock the supabase client first
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock the services
jest.mock('../services/playerService');
jest.mock('../services/coachService');
jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile fetching logic', () => {
    it('should fetch player profile when role is player', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'player@test.com',
        displayName: 'Test Player',
        role: 'player',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockPlayerProfile: PlayerProfile = {
        id: 'player-profile-123',
        userId: 'user-123',
        skillLevel: 'intermediate',
        playStyle: 'singles',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (playerService.getPlayer as jest.Mock).mockResolvedValue(mockPlayerProfile);

      const result = await playerService.getPlayer(mockUser.id);

      expect(playerService.getPlayer).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockPlayerProfile);
    });

    it('should fetch coach profile when role is coach', async () => {
      const mockUser: User = {
        id: 'user-456',
        email: 'coach@test.com',
        displayName: 'Test Coach',
        role: 'coach',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockCoachProfile: CoachProfile = {
        id: 'coach-profile-456',
        userId: 'user-456',
        speciality: 'Singles',
        yearsExperience: 5,
        rateMin: 50,
        rateMax: 100,
        certifications: ['USPTA'],
        skillLevelsCoached: ['beginner', 'intermediate'],
        availabilityStatus: 'available',
        verificationStatus: 'approved',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (coachService.getCoachByUserId as jest.Mock).mockResolvedValue(mockCoachProfile);

      const result = await coachService.getCoachByUserId(mockUser.id);

      expect(coachService.getCoachByUserId).toHaveBeenCalledWith('user-456');
      expect(result).toEqual(mockCoachProfile);
    });
  });

  describe('Profile update logic', () => {
    it('should update player profile', async () => {
      const userId = 'user-123';
      const updateInput = {
        skillLevel: 'advanced' as const,
        playStyle: 'both' as const,
      };

      const updatedProfile: PlayerProfile = {
        id: 'player-profile-123',
        userId: 'user-123',
        skillLevel: 'advanced',
        playStyle: 'both',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      };

      (playerService.updatePlayer as jest.Mock).mockResolvedValue(updatedProfile);

      const result = await playerService.updatePlayer(userId, updateInput);

      expect(playerService.updatePlayer).toHaveBeenCalledWith(userId, updateInput);
      expect(result.skillLevel).toBe('advanced');
      expect(result.playStyle).toBe('both');
    });

    it('should update coach profile', async () => {
      const userId = 'user-456';
      const updateInput = {
        speciality: 'Doubles',
        rateMin: 60,
        rateMax: 120,
      };

      const updatedProfile: CoachProfile = {
        id: 'coach-profile-456',
        userId: 'user-456',
        speciality: 'Doubles',
        yearsExperience: 5,
        rateMin: 60,
        rateMax: 120,
        certifications: ['USPTA'],
        skillLevelsCoached: ['beginner', 'intermediate'],
        availabilityStatus: 'available',
        verificationStatus: 'approved',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      };

      (coachService.updateCoach as jest.Mock).mockResolvedValue(updatedProfile);

      const result = await coachService.updateCoach(userId, updateInput);

      expect(coachService.updateCoach).toHaveBeenCalledWith(userId, updateInput);
      expect(result.speciality).toBe('Doubles');
      expect(result.rateMin).toBe(60);
      expect(result.rateMax).toBe(120);
    });
  });
});
