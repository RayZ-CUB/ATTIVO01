# Requirements Document

## Introduction

ATTIVO is a tennis-focused mobile-first platform built with React Native and Expo. The MVP focuses on two core pillars: connecting tennis players who want to improve with the right coaches, and fostering a local tennis community through a social feed and events calendar.

The app targets iOS, Android, and Web from a single codebase using Expo Router for navigation. It serves two primary user roles — Players and Coaches — through four tab screens: Discover (home), Connect (player–coach matching), Community (social feed + events), and Profile. The existing dark-theme visual identity (lime green #c8f135, Bebas Neue + DM Sans) is preserved and implemented as a React Native design system.

The platform uses Supabase (PostgreSQL database + Authentication + Storage + Realtime) as the backend. Tennis is the first sport vertical; the data model is designed to support multiple sports (skiing, hiking, climbing, etc.) in the future without code changes. All data entities include a `sport` field (defaults to "tennis" for MVP). The service layer abstracts all Supabase calls so screens and components never interact with the database directly.

---

## Tech Stack

### Frontend
- **React Native** with **Expo** (SDK 51+)
- **Expo Router** for file-based navigation
- **TypeScript** for type safety
- **Zustand** or **React Context** for state management
- **React Native Paper** or **NativeWind** (Tailwind for React Native) for UI components

### Backend
- **Supabase** (Backend-as-a-Service)
  - **PostgreSQL** relational database
  - **Supabase Auth** for email/password authentication
  - **Supabase Storage** for user-uploaded images (profile photos, event images)
  - **Supabase Realtime** for live feed updates

### Database Schema (PostgreSQL)
- `users` — user accounts (linked to Supabase Auth)
- `players` — player profiles (skill level, play style, location)
- `coaches` — coach profiles (speciality, rate, certifications, verification status)
- `events` — community events (matches, clinics, group sessions)
- `posts` — social feed posts
- `session_requests` — player-to-coach session booking requests

All tables include a `sport` column (defaults to "tennis") to support multi-sport expansion.

### Development Tools
- **Expo Go** for local development and testing
- **EAS Build** for production iOS/Android builds
- **Supabase CLI** for local database development and migrations

---

## Glossary

- **Platform**: The ATTIVO React Native / Expo application
- **Player**: A registered tennis player of any skill level (Beginner through Competitive) seeking to play, improve, or connect with coaches and other players
- **Coach**: A registered tennis coach offering lessons or clinics; must be verified by an admin before appearing in Connect listings
- **Session_Request**: A request from a Player to a Coach to book a coaching session
- **Profile**: A user's personal page containing role, skill level, availability, and role-specific details
- **Event**: A scheduled tennis session, clinic, match, or group session created by any user
- **Feed**: The community social feed where users post updates and event announcements
- **Discover_Screen**: The home tab showing featured events, community highlights, and quick links
- **Connect_Screen**: The player–coach matching tab
- **Community_Screen**: The social feed and event calendar tab
- **Profile_Screen**: The role-specific user profile tab
- **Design_System**: The shared React Native StyleSheet tokens defined in `constants/theme.ts`
- **Service_Layer**: The `services/` directory containing all Supabase client calls and data access functions, ensuring screens and components never call Supabase directly
- **Admin**: A privileged user who can approve or reject Coach profile verification requests
- **Supabase**: The backend-as-a-service platform providing PostgreSQL database, authentication, storage, and real-time subscriptions
- **Database**: A PostgreSQL relational database hosted on Supabase, containing tables for users, coaches, players, events, posts, and session requests
- **Multi_tenant_Data_Model**: A database design where all tables include a `sport` field, allowing the platform to support multiple sports from a single codebase by filtering queries by sport

---

## Requirements

### Requirement 1: React Native / Expo Project Structure

**User Story:** As a developer, I want the project organised as a proper React Native / Expo application, so that the codebase is maintainable, scalable, and ready for deployment to iOS, Android, and Web.

#### Acceptance Criteria

1. THE Platform SHALL be structured as an Expo project using Expo Router for file-based navigation, with the following top-level directories: `app/`, `components/`, `hooks/`, `services/`, `store/`, `types/`, `constants/`, and `assets/`.
2. THE Platform SHALL use the `app/(tabs)/` directory for the four main tab screens: `discover.tsx`, `connect.tsx`, `community.tsx`, and `profile.tsx`.
3. THE Platform SHALL define all TypeScript types and interfaces in the `types/` directory.
4. THE Service_Layer SHALL expose data access functions (read, write, update) for all entities (profiles, events, posts, session requests) so that the calling code does not reference Supabase or any database client directly.
5. THE Service_Layer SHALL abstract all Supabase client calls, ensuring that screens and components depend only on the service function signatures, not on Supabase-specific implementation details.
6. THE Platform SHALL use a state management solution (Zustand or React Context) in the `store/` directory to hold authenticated user state and role data.
7. THE Platform SHALL define all shared UI primitives (Button, Card, Input, Badge) in `components/ui/` and feature-specific components in `components/[feature]/` subdirectories.

---

### Requirement 2: Backend Architecture and Data Persistence

**User Story:** As a developer, I want a production-ready backend with proper authentication, a relational database, and a service layer abstraction, so that the platform is scalable, maintainable, and ready for multi-sport expansion.

#### Acceptance Criteria

1. THE Platform SHALL use Supabase as the backend, providing PostgreSQL database, authentication, storage, and real-time subscriptions.
2. THE Platform SHALL use Supabase Auth for user authentication with email and password sign-in.
3. THE Platform SHALL define a PostgreSQL database schema with the following tables: `users`, `players`, `coaches`, `events`, `posts`, `session_requests`, each with a `sport` column defaulting to "tennis".
4. THE Platform SHALL implement Row-Level Security (RLS) policies in PostgreSQL to ensure users can only read and write data they are authorized to access.
5. THE Service_Layer SHALL be implemented in the `services/` directory and expose typed functions for all CRUD operations (create, read, update, delete) on each entity.
6. THE Service_Layer SHALL use the Supabase JavaScript client (`@supabase/supabase-js`) to interact with the database, and all functions SHALL return typed results matching the interfaces defined in `types/`.
7. ALL screens and components SHALL call Service_Layer functions exclusively and SHALL NOT import or use the Supabase client directly.
8. THE Platform SHALL structure all database tables and TypeScript types to be sport-agnostic, with a `sport: string` field on all relevant entities, so that adding new sports in the future requires only data changes, not code changes.
9. THE Platform SHALL use Supabase Realtime subscriptions in the Community_Screen to display new posts and events as they are created by other users without requiring a manual refresh.
10. THE Platform SHALL store user authentication state in Zustand or React Context, populated from Supabase Auth on app launch.

---

### Requirement 3: User Role Selection and Onboarding

**User Story:** As a new user, I want to declare my role (Player or Coach) during onboarding, so that the platform surfaces relevant content and features for my needs.

#### Acceptance Criteria

1. WHEN a user opens the app for the first time, THE Platform SHALL present a role-selection screen before entering the main tab navigation.
2. THE Platform SHALL offer two selectable roles: Player and Coach.
3. WHEN a user selects the Player role, THE Platform SHALL prompt them to enter a display name, location, skill level (Beginner / Intermediate / Advanced / Competitive), and preferred play style (Singles / Doubles / Both).
4. WHEN a user selects the Coach role, THE Platform SHALL prompt them to enter display name, location, coaching speciality, years of experience, hourly rate range, certifications, and a short bio.
5. WHEN a Coach completes onboarding, THE Platform SHALL set the coach's verification status to "pending" and inform the user that their profile is under review before appearing in Connect listings.
6. THE Platform SHALL persist the selected role and onboarding data via the Service_Layer, creating a record in the `users` table linked to the authenticated user's Supabase Auth ID.
7. IF a returning user already has stored role data, THEN THE Platform SHALL skip the role-selection screen and load the main tab navigation directly.

---

### Requirement 4: Discover Screen (Home)

**User Story:** As any user, I want a home screen that surfaces featured upcoming events, community highlights, and quick links to the core features, so that I have an immediate entry point into the platform each time I open the app.

#### Acceptance Criteria

1. THE Discover_Screen SHALL display a hero section showing the user's display name and role badge.
2. THE Discover_Screen SHALL display a "Featured Events" section showing the next 3 upcoming events from the Community calendar, each with event name, date, category, and a "View" CTA.
3. WHEN a user taps a featured event card, THE Platform SHALL navigate to the Community_Screen with that event's detail visible.
4. THE Discover_Screen SHALL display a "Community Highlights" section showing the 3 most recent posts from the social feed.
5. THE Discover_Screen SHALL display quick-link cards to the Connect_Screen ("Find a Coach") and the Community_Screen ("Join the Community").
6. WHEN the authenticated user's role is Player and their skill level is "Beginner", THE Discover_Screen SHALL display a prominent "Find a Coach" prompt encouraging the user to browse the Connect screen.
7. WHEN the authenticated user's role is Coach and their verification status is "pending", THE Discover_Screen SHALL display a status banner informing the coach that their profile is awaiting admin review.

---

### Requirement 5: Player–Coach Matching (Connect Screen)

**User Story:** As a player, I want to browse and connect with verified coaches who match my skill level and goals, so that I can find the right coach to improve my game.

#### Acceptance Criteria

1. THE Connect_Screen SHALL display a list of Coach profiles where each coach has a verification status of "approved", showing name, speciality, skill levels coached, hourly rate range, and availability status.
2. THE Connect_Screen SHALL provide filter controls for skill level, coaching speciality, and maximum hourly rate.
3. WHEN a Player applies filters, THE Connect_Screen SHALL update the displayed coach list to show only coaches matching all selected filter criteria.
4. WHEN a Player taps a Coach profile card, THE Platform SHALL open a detail view showing full bio, certifications, session types offered, and a "Request Session" CTA.
5. WHEN a Player taps "Request Session", THE Platform SHALL create a Session_Request record via the Service_Layer and display a confirmation with the coach's name.
6. THE Connect_Screen SHALL display a "Best Match" section at the top showing up to 3 coaches matched to the Player's skill level and play style.
7. WHEN the authenticated user's role is Coach, THE Connect_Screen SHALL display the coach's own profile summary and a list of incoming Session_Requests instead of the player-facing browse view.
8. WHEN the authenticated user's role is Coach and verification status is "pending", THE Connect_Screen SHALL display a message explaining that the coach listing will appear after admin approval.
9. IF no coaches match the applied filters, THEN THE Connect_Screen SHALL display an empty-state message with a suggestion to broaden the filter criteria.
10. THE Connect_Screen SHALL load coach listings via the Service_Layer so that the data source can be replaced with an external coach registry API without modifying the screen component.

---

### Requirement 6: Coach Verification Flow

**User Story:** As an admin, I want to review and approve coach profiles before they appear in the Connect listings, so that players can trust the coaches they find on the platform.

#### Acceptance Criteria

1. WHEN a Coach completes onboarding, THE Platform SHALL create a coach profile record with `verificationStatus: "pending"` via the Service_Layer.
2. THE Platform SHALL provide an admin-accessible view listing all coach profiles with a "pending" verification status, showing name, speciality, experience, and submitted certifications.
3. WHEN an admin approves a coach profile, THE Platform SHALL update the coach's `verificationStatus` to "approved" and make the profile visible in Connect_Screen listings.
4. WHEN an admin rejects a coach profile, THE Platform SHALL update the coach's `verificationStatus` to "rejected" and notify the coach via an in-app status message on their Profile_Screen.
5. WHILE a coach's `verificationStatus` is "pending" or "rejected", THE Connect_Screen SHALL not display that coach in any listing or search result.
6. THE Platform SHALL expose coach verification state through the Service_Layer using a typed `CoachProfile` interface that includes a `verificationStatus` field of type `"pending" | "approved" | "rejected"`.

---

### Requirement 7: Community Feed and Events (Community Screen)

**User Story:** As any user, I want a social feed and event calendar to stay connected with the local tennis community, so that I can discover sessions, share updates, and join group activities.

#### Acceptance Criteria

1. THE Community_Screen SHALL display a chronological social feed of posts and event announcements from all users.
2. THE Community_Screen SHALL allow any authenticated user to create a text post, which appears in the feed immediately after submission via the Service_Layer.
3. WHEN a user submits a post with an empty body, THE Platform SHALL prevent submission and display an inline validation message.
4. THE Community_Screen SHALL display an event calendar view showing all upcoming tennis events for the current month.
5. WHEN a user taps a calendar date that has events, THE Platform SHALL display a list of events for that date below the calendar.
6. THE Community_Screen SHALL allow any authenticated user to create a new event by filling in event name, category (Match / Clinic / Group Session / Social), date, time, location, and max participants.
7. WHEN a user submits a valid event creation form, THE Platform SHALL save the event via the Service_Layer, add it to the calendar, and post an announcement card to the feed.
8. IF an event creation form is submitted with missing required fields (name, date, time, location), THEN THE Platform SHALL highlight the missing fields and prevent submission.
9. THE Community_Screen SHALL load feed posts and events via the Service_Layer so that the data source can be replaced with a remote API without modifying the screen component.

---

### Requirement 8: User Profile Screen

**User Story:** As any user, I want a profile screen showing my role-specific details and activity history, so that I can track my progress and present myself to the community.

#### Acceptance Criteria

1. THE Profile_Screen SHALL display the user's display name, role badge, and location.
2. WHEN the authenticated user's role is Player, THE Profile_Screen SHALL display skill level, play style preference, and match history.
3. WHEN the authenticated user's role is Coach, THE Profile_Screen SHALL display coaching speciality, years of experience, hourly rate range, certifications, bio, and a list of completed sessions.
4. WHEN the authenticated user's role is Coach, THE Profile_Screen SHALL display the current verification status ("Pending Review", "Verified", or "Not Approved") as a visible badge.
5. THE Profile_Screen SHALL allow the user to edit their display name, location, and role-specific details via an inline edit form.
6. WHEN the user saves profile edits, THE Platform SHALL persist the updated data via the Service_Layer and reflect changes immediately in the UI.
7. THE Profile_Screen SHALL read and write profile data exclusively through the Service_Layer using the typed profile interfaces defined in `types/`.

---

### Requirement 9: Design System (React Native)

**User Story:** As a developer, I want all UI components to use shared design tokens defined in a single theme file, so that the visual identity (dark theme, lime green accent, Bebas Neue + DM Sans typography) is consistent across all screens.

#### Acceptance Criteria

1. THE Design_System SHALL be defined in `constants/theme.ts` and export a `colors` object containing all palette values: `lime` (#c8f135), `black` (#070906), `dark` (#0d1009), `panel` (#111509), `card` (#161b0e), `border` (#1f2614), `muted` (#485535), `text` (#c8d9b4), `white` (#eaf4d8), `gold` (#f5c842), `silver` (#b0bec5).
2. THE Design_System SHALL export a `typography` object defining font families (`BebasNeue` for headings, `DMSans` for body) and font weights (300, 400, 500, 600).
3. THE Design_System SHALL export a `spacing` object defining a consistent spacing scale (4, 8, 12, 16, 24, 32, 48px).
4. ALL screen and component StyleSheets SHALL reference tokens from `constants/theme.ts` rather than hardcoding color, font, or spacing values.
5. ALL interactive elements (buttons, cards, inputs) SHALL use React Native's `Pressable` with visual feedback (opacity or background change) on press.
6. ALL form inputs SHALL display a lime-colored focus ring using a border or shadow style when focused.
7. THE Platform SHALL support safe-area insets on notched devices using `react-native-safe-area-context` on all screens and the tab bar.
8. THE Platform SHALL render correctly on screen widths from 320px upward without horizontal overflow, using flexbox layout throughout.
