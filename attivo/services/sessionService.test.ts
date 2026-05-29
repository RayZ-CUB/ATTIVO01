import { sessionService } from './sessionService';
import { supabase } from './supabase';
import { ServiceError } from './errors';
import type { CreateSessionRequestInput, SessionStatus } from '../types';

// Mock the supabase client
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSessionRequest', () => {
    it('should throw ServiceError when coach is not approved', async () => {
      const input: CreateSessionRequestInput = {
        playerId: 'player-123',
        coachId: 'coach-456',
        message: 'Looking forward to training',
        sport: 'tennis',
      };

      // Mock coach verification check - coach is pending
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { verification_status: 'pending' },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(sessionService.createSessionRequest(input)).rejects.toThrow(
        ServiceError
      );
      await expect(sessionService.createSessionRequest(input)).rejects.toThrow(
        'Coach is not approved'
      );
    });

    it('should create session request when coach is approved', async () => {
      const input: CreateSessionRequestInput = {
        playerId: 'player-123',
        coachId: 'coach-456',
        message: 'Looking forward to training',
        sport: 'tennis',
      };

      const mockSessionData = {
        id: 'session-789',
        player_id: 'player-123',
        coach_id: 'coach-456',
        status: 'pending',
        message: 'Looking forward to training',
        sport: 'tennis',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock coach verification check - coach is approved
      const mockSelectVerification = jest.fn().mockReturnThis();
      const mockEqVerification = jest.fn().mockReturnThis();
      const mockSingleVerification = jest.fn().mockResolvedValue({
        data: { verification_status: 'approved' },
        error: null,
      });

      // Mock session request creation
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectSession = jest.fn().mockReturnThis();
      const mockSingleSession = jest.fn().mockResolvedValue({
        data: mockSessionData,
        error: null,
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: verification check
          return {
            select: mockSelectVerification,
          };
        } else {
          // Second call: insert session request
          return {
            insert: mockInsert,
          };
        }
      });

      mockSelectVerification.mockReturnValue({
        eq: mockEqVerification,
      });
      mockEqVerification.mockReturnValue({
        single: mockSingleVerification,
      });

      mockInsert.mockReturnValue({
        select: mockSelectSession,
      });
      mockSelectSession.mockReturnValue({
        single: mockSingleSession,
      });

      const result = await sessionService.createSessionRequest(input);

      expect(result).toBeDefined();
      expect(result.id).toBe('session-789');
      expect(result.playerId).toBe('player-123');
      expect(result.coachId).toBe('coach-456');
      expect(result.status).toBe('pending');
    });
  });

  describe('getSessionRequestsByPlayer', () => {
    it('should return session requests for a player', async () => {
      const playerId = 'player-123';
      const mockData = [
        {
          id: 'session-1',
          player_id: playerId,
          coach_id: 'coach-1',
          status: 'pending',
          sport: 'tennis',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await sessionService.getSessionRequestsByPlayer(playerId);

      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe(playerId);
    });
  });

  describe('getSessionRequestsByCoach', () => {
    it('should return session requests for a coach', async () => {
      const coachId = 'coach-456';
      const mockData = [
        {
          id: 'session-1',
          player_id: 'player-1',
          coach_id: coachId,
          status: 'pending',
          sport: 'tennis',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await sessionService.getSessionRequestsByCoach(coachId);

      expect(result).toHaveLength(1);
      expect(result[0].coachId).toBe(coachId);
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session request status', async () => {
      const requestId = 'session-789';
      const newStatus: SessionStatus = 'accepted';
      const mockData = {
        id: requestId,
        player_id: 'player-123',
        coach_id: 'coach-456',
        status: newStatus,
        sport: 'tennis',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await sessionService.updateSessionStatus(requestId, newStatus);

      expect(result).toBeDefined();
      expect(result.id).toBe(requestId);
      expect(result.status).toBe(newStatus);
    });
  });
});
