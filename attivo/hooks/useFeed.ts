import { useEffect, useState } from 'react';
import { useCommunityStore } from '../store/communityStore';
import * as postService from '../services/postService';
import type { Post, CreatePostInput } from '../types';

interface UseFeedReturn {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  createPost: (input: CreatePostInput) => Promise<void>;
}

/**
 * Custom hook for managing the community feed
 * 
 * Features:
 * - Fetches posts on mount via communityStore.fetchPosts()
 * - Subscribes to realtime updates via communityStore.subscribeToFeed()
 * - Unsubscribes on unmount
 * - Provides createPost helper that creates a post and adds it to the store
 * 
 * @param sport - Optional sport filter (defaults to 'tennis')
 * @returns Object containing posts, isLoading, error, and createPost function
 * 
 * Requirements: 2.9, 7.1, 7.2
 */
export function useFeed(sport?: string): UseFeedReturn {
  const {
    posts,
    isLoadingPosts,
    fetchPosts,
    addPost,
    subscribeToFeed,
    unsubscribeFromFeed,
  } = useCommunityStore();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch posts on mount
    const loadPosts = async () => {
      try {
        setError(null);
        await fetchPosts(sport);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      }
    };

    loadPosts();

    // Subscribe to realtime updates
    subscribeToFeed(sport);

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribeFromFeed();
    };
  }, [sport, fetchPosts, subscribeToFeed, unsubscribeFromFeed]);

  /**
   * Creates a new post and adds it to the store
   * 
   * @param input - CreatePostInput containing body, optional imageUrl and sport
   * @throws Error if post creation fails
   */
  const createPost = async (input: CreatePostInput): Promise<void> => {
    try {
      setError(null);
      // Create post via service
      const newPost = await postService.createPost(input);
      // Add post to store for immediate UI update
      addPost(newPost);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    posts,
    isLoading: isLoadingPosts,
    error,
    createPost,
  };
}
