import { useCommunityStore } from './communityStore';
import * as postService from '../services/postService';
import * as eventService from '../services/eventService';
import { supabase } from '../services/supabase';
import type { Post, Event } from '../types';

// Mock the services
jest.mock('../services/postService');
jest.mock('../services/eventService');
jest.mock('../services/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

describe('communityStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useCommunityStore.setState({
      posts: [],
      events: [],
      selectedDate: null,
      eventsForSelectedDate: [],
      isLoadingPosts: false,
      isLoadingEvents: false,
      realtimeSubscription: null,
    });
  });

  describe('fetchPosts', () => {
    it('should fetch posts and update state', async () => {
      const mockPosts: Post[] = [
        {
          id: 'post-1',
          authorId: 'user-1',
          body: 'Test post',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (postService.getPosts as jest.Mock).mockResolvedValue(mockPosts);

      const store = useCommunityStore.getState();
      await store.fetchPosts('tennis');

      expect(postService.getPosts).toHaveBeenCalledWith('tennis');
      expect(useCommunityStore.getState().posts).toEqual(mockPosts);
      expect(useCommunityStore.getState().isLoadingPosts).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      (postService.getPosts as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const store = useCommunityStore.getState();
      const fetchPromise = store.fetchPosts('tennis');

      // Check loading state is true during fetch
      expect(useCommunityStore.getState().isLoadingPosts).toBe(true);

      await fetchPromise;

      // Check loading state is false after fetch
      expect(useCommunityStore.getState().isLoadingPosts).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (postService.getPosts as jest.Mock).mockRejectedValue(new Error('Network error'));

      const store = useCommunityStore.getState();
      await store.fetchPosts('tennis');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch posts:',
        expect.any(Error)
      );
      expect(useCommunityStore.getState().isLoadingPosts).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('fetchEvents', () => {
    it('should fetch events and update state', async () => {
      const mockEvents: Event[] = [
        {
          id: 'event-1',
          creatorId: 'user-1',
          name: 'Tennis Match',
          category: 'match',
          location: 'Court 1',
          eventDate: '2024-01-15',
          eventTime: '10:00',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (eventService.getEvents as jest.Mock).mockResolvedValue(mockEvents);

      const store = useCommunityStore.getState();
      await store.fetchEvents('tennis');

      expect(eventService.getEvents).toHaveBeenCalledWith('tennis');
      expect(useCommunityStore.getState().events).toEqual(mockEvents);
      expect(useCommunityStore.getState().isLoadingEvents).toBe(false);
    });

    it('should update eventsForSelectedDate when a date is selected', async () => {
      const mockEvents: Event[] = [
        {
          id: 'event-1',
          creatorId: 'user-1',
          name: 'Tennis Match',
          category: 'match',
          location: 'Court 1',
          eventDate: '2024-01-15',
          eventTime: '10:00',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'event-2',
          creatorId: 'user-2',
          name: 'Tennis Clinic',
          category: 'clinic',
          location: 'Court 2',
          eventDate: '2024-01-16',
          eventTime: '14:00',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (eventService.getEvents as jest.Mock).mockResolvedValue(mockEvents);

      // Select a date first
      useCommunityStore.getState().selectDate('2024-01-15');

      // Fetch events
      await useCommunityStore.getState().fetchEvents('tennis');

      // Should filter events for selected date
      expect(useCommunityStore.getState().eventsForSelectedDate).toHaveLength(1);
      expect(useCommunityStore.getState().eventsForSelectedDate[0].id).toBe('event-1');
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (eventService.getEvents as jest.Mock).mockRejectedValue(new Error('Network error'));

      const store = useCommunityStore.getState();
      await store.fetchEvents('tennis');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch events:',
        expect.any(Error)
      );
      expect(useCommunityStore.getState().isLoadingEvents).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addPost', () => {
    it('should add a post to the beginning of the posts array', () => {
      const existingPost: Post = {
        id: 'post-1',
        authorId: 'user-1',
        body: 'Existing post',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const newPost: Post = {
        id: 'post-2',
        authorId: 'user-2',
        body: 'New post',
        sport: 'tennis',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      useCommunityStore.setState({ posts: [existingPost] });
      useCommunityStore.getState().addPost(newPost);

      const posts = useCommunityStore.getState().posts;
      expect(posts).toHaveLength(2);
      expect(posts[0]).toEqual(newPost);
      expect(posts[1]).toEqual(existingPost);
    });
  });

  describe('addEvent', () => {
    it('should add an event and maintain chronological order', () => {
      const event1: Event = {
        id: 'event-1',
        creatorId: 'user-1',
        name: 'Event 1',
        category: 'match',
        location: 'Court 1',
        eventDate: '2024-01-15',
        eventTime: '10:00',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const event2: Event = {
        id: 'event-2',
        creatorId: 'user-2',
        name: 'Event 2',
        category: 'clinic',
        location: 'Court 2',
        eventDate: '2024-01-10',
        eventTime: '14:00',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useCommunityStore.setState({ events: [event1] });
      useCommunityStore.getState().addEvent(event2);

      const events = useCommunityStore.getState().events;
      expect(events).toHaveLength(2);
      // event2 should come first because it's earlier
      expect(events[0].id).toBe('event-2');
      expect(events[1].id).toBe('event-1');
    });

    it('should update eventsForSelectedDate when adding event for selected date', () => {
      const event: Event = {
        id: 'event-1',
        creatorId: 'user-1',
        name: 'Event 1',
        category: 'match',
        location: 'Court 1',
        eventDate: '2024-01-15',
        eventTime: '10:00',
        sport: 'tennis',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useCommunityStore.setState({
        selectedDate: '2024-01-15',
        eventsForSelectedDate: [],
      });

      useCommunityStore.getState().addEvent(event);

      expect(useCommunityStore.getState().eventsForSelectedDate).toHaveLength(1);
      expect(useCommunityStore.getState().eventsForSelectedDate[0].id).toBe('event-1');
    });
  });

  describe('selectDate', () => {
    it('should filter events for the selected date', () => {
      const events: Event[] = [
        {
          id: 'event-1',
          creatorId: 'user-1',
          name: 'Event 1',
          category: 'match',
          location: 'Court 1',
          eventDate: '2024-01-15',
          eventTime: '10:00',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'event-2',
          creatorId: 'user-2',
          name: 'Event 2',
          category: 'clinic',
          location: 'Court 2',
          eventDate: '2024-01-16',
          eventTime: '14:00',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'event-3',
          creatorId: 'user-3',
          name: 'Event 3',
          category: 'social',
          location: 'Court 3',
          eventDate: '2024-01-15',
          eventTime: '16:00',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      useCommunityStore.setState({ events });
      useCommunityStore.getState().selectDate('2024-01-15');

      const state = useCommunityStore.getState();
      expect(state.selectedDate).toBe('2024-01-15');
      expect(state.eventsForSelectedDate).toHaveLength(2);
      expect(state.eventsForSelectedDate[0].id).toBe('event-1');
      expect(state.eventsForSelectedDate[1].id).toBe('event-3');
    });

    it('should clear eventsForSelectedDate when date is null', () => {
      const events: Event[] = [
        {
          id: 'event-1',
          creatorId: 'user-1',
          name: 'Event 1',
          category: 'match',
          location: 'Court 1',
          eventDate: '2024-01-15',
          eventTime: '10:00',
          sport: 'tennis',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      useCommunityStore.setState({
        events,
        selectedDate: '2024-01-15',
        eventsForSelectedDate: events,
      });

      useCommunityStore.getState().selectDate(null);

      const state = useCommunityStore.getState();
      expect(state.selectedDate).toBeNull();
      expect(state.eventsForSelectedDate).toHaveLength(0);
    });
  });

  describe('subscribeToFeed', () => {
    it('should create a realtime subscription', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };

      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      useCommunityStore.getState().subscribeToFeed('tennis');

      expect(supabase.channel).toHaveBeenCalledWith('posts-changes');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'sport=eq.tennis',
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(useCommunityStore.getState().realtimeSubscription).toBe(mockChannel);
    });

    it('should unsubscribe from existing subscription before creating new one', () => {
      const oldChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };

      const newChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };

      useCommunityStore.setState({ realtimeSubscription: oldChannel as any });

      (supabase.channel as jest.Mock).mockReturnValue(newChannel);

      useCommunityStore.getState().subscribeToFeed('tennis');

      expect(supabase.removeChannel).toHaveBeenCalledWith(oldChannel);
      expect(useCommunityStore.getState().realtimeSubscription).toBe(newChannel);
    });

    it('should subscribe without sport filter when sport is not provided', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };

      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      useCommunityStore.getState().subscribeToFeed();

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: undefined,
        }),
        expect.any(Function)
      );
    });
  });

  describe('unsubscribeFromFeed', () => {
    it('should remove the realtime subscription', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };

      useCommunityStore.setState({ realtimeSubscription: mockChannel as any });

      useCommunityStore.getState().unsubscribeFromFeed();

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
      expect(useCommunityStore.getState().realtimeSubscription).toBeNull();
    });

    it('should do nothing if no subscription exists', () => {
      useCommunityStore.setState({ realtimeSubscription: null });

      useCommunityStore.getState().unsubscribeFromFeed();

      expect(supabase.removeChannel).not.toHaveBeenCalled();
      expect(useCommunityStore.getState().realtimeSubscription).toBeNull();
    });
  });
});
