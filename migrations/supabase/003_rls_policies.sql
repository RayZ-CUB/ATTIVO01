-- Migration: 003_rls_policies.sql
-- Description: Enable Row-Level Security (RLS) on all tables and define access policies
-- Requirements: 2.4

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Table: users
-- RLS Policies:
-- - SELECT: Any authenticated user can read any user row (public profiles)
-- - INSERT: User can only insert a row where id = auth.uid()
-- - UPDATE: User can only update their own row (id = auth.uid())
-- - DELETE: User can only delete their own row
-- ============================================================================

-- SELECT policy: authenticated users can read all user profiles
CREATE POLICY users_select_policy ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy: users can only insert their own profile
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE policy: users can only update their own profile
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE policy: users can only delete their own profile
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- Table: players
-- RLS Policies:
-- - SELECT: Any authenticated user can read player profiles
-- - INSERT: User can only insert where user_id = auth.uid()
-- - UPDATE: User can only update their own player profile
-- ============================================================================

-- SELECT policy: authenticated users can read all player profiles
CREATE POLICY players_select_policy ON players
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy: users can only insert their own player profile
CREATE POLICY players_insert_policy ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own player profile
CREATE POLICY players_update_policy ON players
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Table: coaches
-- RLS Policies:
-- - SELECT: Any authenticated user can read coaches where verification_status = 'approved'; admins can read all
-- - INSERT: User can only insert where user_id = auth.uid()
-- - UPDATE: User can update their own coach profile; admins can update verification_status on any row
-- ============================================================================

-- SELECT policy: authenticated users can read approved coaches, admins can read all
CREATE POLICY coaches_select_policy ON coaches
  FOR SELECT
  TO authenticated
  USING (
    verification_status = 'approved' 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- INSERT policy: users can only insert their own coach profile
CREATE POLICY coaches_insert_policy ON coaches
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can update their own profile, admins can update verification_status
CREATE POLICY coaches_update_policy ON coaches
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- Table: events
-- RLS Policies:
-- - SELECT: Any authenticated user can read all events
-- - INSERT: Any authenticated user can create events
-- - UPDATE: Only the creator can update their event (creator_id = auth.uid())
-- - DELETE: Only the creator can delete their event
-- ============================================================================

-- SELECT policy: authenticated users can read all events
CREATE POLICY events_select_policy ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy: any authenticated user can create events
CREATE POLICY events_insert_policy ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- UPDATE policy: only the creator can update their event
CREATE POLICY events_update_policy ON events
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- DELETE policy: only the creator can delete their event
CREATE POLICY events_delete_policy ON events
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- ============================================================================
-- Table: posts
-- RLS Policies:
-- - SELECT: Any authenticated user can read all posts
-- - INSERT: Any authenticated user can create posts; author_id must equal auth.uid()
-- - UPDATE: Only the author can update their post
-- - DELETE: Only the author can delete their post
-- ============================================================================

-- SELECT policy: authenticated users can read all posts
CREATE POLICY posts_select_policy ON posts
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy: any authenticated user can create posts with their own author_id
CREATE POLICY posts_insert_policy ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- UPDATE policy: only the author can update their post
CREATE POLICY posts_update_policy ON posts
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- DELETE policy: only the author can delete their post
CREATE POLICY posts_delete_policy ON posts
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ============================================================================
-- Table: session_requests
-- RLS Policies:
-- - SELECT: Player can read their own requests; coach can read requests directed at them; admins can read all
-- - INSERT: Authenticated user can insert where the player_id maps to their own player profile
-- - UPDATE: Coach can update status on requests directed at them; player can cancel their own pending requests
-- ============================================================================

-- SELECT policy: players see their own requests, coaches see requests directed at them, admins see all
CREATE POLICY session_requests_select_policy ON session_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Player can read their own requests
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
    OR
    -- Coach can read requests directed at them
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
    OR
    -- Admins can read all
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- INSERT policy: authenticated user can insert where player_id maps to their own player profile
CREATE POLICY session_requests_insert_policy ON session_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- UPDATE policy: coach can update status on requests directed at them; player can cancel their own pending requests
CREATE POLICY session_requests_update_policy ON session_requests
  FOR UPDATE
  TO authenticated
  USING (
    -- Coach can update requests directed at them
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
    OR
    -- Player can cancel their own pending requests
    (
      player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
      )
      AND status = 'pending'
    )
  )
  WITH CHECK (
    -- Coach can update requests directed at them
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
    OR
    -- Player can cancel their own pending requests
    (
      player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
      )
      AND status = 'pending'
    )
  );
