# CoachStore Implementation

## Overview

The `coachStore.ts` implements a Zustand store for managing coach data, filtering, and best match computation for the ATTIVO tennis platform.

## State Structure

```typescript
interface CoachState {
  coaches: CoachProfile[];           // All fetched coaches
  filteredCoaches: CoachProfile[];   // Coaches after applying filters
  bestMatches: CoachProfile[];       // Top 3 best matches for a player
  selectedCoach: CoachProfile | null; // Currently selected coach
  activeFilters: CoachFilters;       // Currently active filters
  isLoading: boolean;                // Loading state
  error: string | null;              // Error message
}
```

## Actions

### `fetchCoaches(sport?: string)`
- Fetches coaches from the backend via `coachService.getCoaches()`
- Populates both `coaches` and `filteredCoaches` arrays
- Handles loading and error states
- Default sport: 'tennis'

### `applyFilters(filters: CoachFilters)`
- Applies client-side filtering to the `coaches` array
- Supported filters:
  - `skillLevel`: Filters coaches who coach this skill level
  - `speciality`: Case-insensitive substring match on coach speciality
  - `maxRate`: Filters coaches whose minimum rate is within budget
- Updates `filteredCoaches` and `activeFilters`

### `computeBestMatches(player: PlayerProfile)`
- Scores all coaches based on compatibility with the player
- Scoring algorithm (max 100 points):
  - **Skill level compatibility (0-40 points)**:
    - Exact match: 40 points
    - Adjacent level: 20 points
    - No match: 0 points
  - **Play style matching (0-30 points)**:
    - Keyword match in speciality: 30 points
    - Partial credit: 10 points
  - **Availability weighting (0-30 points)**:
    - Available: 30 points
    - Limited: 15 points
    - Unavailable: 0 points
- Sorts coaches by score (descending)
- Stores top 3 in `bestMatches`

### `clearFilters()`
- Resets `activeFilters` to empty object
- Restores `filteredCoaches` to show all coaches

### `selectCoach(coach: CoachProfile | null)`
- Sets or clears the selected coach
- Used for coach detail views

## Scoring Algorithm Details

The scoring algorithm is implemented in the `scoreCoach()` function:

```typescript
function scoreCoach(coach: CoachProfile, player: PlayerProfile): number
```

### Skill Level Compatibility (0-40 points)

The algorithm uses a skill level order: `['beginner', 'intermediate', 'advanced', 'competitive']`

- Calculates the minimum distance between the player's skill level and the coach's coached levels
- Distance 0 (exact match): 40 points
- Distance 1 (adjacent level): 20 points
- Distance > 1: 0 points

### Play Style Matching (0-30 points)

Uses keyword matching based on player's play style:
- **Singles**: Keywords: 'singles', 'competitive', 'tournament'
- **Doubles**: Keywords: 'doubles', 'team', 'group'
- **Both**: Keywords: 'all', 'general', 'comprehensive'

If any keyword matches the coach's speciality (case-insensitive): 30 points
Otherwise: 10 points (partial credit)

### Availability Weighting (0-30 points)

Direct mapping:
- `available`: 30 points
- `limited`: 15 points
- `unavailable`: 0 points

## Usage Example

```typescript
import { useCoachStore } from './store/coachStore';

function ConnectScreen() {
  const {
    filteredCoaches,
    bestMatches,
    isLoading,
    error,
    fetchCoaches,
    applyFilters,
    computeBestMatches,
    clearFilters,
  } = useCoachStore();

  useEffect(() => {
    fetchCoaches('tennis');
  }, []);

  useEffect(() => {
    if (playerProfile) {
      computeBestMatches(playerProfile);
    }
  }, [playerProfile]);

  const handleFilterChange = (filters: CoachFilters) => {
    applyFilters(filters);
  };

  return (
    <View>
      {/* Best Matches Section */}
      <BestMatchSection coaches={bestMatches} />
      
      {/* Filters */}
      <CoachFilters onFilterChange={handleFilterChange} />
      
      {/* Coach List */}
      {filteredCoaches.map(coach => (
        <CoachCard key={coach.id} coach={coach} />
      ))}
    </View>
  );
}
```

## Requirements Satisfied

- **Requirement 1.6**: State management using Zustand
- **Requirement 5.2**: Filter controls for skill level, speciality, and max rate
- **Requirement 5.3**: Best Match section showing top 3 coaches
- **Requirement 5.6**: Coach profile selection

## Implementation Notes

1. **Client-side filtering**: Filters are applied client-side for better performance and immediate feedback
2. **Separation of concerns**: Filtering and best match computation are independent operations
3. **Type safety**: Full TypeScript typing for all state and actions
4. **Error handling**: Graceful error handling with user-friendly error messages
5. **Sport-agnostic**: Supports filtering by sport for future multi-sport expansion

## Testing

The implementation has been verified for:
- ✓ TypeScript compilation (no errors)
- ✓ All required state properties and actions exist
- ✓ Filter logic works correctly for all filter types
- ✓ Best match scoring algorithm produces correct results
- ✓ Clear filters resets state properly
- ✓ Select coach updates state correctly

## Future Enhancements

Potential improvements for future iterations:
1. Add caching layer for fetched coaches
2. Implement optimistic updates for better UX
3. Add pagination for large coach lists
4. Add sorting options (by rate, experience, rating)
5. Add search functionality
6. Persist filters in local storage
