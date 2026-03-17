# ATTIVO

**Connect · Play · Improve** — A tennis community platform connecting players with coaches.

## What is ATTIVO?

ATTIVO is a mobile-first platform built for the tennis community. It connects players of all skill levels with verified coaches, and brings local tennis communities together through a social feed and events calendar.

Tennis is the first sport vertical. The architecture is designed from day one to expand to skiing, hiking, climbing, and other outdoor activities — especially relevant for the Colorado outdoor community.

---

## Core Features (MVP)

### Discover
Home screen showing featured upcoming events, community highlights, and quick links to find a coach or join the community.

### Connect
Browse verified coaches filtered by skill level, speciality, and rate. Players can request sessions directly. Coaches see and manage incoming session requests.

### Community
A real-time social feed and event calendar. Post updates, create events (matches, clinics, group sessions), and join what's happening locally.

### Profile
Role-specific profiles — Players show skill level, play style, and match history. Coaches show speciality, experience, certifications, and verification status.

---

## User Roles

| Role | Description |
|------|-------------|
| **Player** | Any skill level (Beginner → Competitive). Browse coaches, join events, post in the feed. |
| **Coach** | Must pass admin verification before appearing in Connect listings. Manage incoming session requests. |

---

## Tech Stack

### Frontend
- **React Native** + **Expo** (SDK 51+) — iOS, Android, and Web from one codebase
- **Expo Router** — file-based navigation
- **TypeScript** — full type safety
- **Zustand** — state management
- **NativeWind** or **React Native Paper** — UI components

### Backend
- **Supabase** — PostgreSQL + Auth + Storage + Realtime
  - Email/password authentication
  - PostgreSQL relational database with Row-Level Security
  - Supabase Storage for profile photos and event images
  - Supabase Realtime for live feed updates

### Development Tools
- **Expo Go** — local development and testing
- **EAS Build** — production iOS/Android builds
- **Supabase CLI** — local database development and migrations

---

## Database Schema (PostgreSQL)

| Table | Description |
|-------|-------------|
| `users` | User accounts linked to Supabase Auth |
| `players` | Player profiles (skill level, play style, location) |
| `coaches` | Coach profiles (speciality, rate, certifications, verification status) |
| `events` | Community events (matches, clinics, group sessions) |
| `posts` | Social feed posts |
| `session_requests` | Player-to-coach session booking requests |

All tables include a `sport` column (defaults to `"tennis"`) for future multi-sport expansion.

---

## Project Structure

```
attivo/
├── app/                        # Expo Router screens
│   ├── (tabs)/
│   │   ├── discover.tsx        # Home screen
│   │   ├── connect.tsx         # Player-coach matching
│   │   ├── community.tsx       # Social feed + events
│   │   └── profile.tsx         # User profile
│   ├── _layout.tsx
│   └── index.tsx               # Onboarding entry point
├── components/
│   ├── ui/                     # Shared design system components (Button, Card, Input, Badge)
│   └── [feature]/              # Feature-specific components
├── hooks/                      # Custom React hooks
├── services/                   # Supabase service layer (all DB calls live here)
├── store/                      # Zustand state management
├── types/                      # TypeScript interfaces and types
├── constants/
│   └── theme.ts                # Design tokens (colors, typography, spacing)
└── assets/                     # Fonts, images, icons
```

---

## Architecture Principles

- **Service layer abstraction** — screens and components never call Supabase directly. All database access goes through `services/`. This means swapping the backend later requires changing one file, not every screen.
- **Sport-agnostic data model** — every entity has a `sport` field. Adding skiing or hiking is a data change, not a code change.
- **Type-safe throughout** — all data models defined in `types/` match the shape expected by both the database and any future external API.

---

## Design System

Dark theme with lime green (`#c8f135`) accent. Bebas Neue for headings, DM Sans for body text.
All tokens defined in `constants/theme.ts` — no hardcoded colors or fonts anywhere in the codebase.

---

## Getting Started

> Full setup instructions coming once the React Native project is scaffolded.

```bash
# Install dependencies
npm install

# Start development server
npx expo start
```

---

## Roadmap

- [x] MVP requirements and architecture spec
- [ ] React Native / Expo project scaffold
- [ ] Supabase schema and auth setup
- [ ] Onboarding flow (Player / Coach roles)
- [ ] Connect screen — coach listings and matching
- [ ] Community screen — social feed and event calendar
- [ ] Profile screen — role-specific views
- [ ] Coach verification admin flow
- [ ] iOS + Android deployment via EAS Build
- [ ] Multi-sport expansion (skiing, hiking, climbing)
- [ ] External coach registry API integration

---

## Spec

Full product requirements: `.kiro/specs/attivo-tennis-platform/requirements.md`
