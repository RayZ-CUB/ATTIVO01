import { create } from 'zustand';
import { coachService } from '../services/coachService';
import type {
  CoachProfile,
  CoachFilters,
  PlayerProfile,
  SkillLevel,
  PlayStyle,
  AvailabilityStatus,
} from '../types';

interface CoachState {
  coaches: CoachProfile[];
  filteredCoaches: CoachProfile[];
  bestMatches: CoachProfile[];
  selectedCoach: CoachProfile | null;
  activeFilters: CoachFilters;
  isLoading: boolean;
  error: string | null;

  fetchCoaches: (sport?: string) => Promise<void>;
  applyFilters: (filters: CoachFilters) => void;
  computeBestMatches: (player: PlayerProfile) => void;
  clearFilters: () => void;
  selectCoach: (coach: CoachProfile | null) => void;
}

/**
 * Score a coach based on compatibility with a player profile.
 * 
 * Scoring breakdown:
 * - Skill level compatibility: 0-40 points
 * - Play style preference matching: 0-30 points
 * - Availability weighting: 0-30 points
 * 
 * Maximum score: 100 points
 */
function scoreCoach(coach: CoachProfile, player: PlayerProfile): number {
  let score = 0;

  // 1. Skill level compatibility (0–40 points)
  //    Coach must coach the player's skill level to score here.
  //    Exact match = 40, adjacent level = 20, non-match = 0.
  const skillOrder: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'competitive'];
  const playerIdx = skillOrder.indexOf(player.skillLevel);
  const coachLevels = coach.skillLevelsCoached.map(l => skillOrder.indexOf(l));
  const minDistance = Math.min(...coachLevels.map(i => Math.abs(i - playerIdx)));
  if (minDistance === 0) score += 40;
  else if (minDistance === 1) score += 20;

  // 2. Play style preference matching (0–30 points)
  //    Coaches who list the player's preferred play style in their speciality score higher.
  //    Simple heuristic: check if speciality string contains 'singles', 'doubles', or is generic.
  const styleKeywords: Record<PlayStyle, string[]> = {
    singles: ['singles', 'competitive', 'tournament'],
    doubles: ['doubles', 'team', 'group'],
    both: ['all', 'general', 'comprehensive'],
  };
  const keywords = styleKeywords[player.playStyle];
  const specialityLower = coach.speciality.toLowerCase();
  if (keywords.some(k => specialityLower.includes(k))) score += 30;
  else score += 10; // partial credit for any coach

  // 3. Availability weighting (0–30 points)
  //    'available' = 30, 'limited' = 15, 'unavailable' = 0
  const availabilityScore: Record<AvailabilityStatus, number> = {
    available: 30,
    limited: 15,
    unavailable: 0,
  };
  score += availabilityScore[coach.availabilityStatus];

  return score; // max 100
}

/**
 * Apply filters to a list of coaches.
 * Filters are applied client-side for better performance.
 */
function applyFiltersToCoaches(coaches: CoachProfile[], filters: CoachFilters): CoachProfile[] {
  return coaches.filter(coach => {
    // Filter by skill level
    if (filters.skillLevel && !coach.skillLevelsCoached.includes(filters.skillLevel)) {
      return false;
    }

    // Filter by speciality (case-insensitive substring match)
    if (filters.speciality) {
      const specialityLower = coach.speciality.toLowerCase();
      const filterLower = filters.speciality.toLowerCase();
      if (!specialityLower.includes(filterLower)) {
        return false;
      }
    }

    // Filter by max rate (coach's minimum rate must be within budget)
    if (filters.maxRate !== undefined && coach.rateMin > filters.maxRate) {
      return false;
    }

    return true;
  });
}

export const useCoachStore = create<CoachState>((set, get) => ({
  coaches: [],
  filteredCoaches: [],
  bestMatches: [],
  selectedCoach: null,
  activeFilters: {},
  isLoading: false,
  error: null,

  fetchCoaches: async (sport = 'tennis') => {
    set({ isLoading: true, error: null });
    try {
      const coaches = await coachService.getCoaches({ sport });
      set({ 
        coaches, 
        filteredCoaches: coaches,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch coaches',
        isLoading: false 
      });
    }
  },

  applyFilters: (filters: CoachFilters) => {
    const { coaches } = get();
    const filteredCoaches = applyFiltersToCoaches(coaches, filters);
    set({ 
      activeFilters: filters,
      filteredCoaches 
    });
  },

  computeBestMatches: (player: PlayerProfile) => {
    const { coaches } = get();
    
    // Score all coaches
    const scoredCoaches = coaches.map(coach => ({
      coach,
      score: scoreCoach(coach, player),
    }));

    // Sort by score descending
    scoredCoaches.sort((a, b) => b.score - a.score);

    // Take top 3
    const bestMatches = scoredCoaches.slice(0, 3).map(item => item.coach);

    set({ bestMatches });
  },

  clearFilters: () => {
    const { coaches } = get();
    set({ 
      activeFilters: {},
      filteredCoaches: coaches 
    });
  },

  selectCoach: (coach: CoachProfile | null) => {
    set({ selectedCoach: coach });
  },
}));
