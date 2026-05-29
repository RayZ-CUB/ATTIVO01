# useProfile Hook Implementation

## Overview
Implemented the `useProfile` custom hook that manages fetching and updating user profiles (player or coach) based on the authenticated user's role.

## Files Created/Modified

### Created:
1. **hooks/useProfile.ts** - Main hook implementation
2. **hooks/useProfile.test.ts** - Unit tests for the hook
3. **__mocks__/@react-native-async-storage/async-storage.js** - Mock for AsyncStorage to support testing

### Modified:
1. **services/coachService.ts** - Added `getCoachByUserId()` method to fetch coach profile by user ID
2. **jest.config.js** - Updated to support testing hooks and handle React Native module mocks

## Implementation Details

### useProfile Hook Features

The hook provides the following functionality:

1. **Automatic Profile Fetching**
   - Fetches the appropriate profile (player or coach) on mount
   - Re-fetches when user or role changes
   - Handles loading and error states

2. **Profile Type Detection**
   - Uses `authStore.role` to determine whether to fetch player or coach profile
   - Returns `null` for admin or other roles that don't have profiles

3. **Optimistic Updates**
   - Updates local state immediately when `updateProfile` is called
   - Reverts to previous state if the update fails
   - Re-fetches profile after failed update to ensure consistency

4. **Error Handling**
   - Captures and exposes errors from service calls
   - Provides user-friendly error messages

### API

```typescript
interface UseProfileReturn {
  profile: Profile | null;        // Current user's profile (PlayerProfile | CoachProfile)
  isLoading: boolean;             // Loading state
  error: string | null;           // Error message if any
  updateProfile: (input) => Promise<void>;  // Update profile with optimistic updates
  refetch: () => Promise<void>;   // Manually refetch profile
}
```

### Service Layer Enhancement

Added `getCoachByUserId()` method to `coachService.ts`:
- Fetches coach profile by user ID (not coach profile ID)
- Mirrors the pattern used in `playerService.getPlayer()`
- Returns `null` if coach not found

## Testing

Created comprehensive unit tests covering:
- Player profile fetching
- Coach profile fetching
- Player profile updates
- Coach profile updates

All tests pass successfully.

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **8.1**: Profile screen displays user's display name, role badge, and location
- **8.5**: Profile screen allows editing of display name, location, and role-specific details
- **8.6**: Profile edits are persisted via Service Layer with immediate UI updates (optimistic)
- **8.7**: Profile data is read/written exclusively through Service Layer using typed interfaces

## Usage Example

```typescript
import { useProfile } from '../hooks/useProfile';

function ProfileScreen() {
  const { profile, isLoading, error, updateProfile } = useProfile();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!profile) return <EmptyState message="No profile found" />;

  const handleUpdate = async (updates) => {
    try {
      await updateProfile(updates);
      // Profile updated successfully
    } catch (err) {
      // Handle error
    }
  };

  return (
    <View>
      {/* Render profile based on type */}
    </View>
  );
}
```

## Notes

- The hook automatically determines profile type based on user role
- Optimistic updates provide immediate feedback to users
- Error handling ensures data consistency by refetching on failure
- The implementation follows the existing patterns in the codebase
