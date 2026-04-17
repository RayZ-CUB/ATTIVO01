import { supabase } from './supabase';
import { mapSupabaseError } from './errors';
import type { PlayerProfile, CreatePlayerInput, UpdatePlayerInput } from '../types';

function mapPlayer(data: any): PlayerProfile {
  return {
    id: data.id,
    userId: data.user_id,
    skillLevel: data.skill_level,
    playStyle: data.play_style,
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

export const playerService = {
  async getPlayer(userId: string): Promise<PlayerProfile | null> {
    const { data, error } = await supabase
      .from('players')
      .select('*, user:users(*)')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return mapPlayer(data);
  },

  async createPlayer(input: CreatePlayerInput): Promise<PlayerProfile> {
    const { data, error } = await supabase
      .from('players')
      .insert({
        user_id: input.userId,
        skill_level: input.skillLevel,
        play_style: input.playStyle,
        sport: input.sport || 'tennis',
      })
      .select('*, user:users(*)')
      .single();

    if (error) throw mapSupabaseError(error);
    return mapPlayer(data);
  },

  async updatePlayer(userId: string, input: UpdatePlayerInput): Promise<PlayerProfile> {
    const updates: any = {};
    if (input.skillLevel) updates.skill_level = input.skillLevel;
    if (input.playStyle) updates.play_style = input.playStyle;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('user_id', userId)
      .select('*, user:users(*)')
      .single();

    if (error) throw mapSupabaseError(error);
    return mapPlayer(data);
  },
};
