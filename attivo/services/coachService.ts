import { supabase } from './supabase';
import { mapSupabaseError } from './errors';
import type {
  CoachProfile,
  CreateCoachInput,
  UpdateCoachInput,
  CoachFilters,
  VerificationStatus,
} from '../types';

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

export const coachService = {
  async getCoaches(filters?: CoachFilters): Promise<CoachProfile[]> {
    let query = supabase
      .from('coaches')
      .select('*, user:users(*)')
      .eq('verification_status', 'approved')
      .eq('sport', filters?.sport || 'tennis');

    if (filters?.skillLevel) {
      query = query.contains('skill_levels_coached', [filters.skillLevel]);
    }
    if (filters?.maxRate) {
      query = query.lte('rate_min', filters.maxRate);
    }

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data || []).map(mapCoach);
  },

  async getCoachById(coachId: string): Promise<CoachProfile | null> {
    const { data, error } = await supabase
      .from('coaches')
      .select('*, user:users(*)')
      .eq('id', coachId)
      .single();

    if (error || !data) return null;
    return mapCoach(data);
  },

  async createCoach(input: CreateCoachInput): Promise<CoachProfile> {
    const { data, error } = await supabase
      .from('coaches')
      .insert({
        user_id: input.userId,
        speciality: input.speciality,
        years_experience: input.yearsExperience,
        rate_min: input.rateMin,
        rate_max: input.rateMax,
        certifications: input.certifications || [],
        bio: input.bio,
        skill_levels_coached: input.skillLevelsCoached || ['beginner', 'intermediate', 'advanced', 'competitive'],
        sport: input.sport || 'tennis',
        verification_status: 'pending',
      })
      .select('*, user:users(*)')
      .single();

    if (error) throw mapSupabaseError(error);
    return mapCoach(data);
  },

  async updateCoach(userId: string, input: UpdateCoachInput): Promise<CoachProfile> {
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.speciality !== undefined) updates.speciality = input.speciality;
    if (input.yearsExperience !== undefined) updates.years_experience = input.yearsExperience;
    if (input.rateMin !== undefined) updates.rate_min = input.rateMin;
    if (input.rateMax !== undefined) updates.rate_max = input.rateMax;
    if (input.certifications !== undefined) updates.certifications = input.certifications;
    if (input.bio !== undefined) updates.bio = input.bio;
    if (input.skillLevelsCoached !== undefined) updates.skill_levels_coached = input.skillLevelsCoached;
    if (input.availabilityStatus !== undefined) updates.availability_status = input.availabilityStatus;

    const { data, error } = await supabase
      .from('coaches')
      .update(updates)
      .eq('user_id', userId)
      .select('*, user:users(*)')
      .single();

    if (error) throw mapSupabaseError(error);
    return mapCoach(data);
  },

  async getVerificationStatus(userId: string): Promise<VerificationStatus | null> {
    const { data, error } = await supabase
      .from('coaches')
      .select('verification_status')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.verification_status;
  },
};
