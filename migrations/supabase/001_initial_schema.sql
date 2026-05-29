-- ============================================================================
-- ATTIVO Tennis Platform - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all six core tables with full DDL including CHECK 
--              constraints, DEFAULT values, foreign key references, and indexes
-- Requirements: 2.1, 2.3, 2.8
-- ============================================================================

-- ============================================================================
-- Table: users
-- Description: User accounts linked to Supabase Auth
-- ============================================================================

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

-- ============================================================================
-- Table: players
-- Description: Player profiles with skill level and play style preferences
-- ============================================================================

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

-- ============================================================================
-- Table: coaches
-- Description: Coach profiles with speciality, rates, certifications, and 
--              verification status
-- ============================================================================

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

-- ============================================================================
-- Table: events
-- Description: Community events (matches, clinics, group sessions, social)
-- ============================================================================

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

-- ============================================================================
-- Table: posts
-- Description: Social feed posts from users
-- ============================================================================

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

-- ============================================================================
-- Table: session_requests
-- Description: Player-to-coach session booking requests
-- ============================================================================

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

-- ============================================================================
-- End of Migration: 001_initial_schema.sql
-- ============================================================================
