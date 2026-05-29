import { create } from 'zustand';
import * as postService from '../services/postService';
import * as eventService from '../services/eventService';
import type { Post, Event } from '../types';
import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CommunityState {
  // State
  posts: Post[];
  events: Event[];
  selectedDate: string | null;
  eventsForSelectedDate: Event[];
  isLoadingPosts: boolean;
  isLoadingEvents: boolean;
  realtimeSubscription: RealtimeChannel | null;

  // Actions
  fetchPosts: (sport?: string) => Promise<void>;
  fetchEvents: (sport?: string) => Promise<void>;
  addPost: (post: Post) => void;
  addEvent: (event: Event) => void;
  selectDate: (date: string | null) => void;
  subscribeToFeed: (sport?: string) => void;
  unsubscribeFromFeed: () => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  // Initial state
  posts: [],
  events: [],
  selectedDate: null,
  eventsForSelectedDate: [],
  isLoadingPosts: false,
  isLoadingEvents: false,
  realtimeSubscription: null,

  /**
   * Fetches posts from the service layer
   * @param sport - Optional sport filter (defaults to 'tennis')
   */
  fetchPosts: async (sport?: string) => {
    set({ isLoadingPosts: true });
    try {
      const posts = await postService.getPosts(sport);
      set({ posts, isLoadingPosts: false });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      set({ isLoadingPosts: false });
    }
  },

  /**
   * Fetches events from the service layer
   * @param sport - Optional sport filter (defaults to 'tennis')
   */
  fetchEvents: async (sport?: string) => {
    set({ isLoadingEvents: true });
    try {
      const events = await eventService.getEvents(sport);
      set({ events, isLoadingEvents: false });
      
      // Update eventsForSelectedDate if a date is selected
      const { selectedDate } = get();
      if (selectedDate) {
        const filtered = events.filter(
          (event) => event.eventDate === selectedDate
        );
        set({ eventsForSelectedDate: filtered });
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      set({ isLoadingEvents: false });
    }
  },

  /**
   * Adds a post to the store (for optimistic/realtime updates)
   * @param post - Post to add
   */
  addPost: (post: Post) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },

  /**
   * Adds an event to the store (for optimistic/realtime updates)
   * @param event - Event to add
   */
  addEvent: (event: Event) => {
    set((state) => {
      const newEvents = [...state.events, event].sort(
        (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
      
      // Update eventsForSelectedDate if the new event matches the selected date
      const eventsForSelectedDate = state.selectedDate
        ? newEvents.filter((e) => e.eventDate === state.selectedDate)
        : state.eventsForSelectedDate;
      
      return {
        events: newEvents,
        eventsForSelectedDate,
      };
    });
  },

  /**
   * Selects a date and filters events for that date
   * @param date - Date string in YYYY-MM-DD format, or null to clear selection
   */
  selectDate: (date: string | null) => {
    const { events } = get();
    const eventsForSelectedDate = date
      ? events.filter((event) => event.eventDate === date)
      : [];
    
    set({
      selectedDate: date,
      eventsForSelectedDate,
    });
  },

  /**
   * Subscribes to realtime updates for the posts table
   * Listens for INSERT events and adds new posts to the store
   * @param sport - Optional sport filter (defaults to 'tennis')
   */
  subscribeToFeed: (sport?: string) => {
    // Unsubscribe from existing subscription if any
    const { realtimeSubscription } = get();
    if (realtimeSubscription) {
      supabase.removeChannel(realtimeSubscription);
    }

    // Create new subscription
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: sport ? `sport=eq.${sport}` : undefined,
        },
        async (payload) => {
          // Fetch the full post with author data
          const { data, error } = await supabase
            .from('posts')
            .select('*, author:users!posts_author_id_fkey(*)')
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            // Map the post data to match the Post interface
            const newPost: Post = {
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

            // Add the new post to the store
            get().addPost(newPost);
          }
        }
      )
      .subscribe();

    set({ realtimeSubscription: channel });
  },

  /**
   * Unsubscribes from realtime updates and cleans up the channel
   */
  unsubscribeFromFeed: () => {
    const { realtimeSubscription } = get();
    if (realtimeSubscription) {
      supabase.removeChannel(realtimeSubscription);
      set({ realtimeSubscription: null });
    }
  },
}));
