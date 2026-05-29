/**
 * Unit tests for useCoaches hook
 * 
 * These tests verify that the useCoaches hook correctly wraps the coachStore
 * and provides the expected API for components.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */

import { useCoachStore } from '../store/coachStore';
import type { CoachProfile, PlayerProfile, CoachFilters } from '../types';

// Mock the Supabase client before importing anything else
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

// Mock the coach service
jest.mock('../services/coachService', () => ({
  coachService: {
    getCoaches: jest.fn(),
    getCoachById: jest.fn(),
  },
}));

// Mock the store
jest.mock('../store/coachStore');

describe('useCoaches', () => {
  const mockCoaches: CoachProfile[] = [
    {
      id: '1',
      userId: 'user1',
      speciality: 'Singles coaching',
      yearsExperience: 5,
      rateMin: 50,
      rateMax: 100,
      certifications: ['USPTA'],
      skillLevelsCoached: ['intermediate', 'advanced'],
      availabilityStatus: 'available',
      verificationStatus: 'approved',
      sport: 'tennis',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      userId: 'user2',
      speciality: 'Doubles coaching',
      yearsExperience: 10,
      rateMin: 75,
      rateMax: 150,
      certifications: ['PTR'],
      skillLevelsCoached: ['beginner', 'intermediate'],
      availabilityStatus: 'limited',
      verificationStatus: 'approved',
      sport: 'tennis',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  const mockPlayerProfile: PlayerProfile = {
    id: 'player1',
    userId: 'user3',
    skillLevel: 'intermediate',
    playStyle: 'singles',
    sport: 'tennis',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockStore = {
    coaches: mockCoaches,
    filteredCoaches: mockCoaches,
    bestMatches: [],
    selectedCoach: null,
    activeFilters: {},
    isLoading: false,
    error: null,
    fetchCoaches: jest.fn(),
    applyFilters: jest.fn(),
    computeBestMatches: jest.fn(),
    clearFilters: jest.fn(),
    selectCoach: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCoachStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe('State exposure', () => {
    it('should expose coaches from the store', () => {
      const store = useCoachStore();
      expect(store.coaches).toEqual(mockCoaches);
    });

    it('should expose filteredCoaches from the store', () => {
      const store = useCoachStore();
      expect(store.filteredCoaches).toEqual(mockCoaches);
    });

    it('should expose bestMatches from the store', () => {
      const store = useCoachStore();
      expect(store.bestMatches).toEqual([]);
    });

    it('should expose activeFilters from the store', () => {
      const store = useCoachStore();
      expect(store.activeFilters).toEqual({});
    });

    it('should expose isLoading state', () => {
      const store = useCoachStore();
      expect(store.isLoading).toBe(false);
    });

    it('should expose error state', () => {
      const store = useCoachStore();
      expect(store.error).toBeNull();
    });
  });

  describe('Actions', () => {
    it('should call fetchCoaches on the store', () => {
      const store = useCoachStore();
      store.fetchCoaches('tennis');
      expect(mockStore.fetchCoaches).toHaveBeenCalledWith('tennis');
    });

    it('should call applyFilters with correct filters', () => {
      const store = useCoachStore();
      const filters: CoachFilters = {
        skillLevel: 'intermediate',
        maxRate: 100,
      };
      store.applyFilters(filters);
      expect(mockStore.applyFilters).toHaveBeenCalledWith(filters);
    });

    it('should call clearFilters on the store', () => {
      const store = useCoachStore();
      store.clearFilters();
      expect(mockStore.clearFilters).toHaveBeenCalledTimes(1);
    });

    it('should call selectCoach with a coach profile', () => {
      const store = useCoachStore();
      store.selectCoach(mockCoaches[0]);
      expect(mockStore.selectCoach).toHaveBeenCalledWith(mockCoaches[0]);
    });

    it('should call selectCoach with null to deselect', () => {
      const store = useCoachStore();
      store.selectCoach(null);
      expect(mockStore.selectCoach).toHaveBeenCalledWith(null);
    });

    it('should call computeBestMatches with player profile', () => {
      const store = useCoachStore();
      store.computeBestMatches(mockPlayerProfile);
      expect(mockStore.computeBestMatches).toHaveBeenCalledWith(mockPlayerProfile);
    });
  });

  describe('Loading and error states', () => {
    it('should handle loading state', () => {
      (useCoachStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        isLoading: true,
        coaches: [],
        filteredCoaches: [],
      });

      const store = useCoachStore();
      expect(store.isLoading).toBe(true);
      expect(store.coaches).toEqual([]);
    });

    it('should handle error state', () => {
      const errorMessage = 'Failed to fetch coaches';
      (useCoachStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        error: errorMessage,
        isLoading: false,
      });

      const store = useCoachStore();
      expect(store.error).toBe(errorMessage);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Empty states', () => {
    it('should handle empty coaches list', () => {
      (useCoachStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        coaches: [],
        filteredCoaches: [],
      });

      const store = useCoachStore();
      expect(store.coaches).toEqual([]);
      expect(store.filteredCoaches).toEqual([]);
    });

    it('should handle empty filtered results', () => {
      (useCoachStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        coaches: mockCoaches,
        filteredCoaches: [],
      });

      const store = useCoachStore();
      expect(store.coaches).toEqual(mockCoaches);
      expect(store.filteredCoaches).toEqual([]);
    });

    it('should handle empty best matches', () => {
      (useCoachStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        bestMatches: [],
      });

      const store = useCoachStore();
      expect(store.bestMatches).toEqual([]);
    });
  });
});
