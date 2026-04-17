import { supabase } from './supabase';
import { mapSupabaseError } from './errors';
import type { User, UserRole, AuthResult } from '../types';

function mapUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    location: data.location,
    avatarUrl: data.avatar_url,
    sport: data.sport || 'tennis',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const authService = {
  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) return { user: null, error: authError.message };
      if (!authData.user) return { user: null, error: 'Sign up failed' };

      // Create user record in public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          display_name: displayName,
          sport: 'tennis',
        })
        .select()
        .single();

      if (userError) return { user: null, error: userError.message };

      return { user: mapUser(userData), error: null };
    } catch (e: any) {
      return { user: null, error: e.message || 'Sign up failed' };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) return { user: null, error: authError.message };
      if (!authData.user) return { user: null, error: 'Sign in failed' };

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) return { user: null, error: userError.message };

      return { user: mapUser(userData), error: null };
    } catch (e: any) {
      return { user: null, error: e.message || 'Sign in failed' };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      if (error || !data) return null;
      return mapUser(data);
    } catch {
      return null;
    }
  },
};
