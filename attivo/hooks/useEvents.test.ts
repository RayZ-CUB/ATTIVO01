import { renderHook, act } from '@testing-library/react-hooks';
import { useEvents } from './useEvents';
import { useCommunityStore } from '../store/communityStore';
import * as eventService from '../services/eventService';
import type { Event, CreateEventInput } from '../types';

// Mock the dependencies
jest.mock('../store/communityStore');
jest.mock('../services/eventService');

const mockUseCommunityStore = useCommunityStore as jest.MockedFunction<typeof useCommunityStore>;
const mockEventService = eventService as jest.Mocked<typeof eventService>;

describe('useEvents', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      creatorId: 'user1',
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
      id: '2',
      creatorId: 'user2',
      name: 'Tennis Clinic',
      category: 'clinic',
      location: 'Court 2',
      eventDate: '2024-01-15',
      eventTime: '14:00',
      sport: 'tennis',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockStoreState = {
    events: mockEvents,
    eventsForSelectedDate: [],
    selectedDate: null,
    isLoadingEvents: false,
    fetchEvents: jest.fn(),
    addEvent: jest.fn(),
    selectDate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCommunityStore.mockReturnValue(mockStoreState as any);
  });

  describe('initialization', () => {
    it('should fetch events on mount', async () => {
      renderHook(() => useEvents('tennis'));

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockStoreState.fetchEvents).toHaveBeenCalledWith('tennis');
    });

    it('should expose events from the store', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.events).toEqual(mockEvents);
    });

    it('should expose eventsForSelectedDate from the store', () => {
      mockUseCommunityStore.mockReturnValue({
        ...mockStoreState,
        eventsForSelectedDate: [mockEvents[0]],
      } as any);

      const { result } = renderHook(() => useEvents());

      expect(result.current.eventsForSelectedDate).toEqual([mockEvents[0]]);
    });

    it('should expose selectedDate from the store', () => {
      mockUseCommunityStore.mockReturnValue({
        ...mockStoreState,
        selectedDate: '2024-01-15',
      } as any);

      const { result } = renderHook(() => useEvents());

      expect(result.current.selectedDate).toBe('2024-01-15');
    });

    it('should expose isLoading state', () => {
      mockUseCommunityStore.mockReturnValue({
        ...mockStoreState,
        isLoadingEvents: true,
      } as any);

      const { result } = renderHook(() => useEvents());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('selectDate', () => {
    it('should call store selectDate with the provided date', () => {
      const { result } = renderHook(() => useEvents());

      result.current.selectDate('2024-01-15');

      expect(mockStoreState.selectDate).toHaveBeenCalledWith('2024-01-15');
    });

    it('should call store selectDate with null to clear selection', () => {
      const { result } = renderHook(() => useEvents());

      result.current.selectDate(null);

      expect(mockStoreState.selectDate).toHaveBeenCalledWith(null);
    });
  });

  describe('createEvent', () => {
    const mockNewEvent: Event = {
      id: '3',
      creatorId: 'user1',
      name: 'New Event',
      category: 'social',
      location: 'Court 3',
      eventDate: '2024-01-20',
      eventTime: '16:00',
      sport: 'tennis',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockInput: CreateEventInput = {
      name: 'New Event',
      category: 'social',
      location: 'Court 3',
      eventDate: '2024-01-20',
      eventTime: '16:00',
      sport: 'tennis',
    };

    it('should create an event and add it to the store', async () => {
      mockEventService.createEvent.mockResolvedValue(mockNewEvent);

      const { result } = renderHook(() => useEvents());

      await act(async () => {
        await result.current.createEvent(mockInput);
      });

      expect(mockEventService.createEvent).toHaveBeenCalledWith(mockInput);
      expect(mockStoreState.addEvent).toHaveBeenCalledWith(mockNewEvent);
    });

    it('should set error state when event creation fails', async () => {
      const errorMessage = 'Failed to create event';
      mockEventService.createEvent.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useEvents());

      await act(async () => {
        await expect(result.current.createEvent(mockInput)).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should clear error state before creating event', async () => {
      mockEventService.createEvent.mockResolvedValue(mockNewEvent);

      const { result } = renderHook(() => useEvents());

      await act(async () => {
        await result.current.createEvent(mockInput);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error state when fetchEvents fails', async () => {
      const errorMessage = 'Failed to load events';
      mockStoreState.fetchEvents.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useEvents());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should clear error state on successful fetch', async () => {
      mockStoreState.fetchEvents.mockResolvedValue(undefined);

      const { result } = renderHook(() => useEvents());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
