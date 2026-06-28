/**
 * __tests__/types.test.ts
 * -----------------------
 * Unit tests for Nex Playground type models and guards.
 */
import type {
  GamePlatform,
  NexGame,
  NexGameListItem,
  NexSession,
  NexSessionCreatePayload,
  NexStation,
  GameStatus,
  NexGameCategory,
} from '../src/types';

describe('Nex Playground types', () => {
  describe('NexGameListItem', () => {
    it('accepts a valid NexGameListItem', () => {
      const item: NexGameListItem = {
        id: 'nex-001',
        name: 'Beat Blaster',
        category: 'Action',
        thumbnail_url: 'https://example.com/img.jpg',
        status: 'ACTIVE',
      };
      expect(item.id).toBe('nex-001');
      expect(item.status).toBe('ACTIVE');
    });
  });

  describe('NexGame', () => {
    it('accepts a valid full NexGame', () => {
      const game: NexGame = {
        id: 'nex-002',
        name: 'Dance Universe',
        description: 'A dance game.',
        category: 'Dance',
        thumbnail_url: 'https://example.com/img.jpg',
        trailer_url: null,
        min_players: 1,
        max_players: 4,
        min_age: 5,
        status: 'ACTIVE',
      };
      expect(game.max_players).toBe(4);
      expect(game.trailer_url).toBeNull();
    });
  });

  describe('NexSession', () => {
    it('accepts a valid NexSession', () => {
      const session: NexSession = {
        id: 'NSS-1234',
        session_code: 'NEX-ABCDEF',
        game_id: 'nex-001',
        game_name: 'Beat Blaster',
        duration_minutes: 30,
        players: 2,
        station_codes: ['NEX-01', 'NEX-02'],
        created_at: new Date().toISOString(),
      };
      expect(session.players).toBe(2);
      expect(session.station_codes).toHaveLength(2);
    });
  });

  describe('NexSessionCreatePayload', () => {
    it('accepts a valid payload', () => {
      const payload: NexSessionCreatePayload = {
        game_id: 'nex-001',
        duration_minutes: 30,
        players: 1,
      };
      expect(payload.duration_minutes).toBe(30);
    });
  });

  describe('GamePlatform', () => {
    it('represents both platforms', () => {
      const vr: GamePlatform = 'VR';
      const nex: GamePlatform = 'NEX_PLAYGROUND';
      expect(vr).toBe('VR');
      expect(nex).toBe('NEX_PLAYGROUND');
    });
  });
});
