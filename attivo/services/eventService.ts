import { supabase } from './supabase';
import { mapSupabaseError } from './errors';
import type { Event, CreateEventInput } from '../types';

function mapEvent(data: any): Event {
  return {
    id: data.id,
    creatorId: data.creator_id,
    name: data.name,
    category: data.category,
    description: data.description,
    location: data.location,
    eventDate: data.event_date,
    eventTime: data.event_time,
    maxParticipants: data.max_participants,
    sport: data.sport || 'tennis',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    creator: data.creator
      ? {
          id: data.creator.id,
          email: data.creator.email,
          displayName: data.creator.display_name,
          role: data.creator.role,
          location: data.creator.location,
          avatarUrl: data.creator.avatar_url,
          sport: data.creator.sport || 'tennis',
          createdAt: data.creator.created_at,
          updatedAt: data.creator.updated_at,
        }
      : undefined,
  };
}

/**
 * Get all events, optionally filtered by sport
 * @param sport - Optional sport filter (defaults to 'tennis')
 * @returns Array of events
 */
export async function getEvents(sport?: string): Promise<Event[]> {
  try {
    let query = supabase
      .from('events')
      .select('*, creator:users(*)')
      .eq('sport', sport || 'tennis')
      .order('event_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data || []).map(mapEvent);
  } catch (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Create a new event
 * @param input - Event creation data
 * @returns Created event
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw mapSupabaseError(userError || new Error('User not authenticated'));
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        creator_id: userData.user.id,
        name: input.name,
        category: input.category,
        description: input.description,
        location: input.location,
        event_date: input.eventDate,
        event_time: input.eventTime,
        max_participants: input.maxParticipants,
        sport: input.sport || 'tennis',
      })
      .select('*, creator:users(*)')
      .single();

    if (error) throw mapSupabaseError(error);
    return mapEvent(data);
  } catch (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Get events by exact date match, optionally filtered by sport
 * @param date - Date string in YYYY-MM-DD format
 * @param sport - Optional sport filter (defaults to 'tennis')
 * @returns Array of events on the specified date
 */
export async function getEventsByDate(date: string, sport?: string): Promise<Event[]> {
  try {
    let query = supabase
      .from('events')
      .select('*, creator:users(*)')
      .eq('event_date', date)
      .eq('sport', sport || 'tennis')
      .order('event_time', { ascending: true });

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data || []).map(mapEvent);
  } catch (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Get upcoming events (event_date >= today), ordered by date ascending
 * @param limit - Maximum number of events to return
 * @param sport - Optional sport filter (defaults to 'tennis')
 * @returns Array of upcoming events, limited to the specified count
 */
export async function getUpcomingEvents(limit: number, sport?: string): Promise<Event[]> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    let query = supabase
      .from('events')
      .select('*, creator:users(*)')
      .eq('sport', sport || 'tennis')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data || []).map(mapEvent);
  } catch (error) {
    throw mapSupabaseError(error);
  }
}
