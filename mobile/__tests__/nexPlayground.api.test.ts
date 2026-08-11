/**
 * __tests__/nexPlayground.api.test.ts
 * ------------------------------------
 * Unit tests for the Nex Playground API layer.
 */
import client from '../src/api/client';
import {
  fetchNexGames,
  fetchNexGame,
  fetchNexStations,
  createNexSession,
  fetchNexSession,
} from '../src/api/nexPlayground';

jest.mock('../src/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedClient = client as jest.Mocked<typeof client>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchNexGames', () => {
  it('returns a non-empty list of active games', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          name: 'Beat Saber',
          category: 'Action',
          thumbnail_url: 'https://example.com/beat.jpg',
          status: 'ACTIVE',
        },
      ],
    });

    const games = await fetchNexGames();
    expect(games.length).toBeGreaterThan(0);
    games.forEach((g) => {
      expect(g.status).toBe('ACTIVE');
      expect(typeof g.id).toBe('string');
      expect(typeof g.name).toBe('string');
    });
  });

  it('filters by category when provided', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: [
        {
          id: 'nex-10',
          name: 'Dance Universe',
          category: 'Dance',
          thumbnail_url: 'https://example.com/dance.jpg',
          status: 'ACTIVE',
        },
      ],
    });

    const danceGames = await fetchNexGames('Dance');
    expect(danceGames.every((g) => g.category === 'Dance')).toBe(true);
    expect(mockedClient.get).toHaveBeenCalledWith('/api/nex-games/', {
      params: { status: 'active', category: 'Dance' },
    });
  });

  it('returns empty list when backend returns no games for a category', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: [] });
    const games = await fetchNexGames('Multiplayer');
    expect(games).toEqual([]);
    expect(mockedClient.get).toHaveBeenCalledWith('/api/nex-games/', {
      params: { status: 'active', category: 'Multiplayer' },
    });
  });

  it('uses YouTube preview when thumbnail_url is not a direct image', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: [
        {
          id: 3,
          name: 'Party Fowl',
          category: 'Multiplayer',
          thumbnail_url: 'https://www.nex.inc/partyfowl',
          youtube_url: 'https://www.youtube.com/watch?v=dNfACINSbOU',
          status: 'active',
        },
      ],
    });

    const games = await fetchNexGames();
    expect(games[0].thumbnail_url).toBe('https://img.youtube.com/vi/dNfACINSbOU/hqdefault.jpg');
  });
});

describe('fetchNexGame', () => {
  it('returns a game by valid ID', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Beat Saber',
        description: 'Rhythm slicing game',
        category: 'Action',
        thumbnail_url: 'https://example.com/beat.jpg',
        video_url: null,
        youtube_url: null,
        viewable_age: 10,
        is_multiplayer: false,
        visit_count: 0,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      },
    });

    const game = await fetchNexGame('1');
    expect(mockedClient.get).toHaveBeenCalledWith('/api/nex-games/1');
    expect(game.id).toBe('1');
    expect(game.name).toBe('Beat Saber');
    expect(typeof game.description).toBe('string');
    expect(game.description.length).toBeGreaterThan(0);
  });

  it('maps backend youtube_url to trailer_url for Nex detail', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: {
        id: 12,
        name: 'Batman: Arkham Shadow',
        description: 'Nex experience',
        category: 'Action',
        thumbnail_url: 'https://example.com/nex-thumb.jpg',
        youtube_url: 'https://www.youtube.com/watch?v=abc123xyz78',
        status: 'ACTIVE',
        station_id: 1,
      },
    });

    const game = await fetchNexGame('12');
    expect(game.trailer_url).toBe('https://www.youtube.com/watch?v=abc123xyz78');
  });

  it('throws for an unknown ID', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('Game not found'));
    await expect(fetchNexGame('999')).rejects.toThrow('Nex game not found');
    expect(mockedClient.get).toHaveBeenCalledWith('/api/nex-games/999');
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
      duration_minutes: 15,
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
