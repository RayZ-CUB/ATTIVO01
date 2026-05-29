import { supabase } from './supabase';
import { ServiceError, mapSupabaseError } from './errors';
import type {
  SessionRequest,
  CreateSessionRequestInput,
  SessionStatus,
} from '../types';

function mapSessionRequest(data: any): SessionRequest {
  return {
    id: data.id,
    playerId: data.player_id,
    coachId: data.coach_id,
    status: data.status,
    message: data.message,
    sport: data.sport || 'tennis',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    player: data.player ? {
      id: data.player.id,
      userId: data.player.user_id,
      skillLevel: data.player.skill_level,
      playStyle: data.player.play_style,
      sport: data.player.sport || 'tennis',
      createdAt: data.player.created_at,
      updatedAt: data.player.updated_at,
      user: data.player.user ? {
        id: data.player.user.id,
        email: data.player.user.email,
        displayName: data.player.user.display_name,
        role: data.player.user.role,
        location: data.player.user.location,
        avatarUrl: data.player.user.avatar_url,
        sport: data.player.user.sport || 'tennis',
        createdAt: data.player.user.created_at,
        updatedAt: data.player.user.updated_at,
      } : undefined,
    } : undefined,
    coach: data.coach ? {
      id: data.coach.id,
      userId: data.coach.user_id,
      speciality: data.coach.speciality,
      yearsExperience: data.coach.years_experience,
      rateMin: data.coach.rate_min,
      rateMax: data.coach.rate_max,
      certifications: data.coach.certifications || [],
      bio: data.coach.bio,
      skillLevelsCoached: data.coach.skill_levels_coached || [],
      availabilityStatus: data.coach.availability_status,
      verificationStatus: data.coach.verification_status,
      sport: data.coach.sport || 'tennis',
      createdAt: data.coach.created_at,
      updatedAt: data.coach.updated_at,
      user: data.coach.user ? {
        id: data.coach.user.id,
        email: data.coach.user.email,
        displayName: data.coach.user.display_name,
        role: data.coach.user.role,
        location: data.coach.user.location,
        avatarUrl: data.coach.user.avatar_url,
        sport: data.coach.user.sport || 'tennis',
        createdAt: data.coach.user.created_at,
        updatedAt: data.coach.user.updated_at,
      } : undefined,
    } : undefined,
  };
}

export const sessionService = {
  /**
   * Create a new session request from a player to a coach
   * Validates that the target coach has verification_status = 'approved'
   * @throws ServiceError with code 'VALIDATION' if coach is not approved
   */
  async createSessionRequest(input: CreateSessionRequestInput): Promise<SessionRequest> {
    // First, verify the coach is approved
    const { data: coachData, error: coachError } = await supabase
      .from('coaches')
      .select('verification_status')
      .eq('id', input.coachId)
      .single();

    if (coachError) {
      throw mapSupabaseError(coachError);
    }

    if (!coachData || coachData.verification_status !== 'approved') {
      throw new ServiceError('Coach is not approved', 'VALIDATION', 400);
    }

    // Create the session request
    const { data, error } = await supabase
      .from('session_requests')
      .insert({
        player_id: input.playerId,
        coach_id: input.coachId,
        message: input.message,
        sport: input.sport || 'tennis',
        status: 'pending',
      })
      .select(`
        *,
        player:players(
          *,
          user:users(*)
        ),
        coach:coaches(
          *,
          user:users(*)
        )
      `)
      .single();

    if (error) throw mapSupabaseError(error);
    return mapSessionRequest(data);
  },

  /**
   * Get all session requests for a specific player
   */
  async getSessionRequestsByPlayer(playerId: string): Promise<SessionRequest[]> {
    const { data, error } = await supabase
      .from('session_requests')
      .select(`
        *,
        player:players(
          *,
          user:users(*)
        ),
        coach:coaches(
          *,
          user:users(*)
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data || []).map(mapSessionRequest);
  },

  /**
   * Get all session requests for a specific coach
   */
  async getSessionRequestsByCoach(coachId: string): Promise<SessionRequest[]> {
    const { data, error } = await supabase
      .from('session_requests')
      .select(`
        *,
        player:players(
          *,
          user:users(*)
        ),
        coach:coaches(
          *,
          user:users(*)
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data || []).map(mapSessionRequest);
  },

  /**
   * Update the status of a session request
   */
  async updateSessionStatus(
    requestId: string,
    status: SessionStatus
  ): Promise<SessionRequest> {
    const { data, error } = await supabase
      .from('session_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select(`
        *,
        player:players(
          *,
          user:users(*)
        ),
        coach:coaches(
          *,
          user:users(*)
        )
      `)
      .single();

    if (error) throw mapSupabaseError(error);
    return mapSessionRequest(data);
  },
};
