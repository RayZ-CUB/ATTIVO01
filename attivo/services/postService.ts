import { supabase } from './supabase';
import { ServiceError, mapSupabaseError } from './errors';
import type { Post, CreatePostInput } from '../types';

/**
 * Maps database row to Post interface
 */
function mapPost(data: any): Post {
  return {
    id: data.id,
    authorId: data.author_id,
    body: data.body,
    imageUrl: data.image_url,
    sport: data.sport || 'tennis',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    author: data.author
      ? {
          id: data.author.id,
          email: data.author.email,
          displayName: data.author.display_name,
          role: data.author.role,
          location: data.author.location,
          avatarUrl: data.author.avatar_url,
          sport: data.author.sport || 'tennis',
          createdAt: data.author.created_at,
          updatedAt: data.author.updated_at,
        }
      : undefined,
  };
}

/**
 * Sanitizes post body by stripping HTML tags
 */
function sanitizePostBody(body: string): string {
  // Remove HTML tags
  let sanitized = body.replace(/<[^>]*>/g, '');
  
  // Remove script tags (extra safety)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Retrieves posts with optional filtering by sport and limit
 * Posts are ordered by created_at DESC (newest first)
 * 
 * @param sport - Optional sport filter (defaults to 'tennis')
 * @param limit - Optional limit on number of posts returned
 * @returns Array of Post objects
 */
export async function getPosts(sport?: string, limit?: number): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, author:users!posts_author_id_fkey(*)')
    .order('created_at', { ascending: false });

  // Apply sport filter if provided
  if (sport) {
    query = query.eq('sport', sport);
  }

  // Apply limit if provided
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw mapSupabaseError(error);
  if (!data) return [];

  return data.map(mapPost);
}

/**
 * Creates a new post
 * Validates that body is not empty after trimming
 * Sanitizes body by stripping HTML tags before inserting
 * 
 * @param input - CreatePostInput containing body, optional imageUrl and sport
 * @returns Created Post object
 * @throws ServiceError with code 'VALIDATION' if body is empty after trimming
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  // Validate that body is not empty after trimming
  if (input.body.trim().length === 0) {
    throw new ServiceError('Post body cannot be empty', 'VALIDATION');
  }

  // Sanitize body by stripping HTML tags
  const sanitizedBody = sanitizePostBody(input.body);

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ServiceError('User not authenticated', 'UNAUTHORIZED', 401);
  }

  // Insert post into database
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      body: sanitizedBody,
      image_url: input.imageUrl,
      sport: input.sport || 'tennis',
    })
    .select('*, author:users!posts_author_id_fkey(*)')
    .single();

  if (error) throw mapSupabaseError(error);
  return mapPost(data);
}
