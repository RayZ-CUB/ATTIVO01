import { useEffect } from 'react';
import { useCoachStore } from '../store/coachStore';
import type { CoachFilters, PlayerProfile } from '../types';

/**
 * Custom hook for managing coach listings, filters, and best matches.
 * 
 * This hook wraps the coachStore and provides a clean API for components
 * to interact with coach data. It automatically fetches coaches on mount
 * and exposes all necessary state and actions.
 * 
 * @example
 * ```tsx
 * const {
 *   coaches,
 *   filteredCoaches,
 *   bestMatches,
 *   isLoading,
 *   error,
 *   applyFilters,
 *   clearFilters,
 *   computeBestMatches
 * } = useCoaches();
 * 
 * // Apply filters
 * applyFilters({ skillLevel: 'intermediate', maxRate: 100 });
 * 
 * // Compute best matches for a player
 * computeBestMatches(playerProfile);
 * ```
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */
export function useCoaches(sport: string = 'tennis') {
  const {
    coaches,
    filteredCoaches,
    bestMatches,
    selectedCoach,
    activeFilters,
    isLoading,
    error,
    fetchCoaches,
    applyFilters: storeApplyFilters,
    computeBestMatches: storeComputeBestMatches,
    clearFilters: storeClearFilters,
    selectCoach: storeSelectCoach,
  } = useCoachStore();

  // Fetch coaches on mount
  useEffect(() => {
    fetchCoaches(sport);
  }, [sport, fetchCoaches]);

  // Wrapper functions to maintain clean API
  const applyFilters = (filters: CoachFilters) => {
    storeApplyFilters(filters);
  };

  const clearFilters = () => {
    storeClearFilters();
  };

  const selectCoach = (coach: Parameters<typeof storeSelectCoach>[0]) => {
    storeSelectCoach(coach);
  };

  const computeBestMatches = (player: PlayerProfile) => {
    storeComputeBestMatches(player);
  };

  return {
    // State
    coaches,
    filteredCoaches,
    bestMatches,
    selectedCoach,
    activeFilters,
    isLoading,
    error,
    
    // Actions
    applyFilters,
    clearFilters,
    selectCoach,
    computeBestMatches,
    
    // Utility
    refetch: () => fetchCoaches(sport),
  };
}
