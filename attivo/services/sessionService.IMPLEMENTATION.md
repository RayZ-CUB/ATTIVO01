# SessionService Implementation Summary

## Task: 2.3 Implement sessionService.ts

### Implementation Details

Created `services/sessionService.ts` with the following functions:

#### 1. `createSessionRequest(input: CreateSessionRequestInput): Promise<SessionRequest>`
- **Purpose**: Create a new session request from a player to a coach
- **Validation**: Verifies that the target coach has `verification_status = 'approved'` before inserting
- **Error Handling**: Throws `ServiceError('Coach is not approved', 'VALIDATION')` if coach is not approved
- **Returns**: Complete SessionRequest object with nested player and coach data

#### 2. `getSessionRequestsByPlayer(playerId: string): Promise<SessionRequest[]>`
- **Purpose**: Retrieve all session requests for a specific player
- **Returns**: Array of SessionRequest objects ordered by creation date (newest first)
- **Includes**: Nested player and coach data with user information

#### 3. `getSessionRequestsByCoach(coachId: string): Promise<SessionRequest[]>`
- **Purpose**: Retrieve all session requests for a specific coach
- **Returns**: Array of SessionRequest objects ordered by creation date (newest first)
- **Includes**: Nested player and coach data with user information

#### 4. `updateSessionStatus(requestId: string, status: SessionStatus): Promise<SessionRequest>`
- **Purpose**: Update the status of an existing session request
- **Parameters**: 
  - `requestId`: UUID of the session request
  - `status`: New status ('pending' | 'accepted' | 'declined' | 'completed')
- **Returns**: Updated SessionRequest object with nested data

### Requirements Satisfied

✅ **Requirement 2.5**: Session request creation with proper data persistence
✅ **Requirement 2.6**: Session request retrieval by player and coach
✅ **Requirement 5.5**: Coach verification status check before session request creation
✅ **Requirement 5.7**: Session status updates

### Design Patterns Followed

1. **Consistent with existing services**: Matches patterns from `coachService.ts`
2. **Error handling**: Uses `ServiceError` and `mapSupabaseError` consistently
3. **Type safety**: All functions use types from `types/index.ts`
4. **Data mapping**: Converts snake_case database fields to camelCase TypeScript properties
5. **Nested data loading**: Uses Supabase's relational query syntax to load player and coach data

### Key Features

- **Coach Verification**: Prevents session requests to non-approved coaches
- **Comprehensive Error Handling**: All database errors are properly mapped to ServiceError
- **Type Safety**: Full TypeScript type coverage with no `any` types in public API
- **Nested Data**: Automatically loads related player, coach, and user data
- **Sport Support**: Defaults to 'tennis' but supports multi-sport expansion

### Testing

- Created verification script (`sessionService.verify.ts`) that validates:
  - Function signatures match requirements
  - Error handling is implemented correctly
  - Coach verification check is in place
  - Data mapping works correctly
  - All requirements are covered

### Files Created

1. `/attivo/services/sessionService.ts` - Main service implementation
2. `/attivo/services/sessionService.test.ts` - Unit tests (Jest)
3. `/attivo/services/sessionService.verify.ts` - Verification script
4. `/attivo/jest.config.js` - Jest configuration
5. `/attivo/services/sessionService.IMPLEMENTATION.md` - This document

### Usage Example

```typescript
import { sessionService } from './services/sessionService';

// Create a session request
try {
  const sessionRequest = await sessionService.createSessionRequest({
    playerId: 'player-uuid',
    coachId: 'coach-uuid',
    message: 'Looking forward to improving my serve!',
    sport: 'tennis',
  });
  console.log('Session request created:', sessionRequest.id);
} catch (error) {
  if (error instanceof ServiceError && error.code === 'VALIDATION') {
    console.error('Coach is not approved');
  }
}

// Get player's session requests
const playerRequests = await sessionService.getSessionRequestsByPlayer('player-uuid');

// Get coach's session requests
const coachRequests = await sessionService.getSessionRequestsByCoach('coach-uuid');

// Update session status
const updated = await sessionService.updateSessionStatus('request-uuid', 'accepted');
```

### Database Schema Reference

The service interacts with the `session_requests` table:

```sql
CREATE TABLE session_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  message     TEXT,
  sport       VARCHAR(50) NOT NULL DEFAULT 'tennis',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_request UNIQUE (player_id, coach_id, status)
);
```

## Verification Status

✅ All functions implemented
✅ Coach verification check in place
✅ Error handling with ServiceError
✅ Type safety with types from types/index.ts
✅ Consistent with existing service patterns
✅ Requirements 2.5, 2.6, 5.5, 5.7 satisfied
✅ No TypeScript diagnostics errors
✅ Verification script passes

## Task Status

**COMPLETED** - Task 2.3 has been successfully implemented and verified.
