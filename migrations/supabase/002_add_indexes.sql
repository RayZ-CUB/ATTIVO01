-- Migration: 002_add_indexes.sql
-- Description: Add performance indexes to all tables for optimized query performance
-- Requirements: 2.1

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index on role for filtering users by role (player, coach, admin)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index on sport for multi-sport filtering
CREATE INDEX IF NOT EXISTS idx_users_sport ON users(sport);


-- ============================================================================
-- PLAYERS TABLE INDEXES
-- ============================================================================

-- Index on user_id for joining players with users table
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

-- Index on sport for multi-sport filtering
CREATE INDEX IF NOT EXISTS idx_players_sport ON players(sport);

-- Index on skill_level for filtering players by skill level
CREATE INDEX IF NOT EXISTS idx_players_skill_level ON players(skill_level);


-- ============================================================================
-- COACHES TABLE INDEXES
-- ============================================================================

-- Index on user_id for joining coaches with users table
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);

-- Index on verification_status for filtering approved/pending/rejected coaches
CREATE INDEX IF NOT EXISTS idx_coaches_verification_status ON coaches(verification_status);

-- Index on sport for multi-sport filtering
CREATE INDEX IF NOT EXISTS idx_coaches_sport ON coaches(sport);

-- Index on speciality for filtering coaches by their coaching speciality
CREATE INDEX IF NOT EXISTS idx_coaches_speciality ON coaches(speciality);


-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

-- Index on event_date for filtering and sorting events by date
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- Index on creator_id for finding events created by a specific user
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);

-- Index on sport for multi-sport filtering
CREATE INDEX IF NOT EXISTS idx_events_sport ON events(sport);

-- Index on category for filtering events by type (match, clinic, group_session, social)
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);


-- ============================================================================
-- POSTS TABLE INDEXES
-- ============================================================================

-- Index on author_id for finding posts by a specific author
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- Index on created_at (descending) for chronological feed ordering
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Index on sport for multi-sport filtering
CREATE INDEX IF NOT EXISTS idx_posts_sport ON posts(sport);


-- ============================================================================
-- SESSION_REQUESTS TABLE INDEXES
-- ============================================================================

-- Index on player_id for finding all requests from a specific player
CREATE INDEX IF NOT EXISTS idx_session_requests_player_id ON session_requests(player_id);

-- Index on coach_id for finding all requests directed at a specific coach
CREATE INDEX IF NOT EXISTS idx_session_requests_coach_id ON session_requests(coach_id);

-- Index on status for filtering requests by status (pending, accepted, declined, completed)
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests(status);

-- Index on sport for multi-sport filtering
CREATE INDEX IF NOT EXISTS idx_session_requests_sport ON session_requests(sport);
