# Implementation Plan: ATTIVO Tennis Platform

## Overview

This plan converts the ATTIVO design into incremental coding tasks. The scaffold, types, Supabase client, all services (auth, player, coach, event, post, session, admin), all stores (auth, coach, community), and all hooks (useAuth, useCoaches, useFeed, useEvents, useProfile) are already implemented. Basic UI primitives (Button, Input, Badge) exist.

Remaining work focuses on: additional UI components (Card, Avatar, EmptyState, etc.), feature-specific components (Discover, Connect, Community, Profile), screen implementations, navigation wiring, error handling infrastructure, testing, and deployment configuration.

TypeScript is used throughout, matching the existing codebase.

## Tasks

- [x] 1. Supabase Database Setup
  - [x] 1.1 Write SQL migration 001_initial_schema.sql
    - Create `migrations/supabase/001_initial_schema.sql` with full DDL for all six tables: `users`, `players`, `coaches`, `events`, `posts`, `session_requests`
    - Include all column definitions, CHECK constraints, DEFAULT values, and foreign key references exactly as specified in the design schema section
    - Every table must include a `sport VARCHAR(50) NOT NULL DEFAULT 'tennis'` column
    - _Requirements: 2.1, 2.3, 2.8_

  - [x] 1.2 Write SQL migration 002_add_indexes.sql
    - Create `migrations/supabase/002_add_indexes.sql` with all `CREATE INDEX IF NOT EXISTS` statements for every table
    - Include indexes on: `users(role)`, `users(sport)`, `players(user_id)`, `players(sport)`, `players(skill_level)`, `coaches(user_id)`, `coaches(verification_status)`, `coaches(sport)`, `coaches(speciality)`, `events(event_date)`, `events(creator_id)`, `events(sport)`, `events(category)`, `posts(author_id)`, `posts(created_at DESC)`, `posts(sport)`, `session_requests(player_id)`, `session_requests(coach_id)`, `session_requests(status)`, `session_requests(sport)`
    - _Requirements: 2.1_

  - [x] 1.3 Write SQL migration 003_rls_policies.sql
    - Create `migrations/supabase/003_rls_policies.sql` enabling RLS on all six tables and defining SELECT/INSERT/UPDATE/DELETE policies per the design's RLS policy specifications
    - `users`: authenticated read-all, self-insert, self-update, self-delete
    - `players`: authenticated read-all, self-insert (`user_id = auth.uid()`), self-update
    - `coaches`: authenticated read approved-only (non-admin), admin read-all, self-insert, self-update + admin can update `verification_status`
    - `events`: authenticated read-all, authenticated insert, creator-update, creator-delete
    - `posts`: authenticated read-all, authenticated insert (`author_id = auth.uid()`), author-update, author-delete
    - `session_requests`: player reads own, coach reads directed-at-them, admin reads all; player inserts own; coach updates status on own; player cancels own pending
    - _Requirements: 2.4_

  - [x] 1.4 Create .env and .env.example files
    - Create `attivo/.env.example` with placeholder values for `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_VERSION`, `EXPO_PUBLIC_API_TIMEOUT`, `EXPO_PUBLIC_ENABLE_REALTIME_FEED`, `EXPO_PUBLIC_ENVIRONMENT`
    - Verify `attivo/.env` exists (or document that the developer must create it from `.env.example` after creating their Supabase project)
    - _Requirements: 2.1, 2.2_

- [x] 2. Service Layer (All Complete)
  - [x] 2.1 Implement eventService.ts ✓
    - _Requirements: 2.5, 2.6, 2.7, 4.2, 7.4, 7.5_

  - [x] 2.2 Implement postService.ts ✓
    - _Requirements: 2.5, 2.6, 2.7, 7.2, 7.3_

  - [x] 2.3 Implement sessionService.ts ✓
    - _Requirements: 2.5, 2.6, 5.5, 5.7_

  - [x] 2.4 Implement adminService.ts ✓
    - _Requirements: 2.5, 2.6, 6.2, 6.3, 6.4_

- [x] 3. Zustand Stores (All Complete)
  - [x] 3.1 Implement coachStore.ts ✓
    - _Requirements: 1.6, 5.2, 5.3, 5.6_

  - [x] 3.2 Implement communityStore.ts ✓
    - _Requirements: 1.6, 2.9, 7.1, 7.4_

- [x] 4. Custom Hooks (All Complete)
  - [x] 4.1 Implement useAuth.ts ✓
    - _Requirements: 1.6, 2.10_

  - [x] 4.2 Implement useCoaches.ts ✓
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [x] 4.3 Implement useFeed.ts ✓
    - _Requirements: 2.9, 7.1, 7.2_

  - [x] 4.4 Implement useEvents.ts ✓
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [x] 4.5 Implement useProfile.ts ✓
    - _Requirements: 8.1, 8.5, 8.6, 8.7_

- [ ] 5. UI Primitives Upgrade
  - [ ] 5.1 Create additional UI components
    - Create `components/ui/Card.tsx` — react-native-paper `Surface` wrapper with `colors.card` background, `colors.border` border, `radii.lg` border radius, and `shadows.card` shadow
    - Create `components/ui/Avatar.tsx` — circular image with fallback initials rendered in a `colors.panel` circle; accepts `uri?`, `displayName`, `size` props
    - Create `components/ui/EmptyState.tsx` — centered icon (Ionicons), title, and subtitle text; accepts `icon`, `title`, `message` props; uses theme tokens
    - Create `components/ui/ErrorBanner.tsx` — dismissible banner with `colors.error` background; accepts `message` and `onDismiss` props
    - Create `components/ui/Toast.tsx` — temporary bottom notification using react-native-paper `Snackbar`; accepts `message`, `visible`, `onDismiss` props
    - Create `components/ui/LoadingSpinner.tsx` — centered react-native-paper `ActivityIndicator` with `colors.lime` color
    - _Requirements: 1.7, 9.1, 9.4, 9.5_

  - [ ] 5.2 Upgrade tab bar icons to use @expo/vector-icons Ionicons
    - Modify `app/(tabs)/_layout.tsx` to replace emoji `<Text>` icons with `<Ionicons>` from `@expo/vector-icons`
    - Use: `home` / `home-outline` for Discover, `tennisball` / `tennisball-outline` for Connect, `people` / `people-outline` for Community, `person` / `person-outline` for Profile
    - Active icon uses filled variant with `colors.lime`; inactive uses outline variant with `colors.muted`
    - _Requirements: 9.1, 9.4_

- [ ] 6. Feature Components
  - [ ] 6.1 Implement Discover components
    - Create `components/discover/HeroSection.tsx` — displays `user.displayName` in Bebas Neue heading + `Badge` showing role; uses `colors.lime` accent; accepts `user` prop
    - Create `components/discover/FeaturedEventCard.tsx` — compact card showing event name, formatted date, category badge, and "View" `Button`; accepts `event: Event` and `onPress` props; uses `Card` from ui/
    - Create `components/discover/HighlightPostCard.tsx` — compact read-only post preview with `Avatar`, author name, truncated body (2 lines), and relative timestamp; accepts `post: Post` prop
    - _Requirements: 4.1, 4.2, 4.4, 9.1, 9.4_

  - [ ] 6.2 Implement Connect components
    - Create `components/connect/CoachCard.tsx` — card showing coach name, speciality, skill levels coached (as `Badge` chips), rate range, availability status badge, and a tappable surface; accepts `coach: CoachProfile` and `onPress` props
    - Create `components/connect/CoachFilters.tsx` — horizontal filter bar with react-native-paper `Chip` components for skill level, speciality text input, and max rate slider/input; accepts `filters: CoachFilters`, `onChange` props
    - Create `components/connect/BestMatchSection.tsx` — horizontal scroll of up to 3 `CoachCard` items with a "Best Match" heading; accepts `coaches: CoachProfile[]` and `onPress` props
    - Create `components/connect/SessionRequestItem.tsx` — row showing player name, message preview, status badge, and Accept/Decline buttons (coach view); accepts `request: SessionRequest`, `onAccept`, `onDecline` props
    - _Requirements: 5.1, 5.2, 5.4, 5.6, 5.7, 9.1, 9.4_

  - [ ] 6.3 Implement Community components
    - Create `components/community/PostCard.tsx` — card with `Avatar`, author display name, post body, and relative timestamp; accepts `post: Post` prop
    - Create `components/community/EventCard.tsx` — card with event name, category badge, formatted date/time, location, and optional max participants; accepts `event: Event` and `onPress` props
    - Create `components/community/CreatePostForm.tsx` — inline form with react-native-paper `TextInput` (multiline), character count, and submit `Button`; validates non-empty body before calling `onSubmit`; accepts `onSubmit: (input: CreatePostInput) => Promise<void>` prop
    - Create `components/community/CreateEventModal.tsx` — react-native-paper `Portal` + `Modal` with full form: name, category `SegmentedButtons`, date picker (text input YYYY-MM-DD), time input, location, max participants; validates required fields; accepts `visible`, `onDismiss`, `onSubmit` props
    - Create `components/community/EventCalendar.tsx` — monthly calendar grid built with React Native `View`/`Text`; highlights dates that have events with a `colors.lime` dot; tapping a date calls `onSelectDate`; accepts `events: Event[]`, `selectedDate`, `onSelectDate` props
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 9.1, 9.4_

  - [ ] 6.4 Implement Profile components
    - Create `components/profile/PlayerProfileView.tsx` — displays skill level badge, play style badge, and a placeholder match history section; accepts `player: PlayerProfile` prop
    - Create `components/profile/CoachProfileView.tsx` — displays speciality, years experience, rate range, certifications list, bio, and verification status badge (Pending Review / Verified / Not Approved with appropriate colors); accepts `coach: CoachProfile` prop
    - _Requirements: 8.2, 8.3, 8.4, 9.1, 9.4_

- [ ] 7. Checkpoint — Core Components
  - Ensure all UI components compile without TypeScript errors and render correctly in isolation. Ask the user if questions arise.

- [ ] 8. Onboarding Screen Enhancement
  - [ ] 8.1 Enhance app/(auth)/onboarding.tsx with complete role-specific flows
    - Extend the existing `onboarding.tsx` to add the missing player fields: `location` (text input) and `displayName` (text input, pre-filled from auth)
    - Extend the coach flow to add: `location`, `certifications` (comma-separated text input parsed to array), and `skillLevelsCoached` (multi-select chips for Beginner/Intermediate/Advanced/Competitive)
    - After creating the player/coach record, call a user update to set `role` on the `users` table row (PATCH `users` set `role = selectedRole` where `id = user.id`) and update `authStore` with the new role
    - Display the "pending review" note for coaches and navigate to `/(tabs)/discover` on completion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 9. Main Tab Screens
  - [ ] 9.1 Implement app/(tabs)/discover.tsx
    - Replace the placeholder screen with a `ScrollView` containing: `HeroSection` at top, "Featured Events" section with 3 `FeaturedEventCard` items (from `eventService.getUpcomingEvents(3)`), "Community Highlights" section with 3 `HighlightPostCard` items (from `postService.getPosts(sport, 3)`), and two quick-link `Card` buttons ("Find a Coach" → connect tab, "Join the Community" → community tab)
    - Show a `LoadingSpinner` while data loads; show `ErrorBanner` on error
    - When `role === 'player'` and `skillLevel === 'beginner'`, show a prominent "Find a Coach" prompt card
    - When `role === 'coach'` and `verificationStatus === 'pending'`, show a status banner: "Your profile is awaiting admin review"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 9.2 Implement app/(tabs)/connect.tsx
    - Replace the placeholder with role-conditional rendering:
    - **Player view**: `BestMatchSection` at top (computed from `coachStore.computeBestMatches`), `CoachFilters` bar, `FlatList` of `CoachCard` from `coachStore.filteredCoaches`, `EmptyState` when list is empty
    - **Coach view**: own profile summary `CoachCard` (read-only), `FlatList` of `SessionRequestItem` from `sessionService.getSessionRequestsByCoach`, pending status message if `verificationStatus !== 'approved'`
    - Tapping a `CoachCard` navigates to `router.push('/coach/' + coach.id)`
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 5.8, 5.9, 5.10_

  - [ ] 9.3 Implement app/(tabs)/community.tsx
    - Replace the placeholder with a tab view (react-native-paper `SegmentedButtons` or custom tabs) switching between "Feed" and "Events" views
    - **Feed tab**: `CreatePostForm` at top, `FlatList` of `PostCard` from `communityStore.posts`; realtime subscription via `useFeed`
    - **Events tab**: `EventCalendar` component, list of `EventCard` for `communityStore.eventsForSelectedDate`; react-native-paper `FAB` to open `CreateEventModal`
    - Show `LoadingSpinner` while loading; show `ErrorBanner` on error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ] 9.4 Implement app/(tabs)/profile.tsx
    - Replace the placeholder with: `Avatar` + display name + location + role `Badge` at top
    - Conditionally render `PlayerProfileView` or `CoachProfileView` based on role
    - "Edit Profile" button toggles an inline edit form with react-native-paper `TextInput` fields for display name, location, and role-specific fields
    - "Save" calls `useProfile.updateProfile(input)` and shows a `Toast` on success
    - "Sign Out" button calls `useAuth.signOut()`
    - Admin role shows an "Admin Panel" button that navigates to `/admin`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 10. Detail Modal Screens
  - [ ] 10.1 Implement app/coach/[id].tsx
    - Create the coach detail modal screen that reads `id` from `useLocalSearchParams()`
    - Fetch coach via `coachService.getCoachById(id)` on mount
    - Display: `Avatar`, display name, speciality, years experience, rate range, certifications list, bio, availability badge, and a "Request Session" `Button`
    - "Request Session" calls `sessionService.createSessionRequest({ playerId, coachId: id, sport })` and shows a `Toast` confirmation; button is hidden when `role === 'coach'`
    - Show `LoadingSpinner` while loading; show `ErrorBanner` on error
    - _Requirements: 5.4, 5.5_

  - [ ] 10.2 Implement app/event/[id].tsx
    - Create the event detail modal screen that reads `id` from `useLocalSearchParams()`
    - Fetch event via `eventService.getEvents()` filtered by id (or add `getEventById` to eventService)
    - Display: event name, category badge, formatted date and time, location, description, max participants, and creator name
    - Show `LoadingSpinner` while loading; show `ErrorBanner` on error
    - _Requirements: 4.3, 7.5_

  - [ ] 10.3 Implement app/admin/index.tsx
    - Create the admin screen accessible only when `user.role === 'admin'`
    - Fetch pending coaches via `adminService.getPendingCoaches()` on mount
    - Render a `FlatList` of pending coach rows showing name, speciality, years experience, certifications, and Approve / Reject buttons
    - Approve calls `adminService.approveCoach(coachId)` and removes the row from the list; Reject calls `adminService.rejectCoach(coachId)` and removes the row
    - Show `EmptyState` when no pending coaches remain
    - _Requirements: 6.2, 6.3, 6.4_

- [ ] 11. Navigation and Auth Guard
  - [ ] 11.1 Enhance app/index.tsx with loading state guard
    - Modify `app/index.tsx` to also check `isLoading` from `authStore`; render `null` (or a splash) while `isLoading === true` to prevent flash-of-wrong-screen
    - Confirm the three redirect paths are correct: unauthenticated → `/(auth)/login`, authenticated + no role → `/(auth)/onboarding`, authenticated + role → `/(tabs)/discover`
    - _Requirements: 3.7_

  - [ ] 11.2 Add Supabase auth state listener to app/_layout.tsx
    - Modify `app/_layout.tsx` to call `supabase.auth.onAuthStateChange` in a `useEffect`
    - On `SIGNED_OUT` event, call `authStore.setUser(null)` and navigate to `/(auth)/login`
    - On `SIGNED_IN` event, re-fetch the user from `authService.getCurrentUser()` and call `authStore.setUser(user)`
    - Wrap the `Stack` with react-native-paper `PaperProvider` using a dark theme derived from design tokens
    - _Requirements: 2.10_

- [ ] 12. Checkpoint — Full App Wiring
  - Ensure the full navigation flow works end-to-end: login → onboarding → tabs → modals → admin. Ensure all TypeScript errors are resolved. Ask the user if questions arise.

- [ ] 13. Error Handling and Resilience
  - [ ] 13.1 Implement lib/network/retryStrategy.ts
    - Create `lib/network/retryStrategy.ts` with the `withRetry<T>(operation, config?)` function using exponential backoff as specified in the design
    - Default config: `maxRetries: 3`, `initialDelay: 1000ms`, `maxDelay: 10000ms`, `backoffMultiplier: 2`
    - Only retry when `error instanceof ServiceError && error.isRetryable()` returns true
    - Export `RetryConfig` interface and `withRetry` function
    - _Requirements: 2.5_

  - [ ] 13.2 Implement lib/security/sanitize.ts
    - Create `lib/security/sanitize.ts` with `sanitizeInput(input: string): string` that strips HTML tags and trims whitespace
    - Create `sanitizePostBody(body: string): string` that calls `sanitizeInput` and truncates to 5000 characters
    - Update `postService.createPost` to call `sanitizePostBody` on `input.body` before inserting
    - _Requirements: 2.5, 7.2_

  - [ ] 13.3 Implement lib/security/rateLimiter.ts
    - Create `lib/security/rateLimiter.ts` with the `RateLimiter` class and `isAllowed(action, maxRequests, windowMs)` method as specified in the design
    - Export a singleton `rateLimiter` instance
    - Apply rate limiting in `postService.createPost` (10 posts per minute) and `sessionService.createSessionRequest` (5 requests per minute)
    - _Requirements: 2.5_

  - [ ] 13.4 Add global error boundary component
    - Create `components/ui/ErrorBoundary.tsx` — React class component implementing `componentDidCatch` and `getDerivedStateFromError`; renders a fallback UI with an error message and "Retry" button when a child throws
    - Wrap the `Stack` in `app/_layout.tsx` with `<ErrorBoundary>`
    - _Requirements: 2.5_

- [ ] 14. Testing Setup and Service Unit Tests
  - [ ] 14.1 Install testing dependencies and configure Jest/Vitest
    - Install `jest`, `@types/jest`, `jest-expo`, `fast-check`, and `ts-jest` (or configure `jest-expo` preset)
    - Create `jest.config.js` (or `jest.config.ts`) using the `jest-expo` preset with TypeScript support
    - Create `__tests__/` directory structure: `services/`, `store/`, `properties/`, `components/`
    - _Requirements: 1.1_

  - [ ] 14.2 Write unit tests for postService
    - Create `__tests__/services/postService.test.ts` with a mocked Supabase client
    - Test: `getPosts` returns posts ordered by `created_at DESC`
    - Test: `createPost` with empty body throws `ServiceError` with code `'VALIDATION'`
    - Test: `createPost` with whitespace-only body throws `ServiceError` with code `'VALIDATION'`
    - Test: `createPost` with valid body calls Supabase insert and returns a `Post`
    - _Requirements: 7.2, 7.3_

  - [ ] 14.3 Write unit tests for sessionService
    - Create `__tests__/services/sessionService.test.ts` with a mocked Supabase client
    - Test: `createSessionRequest` targeting a non-approved coach throws `ServiceError` with code `'VALIDATION'`
    - Test: `createSessionRequest` targeting an approved coach succeeds and returns a `SessionRequest`
    - Test: `updateSessionStatus` updates the status field correctly
    - _Requirements: 5.5_

  - [ ] 14.4 Write unit tests for coachStore matching algorithm
    - Create `__tests__/store/coachStore.test.ts`
    - Test `scoreCoach` with exact skill level match → score includes 40 pts
    - Test `scoreCoach` with adjacent skill level → score includes 20 pts
    - Test `scoreCoach` with non-matching skill level → 0 pts from skill component
    - Test `computeBestMatches` returns at most 3 coaches sorted by score descending
    - _Requirements: 5.6_

- [ ] 15. Property-Based Tests — Coach Listing
  - [ ]* 15.1 Write property test for Property 1: Only approved coaches appear in listings
    - Create `__tests__/properties/coachListing.property.test.ts`
    - Use `fast-check` to generate arrays of `CoachProfile` with random `verificationStatus` values
    - Apply the `getCoaches` filter logic (or mock the service to return the generated array filtered by `verification_status === 'approved'`)
    - Assert every result has `verificationStatus === 'approved'`
    - Tag: `// Feature: attivo-tennis-platform, Property 1: Only approved coaches appear in listings`
    - **Property 1: Only approved coaches appear in listings**
    - **Validates: Requirements 5.1, 6.5**

  - [ ]* 15.2 Write property test for Property 2: Coach onboarding sets verificationStatus to "pending"
    - In `__tests__/properties/coachListing.property.test.ts`
    - Generate random `CreateCoachInput` values using `fast-check` arbitraries
    - Mock `coachService.createCoach` to return the input mapped to a `CoachProfile`
    - Assert `result.verificationStatus === 'pending'` for all generated inputs
    - Tag: `// Feature: attivo-tennis-platform, Property 2: Coach onboarding sets verificationStatus to pending`
    - **Property 2: Coach onboarding sets verificationStatus to "pending"**
    - **Validates: Requirements 3.5, 6.1**

  - [ ]* 15.3 Write property test for Property 3: Admin approval/rejection is reflected in verification status
    - In `__tests__/properties/coachListing.property.test.ts`
    - Generate random coach profiles; mock `adminService.approveCoach` and `adminService.rejectCoach`
    - Assert `approveCoach` result has `verificationStatus === 'approved'`; `rejectCoach` result has `verificationStatus === 'rejected'`
    - Tag: `// Feature: attivo-tennis-platform, Property 3: Admin action updates verificationStatus`
    - **Property 3: Admin approval/rejection is reflected in verification status**
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 15.4 Write property test for Property 4: Filter results are a subset of unfiltered list
    - In `__tests__/properties/coachListing.property.test.ts`
    - Generate arrays of approved `CoachProfile` and random `CoachFilters`
    - Apply the client-side filter logic from `coachStore.applyFilters`
    - Assert every coach in the filtered result exists in the unfiltered list (by `id`)
    - Tag: `// Feature: attivo-tennis-platform, Property 4: Filter results are a subset of unfiltered list`
    - **Property 4: Filter results are a subset of the unfiltered approved coach list**
    - **Validates: Requirements 5.3, 5.6**

- [ ] 16. Property-Based Tests — Sport Field and Validation
  - [ ]* 16.1 Write property test for Property 5: Sport field defaults to "tennis"
    - Create `__tests__/properties/sportField.property.test.ts`
    - Generate entity creation inputs (player, coach, event, post) without a `sport` field using `fast-check`
    - Mock the respective service create functions to capture the inserted payload
    - Assert the inserted payload has `sport === 'tennis'`
    - Tag: `// Feature: attivo-tennis-platform, Property 5: Sport defaults to tennis`
    - **Property 5: Sport field defaults to "tennis" and enables sport-based filtering**
    - **Validates: Requirements 2.3, 2.8**

  - [ ]* 16.2 Write property test for Property 6: Empty or whitespace-only submissions are rejected
    - Create `__tests__/properties/validation.property.test.ts`
    - Use `fast-check` to generate strings matching `/^\s*$/` (empty or all-whitespace)
    - Call `postService.createPost({ body: generated })` and assert it throws `ServiceError` with `code === 'VALIDATION'`
    - Also generate event creation inputs with missing required fields (name, date, time, location set to empty string) and assert rejection
    - Tag: `// Feature: attivo-tennis-platform, Property 6: Empty or whitespace submissions are rejected`
    - **Property 6: Empty or whitespace-only submissions are rejected**
    - **Validates: Requirements 7.3, 7.8**

  - [ ]* 16.3 Write property test for Property 9: Session request references valid player and coach IDs
    - In `__tests__/properties/validation.property.test.ts`
    - Generate random player IDs and non-approved coach IDs
    - Mock `sessionService.createSessionRequest` to check coach approval status
    - Assert that requests targeting non-approved coaches throw `ServiceError`
    - Tag: `// Feature: attivo-tennis-platform, Property 9: Session request references valid player and coach IDs`
    - **Property 9: Session request references valid player and coach IDs**
    - **Validates: Requirements 5.5**

- [ ] 17. Property-Based Tests — Round-Trip and Ordering
  - [ ]* 17.1 Write property test for Property 7: Post creation round-trip
    - Create `__tests__/properties/roundTrip.property.test.ts`
    - Generate random non-empty, non-whitespace post body strings using `fast-check`
    - Mock `postService.createPost` to add the post to an in-memory array; mock `postService.getPosts` to return that array
    - Assert the returned list contains a post with the same body and correct `authorId`
    - Tag: `// Feature: attivo-tennis-platform, Property 7: Post creation round-trip`
    - **Property 7: Post creation round-trip**
    - **Validates: Requirements 7.2**

  - [ ]* 17.2 Write property test for Property 8: Event creation appears in calendar and feed
    - In `__tests__/properties/roundTrip.property.test.ts`
    - Generate random valid `CreateEventInput` values
    - Mock `eventService.createEvent`, `eventService.getEventsByDate`, and `postService.getPosts`
    - Assert the event appears in `getEventsByDate(input.eventDate)` and an announcement post appears in `getPosts()`
    - Tag: `// Feature: attivo-tennis-platform, Property 8: Event creation appears in calendar and feed`
    - **Property 8: Event creation appears in both calendar and feed**
    - **Validates: Requirements 7.7**

  - [ ]* 17.3 Write property test for Property 10: Profile update round-trip
    - In `__tests__/properties/roundTrip.property.test.ts`
    - Generate random `UpdatePlayerInput` values; mock `playerService.updatePlayer` and `playerService.getPlayer`
    - Assert the fetched profile after update has fields matching the submitted input
    - Repeat for `UpdateCoachInput` / `coachService.updateCoach` / `coachService.getCoachById`
    - Tag: `// Feature: attivo-tennis-platform, Property 10: Profile update round-trip`
    - **Property 10: Profile update round-trip**
    - **Validates: Requirements 8.6**

  - [ ]* 17.4 Write property test for Property 11: Feed is in reverse chronological order
    - Create `__tests__/properties/ordering.property.test.ts`
    - Generate arrays of `Post` with random `createdAt` ISO timestamp strings using `fast-check`
    - Sort them using the same logic as `postService.getPosts` (order by `created_at DESC`)
    - Assert for every adjacent pair `[a, b]` in the result, `a.createdAt >= b.createdAt`
    - Tag: `// Feature: attivo-tennis-platform, Property 11: Feed is in reverse chronological order`
    - **Property 11: Feed is in reverse chronological order**
    - **Validates: Requirements 7.1**

  - [ ]* 17.5 Write property test for Property 12: Featured events are the next N upcoming
    - In `__tests__/properties/ordering.property.test.ts`
    - Generate arrays of `Event` with random `eventDate` values (mix of past and future) and random `N` (1–10)
    - Apply the `getUpcomingEvents(N)` filter/sort logic
    - Assert: result length equals `min(N, futureEvents.length)`, all results have `eventDate >= today`, result is sorted ascending by `eventDate`
    - Tag: `// Feature: attivo-tennis-platform, Property 12: Featured events are the next N upcoming`
    - **Property 12: Featured events are the next N upcoming**
    - **Validates: Requirements 4.2**

  - [ ]* 17.6 Write property test for Property 13: Auth state is populated after sign-in
    - In `__tests__/properties/ordering.property.test.ts`
    - Generate valid user objects with random `role` values
    - Mock `authService.signIn` to return the generated user; call `authStore.setUser(user)`
    - Assert `authStore.user !== null`, `authStore.isAuthenticated === true`, `authStore.role === user.role`
    - Tag: `// Feature: attivo-tennis-platform, Property 13: Auth state is populated after sign-in`
    - **Property 13: Auth state is populated after sign-in**
    - **Validates: Requirements 2.10**

  - [ ]* 17.7 Write property test for Property 14: Returning user skips onboarding
    - In `__tests__/properties/ordering.property.test.ts`
    - Generate authenticated users with non-null `role` values
    - Test the redirect logic from `app/index.tsx` (extract it to a pure function for testability)
    - Assert the navigation target is `/(tabs)/discover` and not `/(auth)/onboarding`
    - Tag: `// Feature: attivo-tennis-platform, Property 14: Returning user skips onboarding`
    - **Property 14: Returning user skips onboarding**
    - **Validates: Requirements 3.7**

- [ ] 18. Deployment Prep
  - [ ] 18.1 Create eas.json build configuration
    - Create `attivo/eas.json` with `development`, `preview`, and `production` build profiles as specified in the design's deployment section
    - Development profile: `developmentClient: true`, `distribution: "internal"`, `EXPO_PUBLIC_ENVIRONMENT: "development"`
    - Preview profile: `distribution: "internal"`, `EXPO_PUBLIC_ENVIRONMENT: "staging"`
    - Production profile: `EXPO_PUBLIC_ENVIRONMENT: "production"`
    - Include `submit.production` configuration stubs for iOS and Android
    - _Requirements: 1.1_

  - [ ] 18.2 Review and update app.json
    - Verify `attivo/app.json` has correct `name: "ATTIVO"`, `slug: "attivo-tennis"`, `version: "1.0.0"`, `orientation: "portrait"`, `userInterfaceStyle: "dark"`, `splash.backgroundColor: "#070906"`
    - Set iOS `bundleIdentifier: "com.attivo.tennis"` and Android `package: "com.attivo.tennis"`
    - Ensure `plugins` array includes `"expo-router"` and `"expo-font"`
    - _Requirements: 1.1_

- [ ] 19. Final Checkpoint — All Tests Pass
  - Run the full test suite (`jest --testPathPattern='__tests__'`). Ensure all unit tests and property-based tests pass. Resolve any remaining TypeScript errors. Ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- All services must use `ServiceError` / `mapSupabaseError` from `services/errors.ts`
- All UI components must reference tokens from `constants/theme.ts` — no hardcoded colors, fonts, or spacing
- react-native-paper components (`Surface`, `TextInput`, `Button`, `Chip`, `FAB`, `Portal`, `Modal`, `Snackbar`, `ActivityIndicator`, `SegmentedButtons`) should be used for polished UI
- The Supabase project must be created manually at supabase.com before running migrations; migrations are applied via the Supabase dashboard SQL editor
- Property tests use `fast-check` with a minimum of 100 iterations per property
- Each property test file must include the tag comment: `// Feature: attivo-tennis-platform, Property N: <property_text>`
- `playerService.ts` is already complete — do not re-implement it
- `authService.ts`, `coachService.ts`, `services/supabase.ts`, `store/authStore.ts`, `types/index.ts`, `constants/theme.ts`, and basic UI primitives (`Button`, `Input`, `Badge`) are already built — tasks build on top of them

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["5.1", "5.2"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 9, "tasks": ["11.1", "11.2"] },
    { "id": 10, "tasks": ["13.1", "13.2", "13.3", "13.4"] },
    { "id": 11, "tasks": ["14.1"] },
    { "id": 12, "tasks": ["14.2", "14.3", "14.4"] },
    { "id": 13, "tasks": ["15.1", "15.2", "15.3", "15.4", "16.1", "16.2", "16.3"] },
    { "id": 14, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6", "17.7"] },
    { "id": 15, "tasks": ["18.1", "18.2"] }
  ]
}
```
