# ATTIVO

**Connect · Play · Improve** — A tennis community platform for players and coaches.

## What it is

ATTIVO is a mobile-first platform that connects tennis players with coaches, and brings local tennis communities together through a social feed and events calendar.

Tennis is the first sport vertical. The architecture is designed to expand to skiing, hiking, climbing, and other outdoor activities in the future.

## Core Features (MVP)

- **Connect** — Browse verified coaches, filter by skill level and speciality, request a session
- **Community** — Social feed, event calendar, create and join local tennis events
- **Profile** — Role-specific profiles for Players and Coaches
- **Coach Verification** — Coaches go through an admin review before appearing in listings

## Tech Stack

### Frontend
- React Native + Expo (iOS, Android, Web from one codebase)
- Expo Router for file-based navigation
- TypeScript
- Zustand for state management

### Backend
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Row-level security for data access control
- Service layer abstraction — screens never call Supabase directly

### Database
PostgreSQL with tables: `users`, `players`, `coaches`, `events`, `posts`, `session_requests`

All tables include a `sport` column (defaults to `"tennis"`) for future multi-sport expansion.

## Project Structure

```
attivo/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── discover.tsx    # Home screen
│   │   ├── connect.tsx     # Player-coach matching
│   │   ├── community.tsx   # Social feed + events
│   │   └── profile.tsx     # User profile
│   ├── _layout.tsx
│   └── index.tsx           # Onboarding entry point
├── components/
│   ├── ui/                 # Shared design system components
│   └── [feature]/          # Feature-specific components
├── hooks/                  # Custom React hooks
├── services/               # Supabase service layer
├── store/                  # Zustand state management
├── types/                  # TypeScript interfaces
├── constants/              # theme.ts (design tokens)
└── assets/                 # Fonts, images, icons
```

## User Roles

- **Player** — Any skill level (Beginner → Competitive). Browse coaches, join events, post in the feed.
- **Coach** — Must be verified by admin before appearing in Connect listings. Manage incoming session requests.

## Design System

Dark theme with lime green (`#c8f135`) accent. Bebas Neue for headings, DM Sans for body text. All tokens defined in `constants/theme.ts`.

## Getting Started

> Full setup instructions coming once the React Native project is scaffolded.

```bash
# Install dependencies
npm install

# Start development server
npx expo start
```

## Spec

Full product requirements are in `.kiro/specs/attivo-tennis-platform/requirements.md`.

## Roadmap

- [ ] MVP: Tennis — player-coach matching + community
- [ ] Multi-sport expansion (skiing, hiking, climbing)
- [ ] Coach external API integration (tennis federation registry)
- [ ] iOS + Android App Store deployment via EAS Build
