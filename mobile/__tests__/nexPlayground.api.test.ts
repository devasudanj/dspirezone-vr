/**
 * __tests__/nexPlayground.api.test.ts
 * ------------------------------------
 * Unit tests for the Nex Playground API layer (mock-backed functions).
 */
import {
  fetchNexGames,
  fetchNexGame,
  fetchNexStations,
  createNexSession,
  fetchNexSession,
} from '../src/api/nexPlayground';

describe('fetchNexGames', () => {
  it('returns a non-empty list of active games', async () => {
    const games = await fetchNexGames();
    expect(games.length).toBeGreaterThan(0);
    games.forEach((g) => {
      expect(g.status).toBe('ACTIVE');
      expect(typeof g.id).toBe('string');
      expect(typeof g.name).toBe('string');
    });
  });

  it('filters by category when provided', async () => {
    const danceGames = await fetchNexGames('Dance');
    expect(danceGames.every((g) => g.category === 'Dance')).toBe(true);
  });

  it('returns empty list for a category with no games', async () => {
    const games = await fetchNexGames('Other');
    expect(games).toEqual([]);
  });
});

describe('fetchNexGame', () => {
  it('returns a game by valid ID', async () => {
    const game = await fetchNexGame('nex-001');
    expect(game.id).toBe('nex-001');
    expect(game.name).toBe('Beat Blaster');
    expect(typeof game.description).toBe('string');
    expect(game.description.length).toBeGreaterThan(0);
  });

  it('throws for an unknown ID', async () => {
    await expect(fetchNexGame('nex-unknown-999')).rejects.toThrow('Nex game not found');
  });
});

describe('fetchNexStations', () => {
  it('returns only active stations', async () => {
    const stations = await fetchNexStations();
    expect(stations.length).toBeGreaterThan(0);
    stations.forEach((s) => {
      expect(s.is_active).toBe(true);
    });
  });
});

describe('createNexSession', () => {
  it('creates a session with correct fields', async () => {
    const session = await createNexSession({
      game_id: 'nex-001',
      duration_minutes: 30,
      players: 2,
    });
    expect(session.game_id).toBe('nex-001');
    expect(session.duration_minutes).toBe(30);
    expect(session.players).toBe(2);
    expect(typeof session.session_code).toBe('string');
    expect(session.session_code.length).toBeGreaterThan(0);
    expect(Array.isArray(session.station_codes)).toBe(true);
  });

  it('assigns station codes up to the player count', async () => {
    const session = await createNexSession({
      game_id: 'nex-002',
      duration_minutes: 10,
      players: 1,
    });
    expect(session.station_codes.length).toBeLessThanOrEqual(1);
  });
});

describe('fetchNexSession', () => {
  it('throws because backend is not yet implemented', async () => {
    await expect(fetchNexSession('any-id')).rejects.toThrow();
  });
});
