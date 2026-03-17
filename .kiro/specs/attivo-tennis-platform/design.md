# Design Document: ATTIVO Tennis Platform

## Overview

ATTIVO is a mobile-first tennis community platform built with React Native + Expo. The MVP delivers two core pillars: player–coach matching (Connect) and community engagement (social feed + events calendar). It targets iOS, Android, and Web from a single codebase via Expo Router.

The architecture is sport-agnostic from day one. Every data entity carries a `sport` field (defaulting to `"tennis"`), so adding skiing, hiking, or climbing requires only data changes — no code changes. The service layer fully abstracts Supabase, meaning the backend can be swapped without touching any screen or component.

Two user roles exist: **Player** (any skill level, browses coaches, joins events) and **Coach** (must pass admin verification before appearing in Connect listings).

### Design Principles

This design follows industry-standard patterns for production mobile applications:

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
2. **Dependency Inversion**: Screens depend on service interfaces, not implementations
3. **Single Responsibility**: Each module has one reason to change
4. **Open/Closed**: Open for extension (new sports, features) without modifying existing code
5. **Fail-Safe Defaults**: Graceful degradation when services are unavailable
6. **Progressive Enhancement**: Core features work offline, enhanced features require connectivity


## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        React Native / Expo App                          │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  Expo Router │  │   Zustand    │  │  NativeWind / Paper          │  │
│  │  (navigation)│  │   (stores)   │  │  (UI components)             │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────────┘  │
│         │                 │                                             │
│  ┌──────▼─────────────────▼──────────────────────────────────────────┐  │
│  │                    Screen Components                              │  │
│  │  discover.tsx  connect.tsx  community.tsx  profile.tsx            │  │
│  └──────────────────────────┬────────────────────────────────────────┘  │
│                             │  (calls only)                             │
│  ┌──────────────────────────▼────────────────────────────────────────┐  │
│  │                   Custom Hooks Layer                              │  │
│  │  useAuth  useCoaches  useFeed  useEvents  useProfile             │  │
│  │  (encapsulates service calls + local state + error handling)     │  │
│  └──────────────────────────┬────────────────────────────────────────┘  │
│                             │                                           │
│  ┌──────────────────────────▼────────────────────────────────────────┐  │
│  │                     Service Layer                                 │  │
│  │  authService  playerService  coachService  eventService           │  │
│  │  postService  sessionService  adminService                        │  │
│  │  (business logic + validation + error mapping)                    │  │
│  └──────────────────────────┬────────────────────────────────────────┘  │
│                             │                                           │
│  ┌──────────────────────────▼────────────────────────────────────────┐  │
│  │                   Data Access Layer                               │  │
│  │  cacheManager  networkClient  offlineQueue                        │  │
│  │  (caching + retry logic + offline support)                        │  │
│  └──────────────────────────┬────────────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │  @supabase/supabase-js
┌─────────────────────────────▼───────────────────────────────────────────┐
│                          Supabase                                       │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  PostgreSQL  │  │  Supabase    │  │ Storage  │  │   Realtime     │  │
│  │  (RLS)       │  │  Auth        │  │ (images) │  │   (feed)       │  │
│  └──────────────┘  └──────────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture Layers Explained

**1. Screen Components (Presentation Layer)**
- Pure UI components that render data and handle user interactions
- No direct service calls — all data access through custom hooks
- Responsible for layout, styling, and user feedback (loading states, errors)

**2. Custom Hooks Layer (Presentation Logic)**
- Encapsulates data fetching, local state, and error handling
- Provides clean API to screens: `{ data, loading, error, refetch }`
- Handles loading states, error recovery, and optimistic updates
- Example: `useCoaches()` manages coach list, filters, and best matches

**3. Service Layer (Business Logic)**
- Implements business rules and validation
- Maps domain models to/from API responses
- Throws typed `ServiceError` for consistent error handling
- Sport-agnostic: all queries filter by sport parameter

**4. Data Access Layer (Infrastructure)**
- Manages caching, retry logic, and offline queue
- Abstracts Supabase client — can be swapped for REST API, GraphQL, etc.
- Handles network failures gracefully with exponential backoff
- Provides cache invalidation hooks for real-time updates

**5. Backend (Supabase)**
- PostgreSQL with Row-Level Security for data isolation
- Supabase Auth for session management
- Supabase Storage for user-uploaded images
- Supabase Realtime for live feed updates

### Multi-Sport Model

Every table includes `sport VARCHAR(50) NOT NULL DEFAULT 'tennis'`. All service layer queries filter by sport. Adding a new sport requires:
1. Inserting seed data with the new sport value
2. No schema migrations, no code changes

The `Sport` TypeScript type is a union of known sport strings with a fallback, keeping the type system honest while remaining open for extension.


## Production-Ready Enhancements

### Caching Strategy

**Cache Layer Architecture:**

```typescript
// lib/cache/cacheManager.ts

interface CacheConfig {
  ttl: number;              // Time-to-live in milliseconds
  staleWhileRevalidate: boolean;  // Return stale data while fetching fresh
  maxSize: number;          // Max cache entries
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  
  // Get cached data or fetch fresh
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T>;
  
  // Invalidate specific cache keys
  invalidate(pattern: string | RegExp): void;
  
  // Clear all cache
  clear(): void;
}
```

**Cache Keys Convention:**
```
coaches:tennis:approved              # All approved tennis coaches
coaches:tennis:approved:filters:{hash}  # Filtered coach list
events:tennis:upcoming:3             # Next 3 tennis events
posts:tennis:latest:10               # Latest 10 tennis posts
profile:player:{userId}              # Player profile
profile:coach:{userId}               # Coach profile
```

**Cache TTL Strategy:**

| Data Type | TTL | Stale-While-Revalidate | Rationale |
|-----------|-----|------------------------|-----------|
| Coach listings | 5 min | Yes | Changes infrequently, OK to show stale |
| Events | 2 min | Yes | Updates are not time-critical |
| Posts | 30 sec | Yes | Realtime updates handle freshness |
| User profile | 10 min | No | User expects immediate updates after edit |
| Session requests | 1 min | No | Time-sensitive data |
| Verification status | 30 sec | No | Critical for coach visibility |

**Cache Invalidation Hooks:**

```typescript
// Invalidate cache when data changes
postService.createPost() → invalidate('posts:*')
eventService.createEvent() → invalidate('events:*')
coachService.updateCoach() → invalidate('coaches:*', 'profile:coach:{userId}')
adminService.approveCoach() → invalidate('coaches:*')
```

---

### Offline Support Strategy

**Offline-First Features:**
- View cached coach listings
- View cached events and posts
- Edit own profile (queued for sync)
- View own session requests

**Online-Only Features:**
- Create new posts or events
- Send session requests
- Admin actions
- Real-time feed updates

**Offline Queue Implementation:**

```typescript
// lib/offline/offlineQueue.ts

interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'post' | 'event' | 'profile' | 'session_request';
  payload: any;
  timestamp: number;
  retryCount: number;
}

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  
  // Add operation to queue
  enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): void;
  
  // Process queue when online
  async processQueue(): Promise<void>;
  
  // Remove operation from queue
  dequeue(id: string): void;
  
  // Get pending operations count
  getPendingCount(): number;
}
```

**Network Status Monitoring:**

```typescript
// hooks/useNetworkStatus.ts

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  
  useEffect(() => {
    // Monitor NetInfo for connection changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      setIsSlowConnection(state.type === '2g' || state.type === '3g');
    });
    
    return unsubscribe;
  }, []);
  
  return { isOnline, isSlowConnection };
}
```

---

### Error Handling & Retry Logic

**Enhanced ServiceError:**

```typescript
// services/errors.ts

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION' | 'NETWORK' | 'RATE_LIMIT' | 'SERVER_ERROR' | 'UNKNOWN',
    public statusCode?: number,
    public retryable: boolean = false,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
  
  // Check if error is retryable
  isRetryable(): boolean {
    return this.retryable || this.code === 'NETWORK' || this.code === 'RATE_LIMIT';
  }
  
  // Get user-friendly message
  getUserMessage(): string {
    const messages: Record<string, string> = {
      NOT_FOUND: 'The requested resource was not found',
      UNAUTHORIZED: 'You are not authorized to perform this action',
      VALIDATION: 'Please check your input and try again',
      NETWORK: 'Network connection issue. Please check your internet',
      RATE_LIMIT: 'Too many requests. Please wait a moment',
      SERVER_ERROR: 'Server error. Please try again later',
      UNKNOWN: 'An unexpected error occurred',
    };
    return messages[this.code] || this.message;
  }
}
```

**Retry Strategy with Exponential Backoff:**

```typescript
// lib/network/retryStrategy.ts

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;  // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if not retryable
      if (error instanceof ServiceError && !error.isRetryable()) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

---

### Analytics & Monitoring

**Analytics Events:**

```typescript
// lib/analytics/events.ts

export enum AnalyticsEvent {
  // User actions
  USER_SIGNED_UP = 'user_signed_up',
  USER_SIGNED_IN = 'user_signed_in',
  USER_SIGNED_OUT = 'user_signed_out',
  
  // Coach actions
  COACH_PROFILE_CREATED = 'coach_profile_created',
  COACH_APPROVED = 'coach_approved',
  COACH_REJECTED = 'coach_rejected',
  
  // Player actions
  SESSION_REQUESTED = 'session_requested',
  SESSION_ACCEPTED = 'session_accepted',
  SESSION_DECLINED = 'session_declined',
  
  // Community actions
  POST_CREATED = 'post_created',
  EVENT_CREATED = 'event_created',
  EVENT_VIEWED = 'event_viewed',
  
  // Errors
  ERROR_OCCURRED = 'error_occurred',
  NETWORK_ERROR = 'network_error',
  
  // Performance
  SCREEN_LOAD_TIME = 'screen_load_time',
  API_RESPONSE_TIME = 'api_response_time',
}

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  // Track event
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void;
  
  // Track screen view
  screen(screenName: string, properties?: AnalyticsProperties): void;
  
  // Set user properties
  identify(userId: string, properties: AnalyticsProperties): void;
  
  // Track timing
  timing(category: string, variable: string, milliseconds: number): void;
}
```

**Performance Monitoring:**

```typescript
// lib/monitoring/performance.ts

class PerformanceMonitor {
  // Measure screen load time
  measureScreenLoad(screenName: string, startTime: number): void {
    const loadTime = Date.now() - startTime;
    analytics.timing('screen_load', screenName, loadTime);
    
    // Alert if load time exceeds threshold
    if (loadTime > 3000) {
      console.warn(`Slow screen load: ${screenName} took ${loadTime}ms`);
    }
  }
  
  // Measure API call duration
  async measureApiCall<T>(
    operation: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      analytics.timing('api_call', operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      analytics.track(AnalyticsEvent.ERROR_OCCURRED, {
        operation,
        duration,
        error: error.message,
      });
      throw error;
    }
  }
}
```

---

### Feature Flags System

**Feature Flag Configuration:**

```typescript
// lib/featureFlags/config.ts

export interface FeatureFlags {
  // MVP features
  enableRealtimeFeed: boolean;
  enableCoachMatching: boolean;
  enableEventCalendar: boolean;
  
  // Future features
  enableInAppMessaging: boolean;
  enableVideoSessions: boolean;
  enablePayments: boolean;
  enableMultiSport: boolean;
  
  // Experimental features
  enableOfflineMode: boolean;
  enableAdvancedFilters: boolean;
  enablePushNotifications: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags;
  
  // Check if feature is enabled
  isEnabled(feature: keyof FeatureFlags): boolean;
  
  // Get all flags
  getAllFlags(): FeatureFlags;
  
  // Update flags (from remote config)
  updateFlags(newFlags: Partial<FeatureFlags>): void;
}

// Usage in components
const featureFlags = useFeatureFlags();
if (featureFlags.isEnabled('enableRealtimeFeed')) {
  // Show realtime feed
}
```

---

### API Versioning Strategy

**Version Header:**

All API requests include a version header:
```
X-API-Version: 1.0
```

**Service Layer Versioning:**

```typescript
// services/config.ts

export const API_VERSION = '1.0';

// Supabase client with version header
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'X-API-Version': API_VERSION,
    },
  },
});
```

**Breaking Change Strategy:**

When introducing breaking changes:
1. Create new service methods with version suffix: `getCoachesV2()`
2. Deprecate old methods with console warnings
3. Maintain both versions for 2 release cycles
4. Remove deprecated methods after migration period

**Migration Path:**

```typescript
// services/coachService.ts

// V1 (deprecated)
/** @deprecated Use getCoachesV2 instead */
export async function getCoaches(filters?: CoachFilters): Promise<CoachProfile[]> {
  console.warn('getCoaches is deprecated. Use getCoachesV2 instead.');
  return getCoachesV2(filters);
}

// V2 (current)
export async function getCoachesV2(
  filters?: CoachFilters,
  options?: { includeUnavailable?: boolean }
): Promise<CoachProfile[]> {
  // New implementation
}
```

---

### Security Enhancements

**Input Sanitization:**

```typescript
// lib/security/sanitize.ts

export function sanitizeInput(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

export function sanitizePostBody(body: string): string {
  // Allow basic formatting but remove dangerous content
  return sanitizeInput(body).substring(0, 5000); // Max 5000 chars
}
```

**Rate Limiting (Client-Side):**

```typescript
// lib/security/rateLimiter.ts

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  // Check if action is allowed
  isAllowed(action: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(action) || [];
    
    // Remove old timestamps outside window
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(action, validTimestamps);
    return true;
  }
}

// Usage
const rateLimiter = new RateLimiter();

// Limit post creation to 10 per minute
if (!rateLimiter.isAllowed('create_post', 10, 60000)) {
  throw new ServiceError('Too many posts', 'RATE_LIMIT', 429, false);
}
```

**Sensitive Data Handling:**

```typescript
// lib/security/sensitiveData.ts

// Never log sensitive data
export function sanitizeForLogging(data: any): any {
  const sensitive = ['password', 'token', 'apiKey', 'secret', 'email'];
  
  if (typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```


## Project File Structure

```
attivo/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack layout (no tab bar)
│   │   ├── login.tsx            # Email/password sign-in + sign-up
│   │   └── onboarding.tsx       # Role selection + profile creation wizard
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar layout with icons and theme
│   │   ├── discover.tsx         # Home: featured events + community highlights
│   │   ├── connect.tsx          # Player–coach matching + session requests
│   │   ├── community.tsx        # Social feed + event calendar
│   │   └── profile.tsx          # Role-specific user profile + edit
│   ├── coach/
│   │   └── [id].tsx             # Coach detail modal (bio, certs, request CTA)
│   ├── event/
│   │   └── [id].tsx             # Event detail modal
│   ├── admin/
│   │   └── index.tsx            # Admin: pending coach verification queue
│   ├── _layout.tsx              # Root layout: auth guard, safe area, fonts
│   └── index.tsx                # Entry: redirects to (auth) or (tabs)
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx           # Pressable button with variant + size props
│   │   ├── Card.tsx             # Surface card with border and shadow
│   │   ├── Input.tsx            # Text input with lime focus ring
│   │   ├── Badge.tsx            # Role / status / skill level badge
│   │   ├── Avatar.tsx           # Circular image with fallback initials
│   │   ├── EmptyState.tsx       # Empty list placeholder with icon + message
│   │   ├── ErrorBanner.tsx      # Dismissible error banner
│   │   ├── Toast.tsx            # Temporary notification
│   │   └── LoadingSpinner.tsx   # Loading indicator
│   ├── discover/
│   │   ├── HeroSection.tsx      # User greeting + role badge
│   │   ├── FeaturedEventCard.tsx # Compact event card for featured section
│   │   └── HighlightPostCard.tsx # Compact post card for highlights section
│   ├── connect/
│   │   ├── CoachCard.tsx        # Coach listing card (name, rate, speciality)
│   │   ├── CoachFilters.tsx     # Filter bar (skill, speciality, max rate)
│   │   ├── BestMatchSection.tsx # Top 3 matched coaches for the player
│   │   └── SessionRequestItem.tsx # Incoming request row for coach view
│   ├── community/
│   │   ├── PostCard.tsx         # Feed post card (author, body, timestamp)
│   │   ├── EventCard.tsx        # Event card (name, date, category, location)
│   │   ├── CreatePostForm.tsx   # Inline post creation form
│   │   ├── CreateEventModal.tsx # Full-screen event creation form
│   │   └── EventCalendar.tsx    # Monthly calendar with event dot indicators
│   └── profile/
│       ├── PlayerProfileView.tsx  # Skill level, play style, match history
│       └── CoachProfileView.tsx   # Speciality, rate, certs, verification badge
│
├── hooks/
│   ├── useAuth.ts               # Auth state from authStore + sign-out helper
│   ├── useCoaches.ts            # Coach list with filter state + caching
│   ├── useFeed.ts               # Posts + realtime subscription + offline queue
│   ├── useEvents.ts             # Events + calendar selection state + caching
│   ├── useProfile.ts            # Current user profile read/write + optimistic updates
│   ├── useNetworkStatus.ts      # Network connectivity monitoring
│   └── useFeatureFlags.ts       # Feature flag access
│
├── services/
│   ├── supabase.ts              # Supabase client singleton (env vars)
│   ├── authService.ts           # signUp, signIn, signOut, getCurrentUser
│   ├── playerService.ts         # getPlayer, createPlayer, updatePlayer
│   ├── coachService.ts          # getCoaches, getCoachById, createCoach, updateCoach
│   ├── sessionService.ts        # createSessionRequest, getSessionRequests, updateSessionStatus
│   ├── eventService.ts          # getEvents, createEvent, getEventsByDate
│   ├── postService.ts           # getPosts, createPost
│   ├── adminService.ts          # getPendingCoaches, approveCoach, rejectCoach
│   ├── errors.ts                # ServiceError class + error utilities
│   └── config.ts                # API version + service configuration
│
├── lib/
│   ├── cache/
│   │   ├── cacheManager.ts      # Cache implementation with TTL + invalidation
│   │   └── cacheKeys.ts         # Cache key constants + utilities
│   ├── offline/
│   │   ├── offlineQueue.ts      # Offline operation queue
│   │   └── syncManager.ts       # Background sync when online
│   ├── network/
│   │   ├── retryStrategy.ts     # Exponential backoff retry logic
│   │   └── networkClient.ts     # HTTP client with retry + caching
│   ├── analytics/
│   │   ├── events.ts            # Analytics event definitions
│   │   └── tracker.ts           # Analytics implementation (Firebase, Mixpanel, etc.)
│   ├── monitoring/
│   │   ├── performance.ts       # Performance monitoring utilities
│   │   └── errorReporting.ts    # Error reporting (Sentry, Bugsnag, etc.)
│   ├── featureFlags/
│   │   ├── config.ts            # Feature flag definitions
│   │   └── manager.ts           # Feature flag manager
│   ├── security/
│   │   ├── sanitize.ts          # Input sanitization utilities
│   │   ├── rateLimiter.ts       # Client-side rate limiting
│   │   └── sensitiveData.ts     # Sensitive data handling
│   └── utils/
│       ├── validation.ts        # Validation helpers
│       ├── formatting.ts        # Date/time/currency formatting
│       └── debounce.ts          # Debounce/throttle utilities
│
├── store/
│   ├── authStore.ts             # User session, role, loading state
│   ├── coachStore.ts            # Coach listings, active filters, selected coach
│   ├── communityStore.ts        # Feed posts, events, calendar selected date
│   ├── offlineStore.ts          # Offline queue + sync status
│   └── featureFlagStore.ts      # Feature flags state
│
├── types/
│   ├── index.ts                 # All TypeScript interfaces and enums
│   ├── api.ts                   # API request/response types
│   └── errors.ts                # Error type definitions
│
├── constants/
│   ├── theme.ts                 # Colors, typography, spacing design tokens
│   ├── config.ts                # App configuration (API URLs, timeouts, etc.)
│   └── features.ts              # Feature flag defaults
│
├── migrations/
│   └── supabase/
│       ├── 001_initial_schema.sql
│       ├── 002_add_indexes.sql
│       └── 003_rls_policies.sql
│
└── assets/
    ├── fonts/
    │   ├── BebasNeue-Regular.ttf
    │   ├── DMSans-Regular.ttf
    │   ├── DMSans-Medium.ttf
    │   └── DMSans-SemiBold.ttf
    └── images/
        └── logo.png
```




## Data Migration & Extensibility Patterns

### Database Migration Strategy

**Migration File Naming Convention:**
```
{version}_{description}.sql
001_initial_schema.sql
002_add_indexes.sql
003_rls_policies.sql
004_add_coach_rating_column.sql
```

**Migration Best Practices:**

1. **Always Additive**: Never drop columns or tables in production migrations
2. **Backward Compatible**: New code must work with old schema during deployment
3. **Rollback Plan**: Every migration has a corresponding rollback script
4. **Test Locally**: Run migrations against local Supabase instance first
5. **Version Control**: All migrations in `migrations/supabase/` directory

**Example Migration Pattern:**

```sql
-- migrations/supabase/004_add_coach_rating_column.sql

-- Add new column (nullable for backward compatibility)
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2);
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_coaches_rating ON coaches(rating DESC) WHERE rating IS NOT NULL;

-- Update existing rows with default value (optional)
UPDATE coaches SET rating = 0.0, rating_count = 0 WHERE rating IS NULL;

-- Add constraint after data migration
ALTER TABLE coaches ADD CONSTRAINT check_rating_range CHECK (rating >= 0 AND rating <= 5);
```

**Rollback Script:**

```sql
-- migrations/supabase/rollback_004.sql

ALTER TABLE coaches DROP CONSTRAINT IF EXISTS check_rating_range;
DROP INDEX IF EXISTS idx_coaches_rating;
ALTER TABLE coaches DROP COLUMN IF EXISTS rating;
ALTER TABLE coaches DROP COLUMN IF EXISTS rating_count;
```

---

### Extensibility Points

**1. Adding New Sports**

No code changes required — just data:

```sql
-- Add skiing sport
INSERT INTO sports (name, icon, color) VALUES ('skiing', 'ski', '#4A90E2');

-- Seed data for skiing
INSERT INTO events (name, category, location, event_date, event_time, sport, creator_id)
VALUES ('Vail Ski Meetup', 'social', 'Vail, CO', '2024-12-15', '09:00', 'skiing', '{user_id}');
```

**2. Adding New User Roles**

Extend the role enum and create corresponding profile tables:

```sql
-- Add new role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('player', 'coach', 'admin', 'venue_owner'));

-- Create venue_owner profile table
CREATE TABLE venue_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  venue_name TEXT NOT NULL,
  address TEXT NOT NULL,
  amenities TEXT[],
  sport VARCHAR(50) NOT NULL DEFAULT 'tennis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**3. Adding New Event Categories**

```sql
-- Extend event category enum
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events ADD CONSTRAINT events_category_check 
  CHECK (category IN ('match', 'clinic', 'group_session', 'social', 'tournament', 'workshop'));
```

**4. Plugin Architecture for Features**

```typescript
// lib/plugins/pluginManager.ts

interface Plugin {
  name: string;
  version: string;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }
  
  async initializeAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.initialize();
    }
  }
  
  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.cleanup();
    }
  }
}

// Example plugin: Push Notifications
const pushNotificationPlugin: Plugin = {
  name: 'push-notifications',
  version: '1.0.0',
  
  async initialize() {
    // Register for push notifications
    // Set up notification handlers
  },
  
  async cleanup() {
    // Unregister notification handlers
  },
};
```

**5. Custom Hooks for Business Logic**

```typescript
// lib/hooks/businessLogicHooks.ts

type HookFunction<T> = (data: T) => Promise<T | void>;

class BusinessLogicHooks {
  private hooks: Map<string, HookFunction<any>[]> = new Map();
  
  // Register a hook
  register<T>(event: string, hook: HookFunction<T>): void {
    const existing = this.hooks.get(event) || [];
    this.hooks.set(event, [...existing, hook]);
  }
  
  // Execute all hooks for an event
  async execute<T>(event: string, data: T): Promise<T> {
    const hooks = this.hooks.get(event) || [];
    let result = data;
    
    for (const hook of hooks) {
      const hookResult = await hook(result);
      if (hookResult !== undefined) {
        result = hookResult;
      }
    }
    
    return result;
  }
}

// Usage: Add custom logic before coach approval
businessLogicHooks.register('before:coach:approve', async (coach) => {
  // Send notification to coach
  await notificationService.send(coach.userId, 'Your profile has been approved!');
  
  // Log to analytics
  analytics.track(AnalyticsEvent.COACH_APPROVED, { coachId: coach.id });
  
  return coach;
});
```

---

### Performance Optimization Patterns

**1. Pagination Strategy**

```typescript
// services/paginationTypes.ts

interface PaginationParams {
  page: number;
  pageSize: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Example: Paginated coach listing
async function getCoachesPaginated(
  filters: CoachFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<CoachProfile>> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  
  // Get total count
  const { count } = await supabase
    .from('coaches')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'approved')
    .eq('sport', filters.sport || 'tennis');
  
  // Get paginated data
  const { data } = await supabase
    .from('coaches')
    .select('*, user:users(*)')
    .eq('verification_status', 'approved')
    .eq('sport', filters.sport || 'tennis')
    .range(offset, offset + pageSize - 1);
  
  return {
    data: data || [],
    pagination: {
      page,
      pageSize,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      hasNextPage: offset + pageSize < (count || 0),
      hasPreviousPage: page > 1,
    },
  };
}
```

**2. Lazy Loading Images**

```typescript
// components/ui/LazyImage.tsx

interface LazyImageProps {
  source: { uri: string };
  placeholder?: ImageSourcePropType;
  style?: ImageStyle;
}

export function LazyImage({ source, placeholder, style }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <View style={style}>
      {!loaded && placeholder && (
        <Image source={placeholder} style={style} />
      )}
      <Image
        source={source}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </View>
  );
}
```

**3. Debounced Search**

```typescript
// hooks/useDebouncedSearch.ts

export function useDebouncedSearch(
  searchFn: (query: string) => Promise<any[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
          setResults([]);
          setIsSearching(false);
          return;
        }
        
        setIsSearching(true);
        try {
          const data = await searchFn(searchQuery);
          setResults(data);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, delay),
    [searchFn, delay]
  );
  
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
  
  return { query, setQuery, results, isSearching };
}
```

**4. Virtual Lists for Large Data Sets**

```typescript
// Use FlashList instead of FlatList for better performance

import { FlashList } from '@shopify/flash-list';

<FlashList
  data={coaches}
  renderItem={({ item }) => <CoachCard coach={item} />}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

---


## Database Schema (PostgreSQL)

### Table: `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('player', 'coach', 'admin')),
  location      TEXT,
  avatar_url    TEXT,
  sport         VARCHAR(50) NOT NULL DEFAULT 'tennis',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_sport ON users(sport);
```

**RLS Policies:**
- `SELECT`: Any authenticated user can read any user row (public profiles)
- `INSERT`: User can only insert a row where `id = auth.uid()`
- `UPDATE`: User can only update their own row (`id = auth.uid()`)
- `DELETE`: User can only delete their own row

---

### Table: `players`

```sql
CREATE TABLE players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skill_level   TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'competitive')),
  play_style    TEXT NOT NULL CHECK (play_style IN ('singles', 'doubles', 'both')),
  sport         VARCHAR(50) NOT NULL DEFAULT 'tennis',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_sport ON players(sport);
CREATE INDEX idx_players_skill_level ON players(skill_level);
```

**RLS Policies:**
- `SELECT`: Any authenticated user can read player profiles
- `INSERT`: User can only insert where `user_id = auth.uid()`
- `UPDATE`: User can only update their own player profile

---

### Table: `coaches`

```sql
CREATE TABLE coaches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  speciality          TEXT NOT NULL,
  years_experience    INTEGER NOT NULL CHECK (years_experience >= 0),
  rate_min            NUMERIC(8,2) NOT NULL CHECK (rate_min >= 0),
  rate_max            NUMERIC(8,2) NOT NULL CHECK (rate_max >= rate_min),
  certifications      TEXT[],
  bio                 TEXT,
  skill_levels_coached TEXT[] NOT NULL DEFAULT ARRAY['beginner','intermediate','advanced','competitive'],
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'unavailable')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  sport               VARCHAR(50) NOT NULL DEFAULT 'tennis',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coaches_user_id ON coaches(user_id);
CREATE INDEX idx_coaches_verification_status ON coaches(verification_status);
CREATE INDEX idx_coaches_sport ON coaches(sport);
CREATE INDEX idx_coaches_speciality ON coaches(speciality);
```

**RLS Policies:**
- `SELECT`: Any authenticated user can read coaches where `verification_status = 'approved'`; admins can read all
- `INSERT`: User can only insert where `user_id = auth.uid()`
- `UPDATE`: User can update their own coach profile; admins can update `verification_status` on any row

---

### Table: `events`

```sql
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('match', 'clinic', 'group_session', 'social')),
  description     TEXT,
  location        TEXT NOT NULL,
  event_date      DATE NOT NULL,
  event_time      TIME NOT NULL,
  max_participants INTEGER CHECK (max_participants > 0),
  sport           VARCHAR(50) NOT NULL DEFAULT 'tennis',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_creator_id ON events(creator_id);
CREATE INDEX idx_events_sport ON events(sport);
CREATE INDEX idx_events_category ON events(category);
```

**RLS Policies:**
- `SELECT`: Any authenticated user can read all events
- `INSERT`: Any authenticated user can create events
- `UPDATE`: Only the creator can update their event (`creator_id = auth.uid()`)
- `DELETE`: Only the creator can delete their event

---

### Table: `posts`

```sql
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (length(trim(body)) > 0),
  image_url   TEXT,
  sport       VARCHAR(50) NOT NULL DEFAULT 'tennis',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_sport ON posts(sport);
```

**RLS Policies:**
- `SELECT`: Any authenticated user can read all posts
- `INSERT`: Any authenticated user can create posts; `author_id` must equal `auth.uid()`
- `UPDATE`: Only the author can update their post
- `DELETE`: Only the author can delete their post

---

### Table: `session_requests`

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

CREATE INDEX idx_session_requests_player_id ON session_requests(player_id);
CREATE INDEX idx_session_requests_coach_id ON session_requests(coach_id);
CREATE INDEX idx_session_requests_status ON session_requests(status);
CREATE INDEX idx_session_requests_sport ON session_requests(sport);
```

**RLS Policies:**
- `SELECT`: Player can read their own requests; coach can read requests directed at them; admins can read all
- `INSERT`: Authenticated user can insert where the `player_id` maps to their own player profile
- `UPDATE`: Coach can update `status` on requests directed at them; player can cancel their own pending requests


## TypeScript Type Definitions

All types live in `types/index.ts`.

```typescript
// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type Sport = 'tennis' | 'skiing' | 'hiking' | 'climbing' | string;

export type UserRole = 'player' | 'coach' | 'admin';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'competitive';

export type PlayStyle = 'singles' | 'doubles' | 'both';

export type EventCategory = 'match' | 'clinic' | 'group_session' | 'social';

export type SessionStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  location?: string;
  avatarUrl?: string;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  skillLevel: SkillLevel;
  playStyle: PlayStyle;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  // joined from users
  user?: User;
}

export interface CoachProfile {
  id: string;
  userId: string;
  speciality: string;
  yearsExperience: number;
  rateMin: number;
  rateMax: number;
  certifications: string[];
  bio?: string;
  skillLevelsCoached: SkillLevel[];
  availabilityStatus: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  // joined from users
  user?: User;
}

export interface Event {
  id: string;
  creatorId: string;
  name: string;
  category: EventCategory;
  description?: string;
  location: string;
  eventDate: string;   // ISO date string YYYY-MM-DD
  eventTime: string;   // HH:MM
  maxParticipants?: number;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  // joined
  creator?: User;
}

export interface Post {
  id: string;
  authorId: string;
  body: string;
  imageUrl?: string;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  // joined
  author?: User;
}

export interface SessionRequest {
  id: string;
  playerId: string;
  coachId: string;
  status: SessionStatus;
  message?: string;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  // joined
  player?: PlayerProfile;
  coach?: CoachProfile;
}

// ─── Service Input Types ──────────────────────────────────────────────────────

export interface CreatePlayerInput {
  userId: string;
  skillLevel: SkillLevel;
  playStyle: PlayStyle;
  sport?: Sport;
}

export interface UpdatePlayerInput {
  skillLevel?: SkillLevel;
  playStyle?: PlayStyle;
}

export interface CreateCoachInput {
  userId: string;
  speciality: string;
  yearsExperience: number;
  rateMin: number;
  rateMax: number;
  certifications?: string[];
  bio?: string;
  skillLevelsCoached?: SkillLevel[];
  sport?: Sport;
}

export interface UpdateCoachInput {
  speciality?: string;
  yearsExperience?: number;
  rateMin?: number;
  rateMax?: number;
  certifications?: string[];
  bio?: string;
  skillLevelsCoached?: SkillLevel[];
  availabilityStatus?: AvailabilityStatus;
}

export interface CoachFilters {
  skillLevel?: SkillLevel;
  speciality?: string;
  maxRate?: number;
  sport?: Sport;
}

export interface CreateEventInput {
  name: string;
  category: EventCategory;
  description?: string;
  location: string;
  eventDate: string;
  eventTime: string;
  maxParticipants?: number;
  sport?: Sport;
}

export interface CreatePostInput {
  body: string;
  imageUrl?: string;
  sport?: Sport;
}

export interface CreateSessionRequestInput {
  playerId: string;
  coachId: string;
  message?: string;
  sport?: Sport;
}
```


## Service Layer API

All services import the Supabase client from `services/supabase.ts` and return typed results. Screens and components never import from `services/supabase.ts` directly.

### `authService`

```typescript
// services/authService.ts

interface AuthResult {
  user: User | null;
  error: string | null;
}

// Sign up a new user with email + password. Creates a row in public.users.
signUp(email: string, password: string, displayName: string, role: UserRole): Promise<AuthResult>

// Sign in an existing user. Returns the User record from public.users.
signIn(email: string, password: string): Promise<AuthResult>

// Sign out the current session.
signOut(): Promise<{ error: string | null }>

// Returns the currently authenticated User, or null if unauthenticated.
getCurrentUser(): Promise<User | null>
```

---

### `playerService`

```typescript
// services/playerService.ts

// Fetch a player profile by user ID (includes joined user data).
getPlayer(userId: string): Promise<PlayerProfile | null>

// Create a new player profile during onboarding.
createPlayer(input: CreatePlayerInput): Promise<PlayerProfile>

// Update an existing player profile.
updatePlayer(userId: string, input: UpdatePlayerInput): Promise<PlayerProfile>
```

---

### `coachService`

```typescript
// services/coachService.ts

// Fetch all approved coaches, optionally filtered. Returns only verification_status = 'approved'.
getCoaches(filters?: CoachFilters): Promise<CoachProfile[]>

// Fetch a single coach by their coach profile ID (includes joined user data).
getCoachById(coachId: string): Promise<CoachProfile | null>

// Create a new coach profile during onboarding. Sets verificationStatus to 'pending'.
createCoach(input: CreateCoachInput): Promise<CoachProfile>

// Update an existing coach profile (own fields only, not verificationStatus).
updateCoach(userId: string, input: UpdateCoachInput): Promise<CoachProfile>

// Get the verification status for a coach by user ID.
getVerificationStatus(userId: string): Promise<VerificationStatus | null>
```

---

### `sessionService`

```typescript
// services/sessionService.ts

// Create a new session request from a player to a coach.
createSessionRequest(input: CreateSessionRequestInput): Promise<SessionRequest>

// Get all session requests for a player (by player profile ID).
getSessionRequestsByPlayer(playerId: string): Promise<SessionRequest[]>

// Get all incoming session requests for a coach (by coach profile ID).
getSessionRequestsByCoach(coachId: string): Promise<SessionRequest[]>

// Update the status of a session request (accept / decline / complete).
updateSessionStatus(requestId: string, status: SessionStatus): Promise<SessionRequest>
```

---

### `eventService`

```typescript
// services/eventService.ts

// Get all upcoming events, optionally filtered by sport.
getEvents(sport?: Sport): Promise<Event[]>

// Create a new event. creatorId is set from the authenticated user.
createEvent(input: CreateEventInput): Promise<Event>

// Get all events on a specific date (YYYY-MM-DD).
getEventsByDate(date: string, sport?: Sport): Promise<Event[]>

// Get the next N upcoming events (used by Discover screen).
getUpcomingEvents(limit: number, sport?: Sport): Promise<Event[]>
```

---

### `postService`

```typescript
// services/postService.ts

// Get all posts in reverse chronological order, optionally filtered by sport.
getPosts(sport?: Sport, limit?: number): Promise<Post[]>

// Create a new post. authorId is set from the authenticated user.
createPost(input: CreatePostInput): Promise<Post>
```

---

### `adminService`

```typescript
// services/adminService.ts

// Get all coach profiles with verificationStatus = 'pending'.
getPendingCoaches(): Promise<CoachProfile[]>

// Approve a coach profile — sets verificationStatus to 'approved'.
approveCoach(coachId: string): Promise<CoachProfile>

// Reject a coach profile — sets verificationStatus to 'rejected'.
rejectCoach(coachId: string): Promise<CoachProfile>
```


## State Management (Zustand)

### `authStore` — `store/authStore.ts`

```typescript
interface AuthState {
  user: User | null;           // Full user record from public.users
  role: UserRole | null;       // Derived from user.role for quick access
  isLoading: boolean;          // True while session is being restored on launch
  isAuthenticated: boolean;    // Derived: user !== null

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}
```

On app launch, `_layout.tsx` calls `authService.getCurrentUser()` and populates the store. Supabase Auth's `onAuthStateChange` listener keeps the store in sync.

---

### `coachStore` — `store/coachStore.ts`

```typescript
interface CoachState {
  coaches: CoachProfile[];         // Full approved coach list (current sport)
  filteredCoaches: CoachProfile[]; // Result after applying activeFilters
  bestMatches: CoachProfile[];     // Top 3 from matching algorithm
  selectedCoach: CoachProfile | null;
  activeFilters: CoachFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCoaches: (sport?: Sport) => Promise<void>;
  applyFilters: (filters: CoachFilters) => void;
  clearFilters: () => void;
  selectCoach: (coach: CoachProfile | null) => void;
  computeBestMatches: (player: PlayerProfile) => void;
}
```

`filteredCoaches` is always derived from `coaches` by applying `activeFilters` client-side after the initial fetch. `bestMatches` is computed by the matching algorithm (see Coach Matching Algorithm section).

---

### `communityStore` — `store/communityStore.ts`

```typescript
interface CommunityState {
  posts: Post[];
  events: Event[];
  selectedDate: string | null;    // ISO date string for calendar selection
  eventsForSelectedDate: Event[]; // Derived from events + selectedDate
  isLoadingPosts: boolean;
  isLoadingEvents: boolean;
  realtimeSubscription: RealtimeChannel | null;

  // Actions
  fetchPosts: (sport?: Sport) => Promise<void>;
  fetchEvents: (sport?: Sport) => Promise<void>;
  addPost: (post: Post) => void;   // Called by realtime subscription
  addEvent: (event: Event) => void;
  selectDate: (date: string | null) => void;
  subscribeToFeed: (sport: Sport) => void;
  unsubscribeFromFeed: () => void;
}
```


## Navigation Flow

```
App Launch
    │
    ▼
app/index.tsx  ──── has session? ──── YES ──► (tabs)/_layout.tsx
                         │
                        NO
                         │
                         ▼
              (auth)/_layout.tsx
                    │
                    ▼
              login.tsx  ──── sign in / sign up ──► has profile? ──── YES ──► (tabs)
                                                          │
                                                         NO
                                                          │
                                                          ▼
                                                  onboarding.tsx
                                                  (role selection + profile wizard)
                                                          │
                                                          ▼
                                                      (tabs)

(tabs)/_layout.tsx
    ├── discover.tsx          (tab 1 — Home)
    ├── connect.tsx           (tab 2 — Connect)
    ├── community.tsx         (tab 3 — Community)
    └── profile.tsx           (tab 4 — Profile)

Modal Screens (pushed over tabs):
    ├── coach/[id].tsx        ← from connect.tsx or discover.tsx
    ├── event/[id].tsx        ← from community.tsx or discover.tsx
    └── admin/index.tsx       ← from profile.tsx (admin role only)
```

### Navigation Rules

- `app/index.tsx` checks `authStore.isAuthenticated` and `authStore.user` for an existing profile. It redirects to `(auth)/login` or `(tabs)/discover` accordingly.
- `(auth)/_layout.tsx` uses a Stack navigator with no tab bar.
- `(tabs)/_layout.tsx` uses Expo Router's `Tabs` component with custom tab bar icons using the design system colors.
- Coach detail and event detail are pushed as modals using `router.push('/coach/[id]')` and `router.push('/event/[id]')`.
- The admin screen is only accessible when `user.role === 'admin'`.


## Screen Component Breakdown

### Discover Screen (`app/(tabs)/discover.tsx`)

**Components used:**
- `HeroSection` — displays `user.displayName` + `Badge` with role
- `FeaturedEventCard` (×3) — tappable, navigates to `event/[id]`
- `HighlightPostCard` (×3) — read-only post preview
- `Card` with quick-link buttons to Connect and Community tabs
- Conditional `Banner` for pending coach status

**Data fetched:**
- `eventService.getUpcomingEvents(3, sport)` → populates featured events
- `postService.getPosts(sport, 3)` → populates community highlights
- `authStore.user` + `coachService.getVerificationStatus(userId)` → drives conditional banners

**User interactions:**
- Tap featured event card → `router.push('/event/[id]')`
- Tap "Find a Coach" quick link → `router.push('/(tabs)/connect')`
- Tap "Join the Community" quick link → `router.push('/(tabs)/community')`

---

### Connect Screen (`app/(tabs)/connect.tsx`)

**Components used (Player view):**
- `BestMatchSection` — top 3 coaches from `coachStore.bestMatches`
- `CoachFilters` — filter bar bound to `coachStore.activeFilters`
- `FlatList` of `CoachCard` — from `coachStore.filteredCoaches`
- `EmptyState` — shown when `filteredCoaches.length === 0`

**Components used (Coach view):**
- `CoachCard` (own profile summary, read-only)
- `FlatList` of `SessionRequestItem` — incoming requests
- Pending status message if `verificationStatus !== 'approved'`

**Data fetched:**
- `coachStore.fetchCoaches(sport)` on mount
- `coachStore.computeBestMatches(playerProfile)` after coaches load
- `sessionService.getSessionRequestsByCoach(coachId)` for coach view

**User interactions:**
- Tap coach card → `router.push('/coach/[id]')`
- Change filter → `coachStore.applyFilters(filters)`
- Tap "Request Session" in coach detail → `sessionService.createSessionRequest(...)`
- Coach taps session request → inline accept/decline via `sessionService.updateSessionStatus(...)`

---

### Community Screen (`app/(tabs)/community.tsx`)

**Components used:**
- `EventCalendar` — monthly calendar with dot indicators on event dates
- `FlatList` of `EventCard` — events for `communityStore.selectedDate`
- `FlatList` of `PostCard` — `communityStore.posts` in reverse chronological order
- `CreatePostForm` — inline at top of feed
- `CreateEventModal` — full-screen modal triggered by FAB

**Data fetched:**
- `communityStore.fetchPosts(sport)` on mount
- `communityStore.fetchEvents(sport)` on mount
- `communityStore.subscribeToFeed(sport)` on mount (Realtime)
- `communityStore.unsubscribeFromFeed()` on unmount

**User interactions:**
- Tap calendar date → `communityStore.selectDate(date)`
- Submit post form → `postService.createPost(input)` → `communityStore.addPost(post)`
- Tap "Create Event" FAB → open `CreateEventModal`
- Submit event form → `eventService.createEvent(input)` → `communityStore.addEvent(event)` + `postService.createPost(announcementPost)`
- Tap event card → `router.push('/event/[id]')`

---

### Profile Screen (`app/(tabs)/profile.tsx`)

**Components used:**
- `Avatar` — profile photo with fallback initials
- `Badge` — role badge + verification status badge (coach only)
- `PlayerProfileView` or `CoachProfileView` — role-conditional rendering
- Inline edit form (toggled by "Edit Profile" button)

**Data fetched:**
- `authStore.user` — display name, location, role
- `playerService.getPlayer(userId)` or `coachService.getCoachById(userId)` — role-specific data

**User interactions:**
- Tap "Edit Profile" → toggle inline edit form
- Save edits → `playerService.updatePlayer(...)` or `coachService.updateCoach(...)` → update local state
- Tap "Sign Out" → `authStore.signOut()`
- Admin role: tap "Admin Panel" → `router.push('/admin')`


## Coach Matching Algorithm

The "Best Match" section in the Connect screen computes a score for each approved coach relative to the current player's profile. The top 3 coaches by score are returned.

### Scoring Function

```typescript
// Implemented in store/coachStore.ts → computeBestMatches()

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
```

### Algorithm Steps

1. Start with `coachStore.coaches` (already filtered to `verificationStatus === 'approved'`)
2. Score each coach using `scoreCoach(coach, playerProfile)`
3. Sort descending by score
4. Return the top 3 (or fewer if fewer than 3 coaches exist)
5. Store result in `coachStore.bestMatches`

The algorithm runs client-side after the coach list is fetched. It re-runs whenever `activeFilters` change or the player profile is updated.


## Design System Tokens

### `constants/theme.ts`

```typescript
export const colors = {
  // Brand
  lime:   '#c8f135',  // Primary accent — CTAs, active states, focus rings
  gold:   '#f5c842',  // Secondary accent — badges, highlights
  silver: '#b0bec5',  // Tertiary — disabled states, secondary text

  // Backgrounds (dark theme, darkest → lightest)
  black:  '#070906',  // App background
  dark:   '#0d1009',  // Screen background
  panel:  '#111509',  // Section panels
  card:   '#161b0e',  // Card surfaces
  border: '#1f2614',  // Borders and dividers

  // Text
  muted:  '#485535',  // Placeholder text, disabled labels
  text:   '#c8d9b4',  // Body text
  white:  '#eaf4d8',  // Headings, high-emphasis text
} as const;

export const typography = {
  fonts: {
    heading: 'BebasNeue-Regular',
    body:    'DMSans-Regular',
    medium:  'DMSans-Medium',
    semiBold:'DMSans-SemiBold',
  },
  weights: {
    light:    '300' as const,
    regular:  '400' as const,
    medium:   '500' as const,
    semiBold: '600' as const,
  },
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  base:16,
  lg:  24,
  xl:  32,
  '2xl': 48,
} as const;

export const radii = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Only approved coaches appear in listings

*For any* set of coaches in the database, every coach returned by `coachService.getCoaches()` must have `verificationStatus === 'approved'`. No coach with `verificationStatus === 'pending'` or `verificationStatus === 'rejected'` may appear in any listing or search result.

**Validates: Requirements 5.1, 6.5**

---

### Property 2: Coach onboarding sets verificationStatus to "pending"

*For any* user who completes the coach onboarding flow, the resulting `CoachProfile` record must have `verificationStatus === 'pending'` immediately after creation, before any admin action.

**Validates: Requirements 3.5, 6.1**

---

### Property 3: Admin approval/rejection is reflected in verification status

*For any* coach profile, calling `adminService.approveCoach(coachId)` must result in `verificationStatus === 'approved'`, and calling `adminService.rejectCoach(coachId)` must result in `verificationStatus === 'rejected'`. The status change must be immediately visible in subsequent reads.

**Validates: Requirements 6.3, 6.4**

---

### Property 4: Filter results are a subset of the unfiltered approved coach list

*For any* combination of filter values (`skillLevel`, `speciality`, `maxRate`), the set of coaches returned by `coachService.getCoaches(filters)` must be a subset of the coaches returned by `coachService.getCoaches()` (no filters). No coach may appear in filtered results that does not appear in the unfiltered list.

**Validates: Requirements 5.3, 5.6**

---

### Property 5: Sport field defaults to "tennis" and enables sport-based filtering

*For any* entity (user, player, coach, event, post, session request) created without explicitly specifying a `sport` value, the persisted record must have `sport === 'tennis'`. Furthermore, for any entity created with a specific sport value `s`, querying by `sport = s` must return that entity.

**Validates: Requirements 2.3, 2.8**

---

### Property 6: Empty or whitespace-only submissions are rejected

*For any* string composed entirely of whitespace characters (including the empty string), submitting it as a post body must be rejected by the service layer and must not result in a persisted record. Similarly, submitting an event creation form with any required field (name, date, time, location) missing or blank must be rejected before any database write occurs.

**Validates: Requirements 7.3, 7.8**

---

### Property 7: Post creation round-trip

*For any* valid post body string (non-empty, non-whitespace), calling `postService.createPost({ body })` and then `postService.getPosts()` must return a list that contains a post with the same body authored by the current user.

**Validates: Requirements 7.2**

---

### Property 8: Event creation appears in both calendar and feed

*For any* valid event creation input, calling `eventService.createEvent(input)` must result in: (a) `eventService.getEventsByDate(input.eventDate)` returning a list that includes the new event, and (b) `postService.getPosts()` returning a list that includes an announcement post referencing the event.

**Validates: Requirements 7.7**

---

### Property 9: Session request references valid player and coach IDs

*For any* session request created via `sessionService.createSessionRequest(input)`, the persisted record must have a `playerId` that references an existing row in the `players` table and a `coachId` that references an existing row in the `coaches` table with `verificationStatus === 'approved'`. A session request targeting a non-approved coach must be rejected.

**Validates: Requirements 5.5**

---

### Property 10: Profile update round-trip

*For any* profile update (player or coach), calling `playerService.updatePlayer(userId, input)` or `coachService.updateCoach(userId, input)` and then immediately fetching the profile must return a record whose updated fields match the values that were submitted.

**Validates: Requirements 8.6**

---

### Property 11: Feed is in reverse chronological order

*For any* set of posts, `postService.getPosts()` must return them ordered by `createdAt` descending — the most recently created post must appear first. For any two posts A and B where `A.createdAt > B.createdAt`, A must appear before B in the result.

**Validates: Requirements 7.1**

---

### Property 12: Featured events are the next N upcoming

*For any* set of events, `eventService.getUpcomingEvents(n)` must return exactly `min(n, totalUpcoming)` events, all with `eventDate >= today`, ordered by `eventDate` ascending. No past events may appear in the result.

**Validates: Requirements 4.2**

---

### Property 13: Auth state is populated after sign-in

*For any* valid email/password pair, after `authService.signIn(email, password)` succeeds, `authStore.user` must be non-null, `authStore.isAuthenticated` must be `true`, and `authStore.role` must match the `role` field of the returned user record.

**Validates: Requirements 2.10**

---

### Property 14: Returning user skips onboarding

*For any* authenticated user who already has a record in `public.users` with a non-null `role`, the app must navigate directly to `(tabs)/discover` on launch without presenting the onboarding screen.

**Validates: Requirements 3.7**


## Error Handling

### Service Layer Errors

All service functions follow a consistent error pattern. Rather than throwing, they return a result object or throw a typed `ServiceError`:

```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN',
    public originalError?: unknown
  ) {
    super(message);
  }
}
```

Screens catch `ServiceError` and map `code` to user-facing messages. Network errors show a toast; validation errors show inline field messages.

### Validation Rules (enforced in service layer before DB write)

| Entity | Rule |
|--------|------|
| Post | `body.trim().length > 0` |
| Event | `name`, `location`, `eventDate`, `eventTime` all non-empty |
| SessionRequest | `coachId` must reference an approved coach |
| CoachProfile | `rateMin <= rateMax`, `yearsExperience >= 0` |
| PlayerProfile | `skillLevel` and `playStyle` must be valid enum values |

### Realtime Subscription Error Handling

If the Supabase Realtime connection drops, `communityStore` sets a `realtimeError` flag. The Community screen displays a non-blocking banner: "Live updates paused — pull to refresh." The subscription is automatically retried on reconnect.

### Auth Errors

- Invalid credentials → inline error on login form: "Incorrect email or password"
- Email already in use → "An account with this email already exists"
- Session expired → redirect to `(auth)/login` with a toast: "Your session has expired"


## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests catch concrete bugs in specific scenarios and edge cases
- Property-based tests verify universal correctness across all valid inputs

### Unit Tests

Focus areas:
- Service layer functions with mocked Supabase client (verify correct query construction, error mapping)
- Zustand store actions (verify state transitions: `applyFilters`, `computeBestMatches`, `addPost`)
- Validation logic (post body, event form required fields)
- Navigation guard logic (auth redirect, onboarding skip)
- Coach matching algorithm (`scoreCoach` function with known inputs)
- Component rendering with specific props (role-conditional UI, empty states)

### Property-Based Tests

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (TypeScript-native, works with Jest/Vitest)

**Configuration:** Each property test runs a minimum of **100 iterations** with randomized inputs.

**Tag format:** Each test must include a comment: `// Feature: attivo-tennis-platform, Property N: <property_text>`

#### Property Test Specifications

**Property 1 — Only approved coaches appear in listings**
```
// Feature: attivo-tennis-platform, Property 1: Only approved coaches appear in listings
// Generate: array of CoachProfile with random verificationStatus values
// Action: call getCoaches() (or filter logic)
// Assert: every result has verificationStatus === 'approved'
```

**Property 2 — Coach onboarding sets verificationStatus to "pending"**
```
// Feature: attivo-tennis-platform, Property 2: Coach onboarding sets verificationStatus to pending
// Generate: random CreateCoachInput
// Action: call createCoach(input)
// Assert: result.verificationStatus === 'pending'
```

**Property 3 — Admin approval/rejection is reflected immediately**
```
// Feature: attivo-tennis-platform, Property 3: Admin action updates verificationStatus
// Generate: random coach profile
// Action: approveCoach(id) then getCoachById(id)
// Assert: verificationStatus === 'approved'
// Repeat for rejectCoach → 'rejected'
```

**Property 4 — Filter results are a subset of unfiltered list**
```
// Feature: attivo-tennis-platform, Property 4: Filter results are a subset of unfiltered list
// Generate: array of approved CoachProfile + random CoachFilters
// Action: apply filters
// Assert: every filtered result exists in the unfiltered list
```

**Property 5 — Sport field defaults to "tennis"**
```
// Feature: attivo-tennis-platform, Property 5: Sport defaults to tennis
// Generate: any entity creation input without sport field
// Action: create entity
// Assert: persisted record has sport === 'tennis'
```

**Property 6 — Empty/whitespace submissions are rejected**
```
// Feature: attivo-tennis-platform, Property 6: Empty or whitespace submissions are rejected
// Generate: strings matching /^\s*$/ (empty or all whitespace)
// Action: attempt createPost({ body: generated })
// Assert: throws ServiceError with code === 'VALIDATION', no DB write
```

**Property 7 — Post creation round-trip**
```
// Feature: attivo-tennis-platform, Property 7: Post creation round-trip
// Generate: random non-empty post body string
// Action: createPost({ body }) then getPosts()
// Assert: result contains a post with matching body and correct authorId
```

**Property 8 — Event creation appears in calendar and feed**
```
// Feature: attivo-tennis-platform, Property 8: Event creation appears in calendar and feed
// Generate: random valid CreateEventInput
// Action: createEvent(input) then getEventsByDate(input.eventDate) + getPosts()
// Assert: event appears in date results; announcement post appears in feed
```

**Property 9 — Session request references valid IDs**
```
// Feature: attivo-tennis-platform, Property 9: Session request references valid player and coach IDs
// Generate: random player ID + non-approved coach ID
// Action: attempt createSessionRequest({ playerId, coachId })
// Assert: throws ServiceError (coach not approved)
```

**Property 10 — Profile update round-trip**
```
// Feature: attivo-tennis-platform, Property 10: Profile update round-trip
// Generate: random UpdatePlayerInput or UpdateCoachInput
// Action: updatePlayer/updateCoach then getPlayer/getCoachById
// Assert: returned profile fields match submitted update values
```

**Property 11 — Feed is in reverse chronological order**
```
// Feature: attivo-tennis-platform, Property 11: Feed is in reverse chronological order
// Generate: array of Post with random createdAt timestamps
// Action: getPosts()
// Assert: for every adjacent pair [a, b] in result, a.createdAt >= b.createdAt
```

**Property 12 — Featured events are the next N upcoming**
```
// Feature: attivo-tennis-platform, Property 12: Featured events are the next N upcoming
// Generate: array of Event with random eventDate values (past and future), random N
// Action: getUpcomingEvents(N)
// Assert: result.length === min(N, futureEvents.length)
//         every result has eventDate >= today
//         result is sorted ascending by eventDate
```

**Property 13 — Auth state is populated after sign-in**
```
// Feature: attivo-tennis-platform, Property 13: Auth state is populated after sign-in
// Generate: valid user credentials
// Action: signIn(email, password) then read authStore
// Assert: authStore.user !== null, authStore.isAuthenticated === true,
//         authStore.role === user.role
```

**Property 14 — Returning user skips onboarding**
```
// Feature: attivo-tennis-platform, Property 14: Returning user skips onboarding
// Generate: authenticated user with existing role in public.users
// Action: app launch (index.tsx redirect logic)
// Assert: navigation target is (tabs)/discover, not (auth)/onboarding
```

### Test File Locations

```
__tests__/
├── services/
│   ├── authService.test.ts
│   ├── coachService.test.ts
│   ├── playerService.test.ts
│   ├── sessionService.test.ts
│   ├── eventService.test.ts
│   └── postService.test.ts
├── store/
│   ├── authStore.test.ts
│   ├── coachStore.test.ts
│   └── communityStore.test.ts
├── properties/
│   ├── coachListing.property.test.ts   # Properties 1, 2, 3, 4
│   ├── sportField.property.test.ts     # Property 5
│   ├── validation.property.test.ts     # Properties 6, 9
│   ├── roundTrip.property.test.ts      # Properties 7, 8, 10
│   └── ordering.property.test.ts       # Properties 11, 12, 13, 14
└── components/
    ├── CoachCard.test.tsx
    ├── PostCard.test.tsx
    └── EventCalendar.test.tsx
```


## Deployment & Environment Configuration

### Environment Variables

**Required Environment Variables:**

```bash
# .env.example

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
EXPO_PUBLIC_API_VERSION=1.0
EXPO_PUBLIC_API_TIMEOUT=30000

# Feature Flags (optional, defaults to false)
EXPO_PUBLIC_ENABLE_REALTIME_FEED=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true

# Analytics (optional)
EXPO_PUBLIC_ANALYTICS_KEY=your-analytics-key

# Error Reporting (optional)
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Environment
EXPO_PUBLIC_ENVIRONMENT=development  # development | staging | production
```

**Environment-Specific Configuration:**

```typescript
// constants/config.ts

interface AppConfig {
  apiUrl: string;
  apiVersion: string;
  apiTimeout: number;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enableDebugMode: boolean;
  cacheConfig: {
    defaultTTL: number;
    maxSize: number;
  };
}

const developmentConfig: AppConfig = {
  apiUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  apiVersion: '1.0',
  apiTimeout: 30000,
  enableAnalytics: false,
  enableErrorReporting: false,
  enableDebugMode: true,
  cacheConfig: {
    defaultTTL: 60000,  // 1 minute for faster testing
    maxSize: 50,
  },
};

const productionConfig: AppConfig = {
  apiUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  apiVersion: '1.0',
  apiTimeout: 15000,
  enableAnalytics: true,
  enableErrorReporting: true,
  enableDebugMode: false,
  cacheConfig: {
    defaultTTL: 300000,  // 5 minutes
    maxSize: 200,
  },
};

export const config = 
  process.env.EXPO_PUBLIC_ENVIRONMENT === 'production'
    ? productionConfig
    : developmentConfig;
```

---

### Deployment Checklist

**Pre-Deployment:**

- [ ] All tests passing (unit + property-based)
- [ ] No console.log statements in production code
- [ ] Environment variables configured for target environment
- [ ] Database migrations applied to target database
- [ ] RLS policies tested and verified
- [ ] Error reporting configured (Sentry, Bugsnag)
- [ ] Analytics configured (Firebase, Mixpanel)
- [ ] App icons and splash screens generated
- [ ] Privacy policy and terms of service URLs updated
- [ ] App store metadata prepared (screenshots, descriptions)

**Build Configuration:**

```json
// app.json

{
  "expo": {
    "name": "ATTIVO",
    "slug": "attivo-tennis",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#070906"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.attivo.tennis",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#070906"
      },
      "package": "com.attivo.tennis",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**EAS Build Configuration:**

```json
// eas.json

{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "staging"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

### Monitoring & Observability

**Health Check Endpoint:**

```typescript
// services/healthCheck.ts

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    auth: 'up' | 'down';
    storage: 'up' | 'down';
    realtime: 'up' | 'down';
  };
  version: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    supabase.from('users').select('count').limit(1),  // Database
    supabase.auth.getSession(),                        // Auth
    // Add more checks as needed
  ]);
  
  return {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: checks[0].status === 'fulfilled' ? 'up' : 'down',
      auth: checks[1].status === 'fulfilled' ? 'up' : 'down',
      storage: 'up',  // Placeholder
      realtime: 'up', // Placeholder
    },
    version: API_VERSION,
  };
}
```

**Performance Metrics:**

```typescript
// lib/monitoring/metrics.ts

interface PerformanceMetrics {
  screenLoadTimes: Map<string, number[]>;
  apiCallDurations: Map<string, number[]>;
  errorCounts: Map<string, number>;
  cacheHitRate: number;
}

class MetricsCollector {
  private metrics: PerformanceMetrics = {
    screenLoadTimes: new Map(),
    apiCallDurations: new Map(),
    errorCounts: new Map(),
    cacheHitRate: 0,
  };
  
  recordScreenLoad(screenName: string, duration: number): void {
    const times = this.metrics.screenLoadTimes.get(screenName) || [];
    times.push(duration);
    this.metrics.screenLoadTimes.set(screenName, times);
  }
  
  recordApiCall(operation: string, duration: number): void {
    const durations = this.metrics.apiCallDurations.get(operation) || [];
    durations.push(duration);
    this.metrics.apiCallDurations.set(operation, durations);
  }
  
  recordError(errorType: string): void {
    const count = this.metrics.errorCounts.get(errorType) || 0;
    this.metrics.errorCounts.set(errorType, count + 1);
  }
  
  getMetrics(): PerformanceMetrics {
    return this.metrics;
  }
  
  // Send metrics to monitoring service every 5 minutes
  async flush(): Promise<void> {
    // Send to Firebase Analytics, Mixpanel, etc.
    await analytics.track('performance_metrics', this.getMetrics());
    this.reset();
  }
  
  private reset(): void {
    this.metrics = {
      screenLoadTimes: new Map(),
      apiCallDurations: new Map(),
      errorCounts: new Map(),
      cacheHitRate: 0,
    };
  }
}
```

---

### Scaling Considerations

**Database Optimization:**

1. **Connection Pooling**: Supabase handles this automatically
2. **Query Optimization**: Use indexes on frequently queried columns
3. **Materialized Views**: For complex aggregations (future)
4. **Read Replicas**: For read-heavy workloads (future)

**Caching Strategy:**

1. **Client-Side Cache**: 5-10 minute TTL for most data
2. **CDN Caching**: For static assets (images, fonts)
3. **Edge Caching**: Supabase Edge Functions (future)

**Rate Limiting:**

1. **Client-Side**: Prevent abuse from single device
2. **Server-Side**: Supabase RLS + rate limiting policies
3. **API Gateway**: Cloudflare or AWS API Gateway (future)

**Horizontal Scaling:**

The architecture supports horizontal scaling:
- Stateless service layer (no server-side sessions)
- Database handles concurrency via RLS
- Realtime subscriptions scale with Supabase infrastructure
- Client-side caching reduces database load

---

### Future Enhancements Roadmap

**Phase 2 (Post-MVP):**
- In-app messaging between players and coaches
- Push notifications for session requests and events
- Payment integration for coach sessions
- Coach ratings and reviews
- Advanced search with geolocation

**Phase 3 (Growth):**
- Video session support (Zoom/Google Meet integration)
- Multi-sport expansion (skiing, hiking, climbing)
- Venue discovery and booking
- Tournament management
- Team/group features

**Phase 4 (Scale):**
- AI-powered coach matching
- Personalized training plans
- Performance analytics dashboard
- Social features (follow, like, comment)
- Marketplace for equipment and gear

---

## Summary

This design document provides a production-ready architecture for the ATTIVO Tennis Platform MVP. Key strengths:

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
2. **Extensibility**: Sport-agnostic design allows easy expansion to new sports
3. **Scalability**: Caching, pagination, and offline support for performance
4. **Maintainability**: TypeScript, service layer abstraction, and comprehensive testing
5. **Security**: RLS policies, input sanitization, and rate limiting
6. **Observability**: Analytics, error reporting, and performance monitoring

The architecture is designed for a team with limited experience to build a robust, scalable mobile application following industry best practices. Each layer has clear responsibilities, making it easy to understand, test, and extend.
