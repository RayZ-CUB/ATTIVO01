import { supabase } from './supabase';
import { mapSupabaseError } from './errors';
import type { CoachProfile } from '../types';

function mapCoach(data: any): CoachProfile {
  return {
    id: data.id,
    userId: data.user_id,
    speciality: data.speciality,
    yearsExperience: data.years_experience,
    rateMin: data.rate_min,
    rateMax: data.rate_max,
    certifications: data.certifications || [],
    bio: data.bio,
    skillLevelsCoached: data.skill_levels_coached || [],
    availabilityStatus: data.availability_status,
    verificationStatus: data.verification_status,
    sport: data.sport || 'tennis',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    user: data.user ? {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.display_name,
      role: data.user.role,
      location: data.user.location,
      avatarUrl: data.user.avatar_url,
      sport: data.user.sport || 'tennis',
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at,
    } : undefined,
  };
}

export const adminService = {
  /**
   * Get all coach profiles with pending verification status
   * @returns Array of coach profiles awaiting admin approval
   */
  async getPendingCoaches(): Promise<CoachProfile[]> {
    const { data, error } = await supabase
      .from('coaches')
      .select('*, user:users(*)')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw mapSupabaseError(error);
    return (data || []).map(mapCoach);
  },

  /**
   * Approve a coach profile, updating verification status to 'approved'
   * @param coachId - The ID of the coach profile to approve
   * @returns The updated coach profile
   */
  async approveCoach(coachId: string): Promise<CoachProfile> {
    // Update verification status to approved
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        verification_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', coachId);

    if (updateError) throw mapSupabaseError(updateError);

    // Re-fetch and return the updated coach profile
    const { data, error: fetchError } = await supabase
      .from('coaches')
      .select('*, user:users(*)')
      .eq('id', coachId)
      .single();

    if (fetchError) throw mapSupabaseError(fetchError);
    return mapCoach(data);
  },

  /**
   * Reject a coach profile, updating verification status to 'rejected'
   * @param coachId - The ID of the coach profile to reject
   * @returns The updated coach profile
   */
  async rejectCoach(coachId: string): Promise<CoachProfile> {
    // Update verification status to rejected
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        verification_status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', coachId);

    if (updateError) throw mapSupabaseError(updateError);

    // Re-fetch and return the updated coach profile
    const { data, error: fetchError } = await supabase
      .from('coaches')
      .select('*, user:users(*)')
      .eq('id', coachId)
      .single();

    if (fetchError) throw mapSupabaseError(fetchError);
    return mapCoach(data);
  },
};
