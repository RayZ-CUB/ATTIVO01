import { useEffect, useState } from 'react';
import { useCommunityStore } from '../store/communityStore';
import * as eventService from '../services/eventService';
import type { Event, CreateEventInput } from '../types';

interface UseEventsReturn {
  events: Event[];
  eventsForSelectedDate: Event[];
  selectedDate: string | null;
  isLoading: boolean;
  error: string | null;
  selectDate: (date: string | null) => void;
  createEvent: (input: CreateEventInput) => Promise<void>;
}

/**
 * Custom hook for managing community events
 * 
 * Features:
 * - Fetches events on mount via communityStore.fetchEvents()
 * - Exposes events, eventsForSelectedDate, selectedDate, isLoading, error
 * - Provides selectDate helper that wraps communityStore.selectDate()
 * - Provides createEvent helper that creates an event and adds it to the store
 * 
 * @param sport - Optional sport filter (defaults to 'tennis')
 * @returns Object containing events, eventsForSelectedDate, selectedDate, isLoading, error, selectDate, and createEvent
 * 
 * Requirements: 7.4, 7.5, 7.6, 7.7
 */
export function useEvents(sport?: string): UseEventsReturn {
  const {
    events,
    eventsForSelectedDate,
    selectedDate,
    isLoadingEvents,
    fetchEvents,
    addEvent,
    selectDate: storeSelectDate,
  } = useCommunityStore();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch events on mount
    const loadEvents = async () => {
      try {
        setError(null);
        await fetchEvents(sport);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      }
    };

    loadEvents();
  }, [sport, fetchEvents]);

  /**
   * Selects a date and filters events for that date
   * 
   * @param date - Date string in YYYY-MM-DD format, or null to clear selection
   */
  const selectDate = (date: string | null): void => {
    storeSelectDate(date);
  };

  /**
   * Creates a new event and adds it to the store
   * 
   * @param input - CreateEventInput containing event details
   * @throws Error if event creation fails
   */
  const createEvent = async (input: CreateEventInput): Promise<void> => {
    try {
      setError(null);
      // Create event via service
      const newEvent = await eventService.createEvent(input);
      // Add event to store for immediate UI update
      addEvent(newEvent);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    events,
    eventsForSelectedDate,
    selectedDate,
    isLoading: isLoadingEvents,
    error,
    selectDate,
    createEvent,
  };
}
