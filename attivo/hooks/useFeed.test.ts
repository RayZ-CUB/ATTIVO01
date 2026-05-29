import * as postService from '../services/postService';
import type { Post, CreatePostInput } from '../types';

// Mock dependencies
jest.mock('../services/postService');
jest.mock('../store/communityStore', () => ({
  useCommunityStore: jest.fn(),
}));

// Mock React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn) => fn()),
  useState: jest.fn((initial) => [initial, jest.fn()]),
}));

describe('useFeed Hook Logic', () => {
  const mockPost: Post = {
    id: '1',
    authorId: 'user-1',
    body: 'Test post',
    sport: 'tennis',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockFetchPosts = jest.fn().mockResolvedValue(undefined);
  const mockAddPost = jest.fn();
  const mockSubscribeToFeed = jest.fn();
  const mockUnsubscribeFromFeed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { useCommunityStore } = require('../store/communityStore');
    useCommunityStore.mockReturnValue({
      posts: [mockPost],
      isLoadingPosts: false,
      fetchPosts: mockFetchPosts,
      addPost: mockAddPost,
      subscribeToFeed: mockSubscribeToFeed,
      unsubscribeFromFeed: mockUnsubscribeFromFeed,
    });
  });

  describe('createPost functionality', () => {
    it('should call postService.createPost with correct input', async () => {
      const newPost: Post = {
        id: '2',
        authorId: 'user-1',
        body: 'New post',
        sport: 'tennis',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      (postService.createPost as jest.Mock).mockResolvedValue(newPost);

      const { useFeed } = require('./useFeed');
      const hookResult = useFeed();

      const input: CreatePostInput = {
        body: 'New post',
        sport: 'tennis',
      };

      await hookResult.createPost(input);

      expect(postService.createPost).toHaveBeenCalledWith(input);
      expect(mockAddPost).toHaveBeenCalledWith(newPost);
    });

    it('should throw error when postService.createPost fails', async () => {
      const error = new Error('Failed to create post');
      (postService.createPost as jest.Mock).mockRejectedValue(error);

      const { useFeed } = require('./useFeed');
      const hookResult = useFeed();

      const input: CreatePostInput = {
        body: 'New post',
        sport: 'tennis',
      };

      await expect(hookResult.createPost(input)).rejects.toThrow('Failed to create post');
      expect(mockAddPost).not.toHaveBeenCalled();
    });

    it('should not call addPost when createPost fails', async () => {
      const error = new Error('Network error');
      (postService.createPost as jest.Mock).mockRejectedValue(error);

      const { useFeed } = require('./useFeed');
      const hookResult = useFeed();

      const input: CreatePostInput = {
        body: 'Test post',
      };

      try {
        await hookResult.createPost(input);
      } catch (e) {
        // Expected error
      }

      expect(mockAddPost).not.toHaveBeenCalled();
    });
  });

  describe('Return values', () => {
    it('should return posts from communityStore', () => {
      const { useFeed } = require('./useFeed');
      const result = useFeed();

      expect(result.posts).toEqual([mockPost]);
    });

    it('should return isLoading from communityStore', () => {
      const { useCommunityStore } = require('../store/communityStore');
      useCommunityStore.mockReturnValue({
        posts: [],
        isLoadingPosts: true,
        fetchPosts: mockFetchPosts,
        addPost: mockAddPost,
        subscribeToFeed: mockSubscribeToFeed,
        unsubscribeFromFeed: mockUnsubscribeFromFeed,
      });

      const { useFeed } = require('./useFeed');
      const result = useFeed();

      expect(result.isLoading).toBe(true);
    });

    it('should expose createPost function', () => {
      const { useFeed } = require('./useFeed');
      const result = useFeed();

      expect(typeof result.createPost).toBe('function');
    });
  });

  describe('Store integration', () => {
    it('should call fetchPosts on initialization', () => {
      const { useFeed } = require('./useFeed');
      useFeed();

      expect(mockFetchPosts).toHaveBeenCalled();
    });

    it('should call subscribeToFeed on initialization', () => {
      const { useFeed } = require('./useFeed');
      useFeed();

      expect(mockSubscribeToFeed).toHaveBeenCalled();
    });

    it('should pass sport parameter to fetchPosts and subscribeToFeed', () => {
      const { useFeed } = require('./useFeed');
      useFeed('skiing');

      expect(mockFetchPosts).toHaveBeenCalledWith('skiing');
      expect(mockSubscribeToFeed).toHaveBeenCalledWith('skiing');
    });
  });
});
