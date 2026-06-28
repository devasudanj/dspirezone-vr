/**
 * src/api/nexPlayground.ts
 * ------------------------
 * API calls for the Nex Playground endpoints.
 *
 * TODO(backend): Wire these to real FastAPI routes once
 * backend/routers/nex_games.py is implemented:
 *   GET  /nex-games/                  → list
 *   GET  /nex-games/{id}              → detail
 *   POST /nex-games/{id}/visit        → visit counter
 *   GET  /nex-stations/               → active stations
 *   POST /nex-sessions/               → create session
 *   GET  /nex-sessions/{id}           → fetch session
 *
 * Until then, all functions return mock data after a simulated network delay.
 */
import type {
  NexGame,
  NexGameCategory,
  NexGameListItem,
  NexSession,
  NexSessionCreatePayload,
  NexStation,
} from '../types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_GAMES: NexGame[] = [
  {
    id: 'nex-001',
    name: 'Beat Blaster',
    description:
      'Dodge obstacles and blast beats in this fast-paced rhythm action game. Feel the music through full-body movement as you survive increasingly intense waves.',
    category: 'Action',
    thumbnail_url: 'https://picsum.photos/seed/nex-beat/300/180',
    trailer_url: null,
    min_players: 1,
    max_players: 2,
    min_age: 7,
    status: 'ACTIVE',
  },
  {
    id: 'nex-002',
    name: 'Dance Universe',
    description:
      'Follow choreographed routines from around the globe. Compete solo or with friends in a full-body dance showdown.',
    category: 'Dance',
    thumbnail_url: 'https://picsum.photos/seed/nex-dance/300/180',
    trailer_url: null,
    min_players: 1,
    max_players: 4,
    min_age: 5,
    status: 'ACTIVE',
  },
  {
    id: 'nex-003',
    name: 'Soccer Strike',
    description:
      'Head, volley, and kick your way to glory. Full-body tracking turns you into the ultimate striker on a virtual pitch.',
    category: 'Sports',
    thumbnail_url: 'https://picsum.photos/seed/nex-soccer/300/180',
    trailer_url: null,
    min_players: 1,
    max_players: 2,
    min_age: 6,
    status: 'ACTIVE',
  },
  {
    id: 'nex-004',
    name: 'Jungle Explorer',
    description:
      'Swing, climb, and leap through a vibrant jungle ecosystem. A kid-friendly adventure packed with puzzles and hidden secrets.',
    category: 'Kids',
    thumbnail_url: 'https://picsum.photos/seed/nex-jungle/300/180',
    trailer_url: null,
    min_players: 1,
    max_players: 2,
    min_age: 4,
    status: 'ACTIVE',
  },
  {
    id: 'nex-005',
    name: 'Arena Clash',
    description:
      'A 4-player competitive arena brawler. Use your whole body to dodge, block, and strike opponents across 10 unique arenas.',
    category: 'Multiplayer',
    thumbnail_url: 'https://picsum.photos/seed/nex-arena/300/180',
    trailer_url: null,
    min_players: 2,
    max_players: 4,
    min_age: 8,
    status: 'ACTIVE',
  },
  {
    id: 'nex-006',
    name: 'Mountain Trek',
    description:
      'Navigate treacherous mountain paths in an epic adventure. Climb, balance, and leap across stunning virtual landscapes.',
    category: 'Adventure',
    thumbnail_url: 'https://picsum.photos/seed/nex-mountain/300/180',
    trailer_url: null,
    min_players: 1,
    max_players: 2,
    min_age: 8,
    status: 'ACTIVE',
  },
];

const MOCK_STATIONS: NexStation[] = [
  { id: 'st-01', code: 'NEX-01', is_active: true },
  { id: 'st-02', code: 'NEX-02', is_active: true },
  { id: 'st-03', code: 'NEX-03', is_active: false },
];

/** Simulates a network round-trip so UI loading states behave realistically. */
function mockDelay<T>(data: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/** Return the Nex Playground game library filtered by optional category. */
export async function fetchNexGames(
  category?: NexGameCategory,
): Promise<NexGameListItem[]> {
  // TODO(backend): replace with real API call:
  // const params: Record<string, string> = { status: 'ACTIVE' };
  // if (category) params.category = category;
  // const { data } = await client.get<NexGameListItem[]>('/nex-games/', { params });
  // return data;

  const filtered = MOCK_GAMES.filter(
    (g) => g.status === 'ACTIVE' && (!category || g.category === category),
  );
  const items: NexGameListItem[] = filtered.map(({ id, name, category, thumbnail_url, status }) => ({
    id,
    name,
    category,
    thumbnail_url,
    status,
  }));
  return mockDelay(items);
}

/** Return full details for a single Nex game. */
export async function fetchNexGame(gameId: string): Promise<NexGame> {
  // TODO(backend): const { data } = await client.get<NexGame>(`/nex-games/${gameId}`);
  const game = MOCK_GAMES.find((g) => g.id === gameId);
  if (!game) throw new Error('Nex game not found');
  return mockDelay(game);
}

/** Increment the visit counter for a Nex game (fire-and-forget). */
export async function recordNexGameVisit(gameId: string): Promise<void> {
  // TODO(backend): await client.post(`/nex-games/${gameId}/visit`);
  return mockDelay(undefined);
}

/** Return all active Nex stations in the venue. */
export async function fetchNexStations(): Promise<NexStation[]> {
  // TODO(backend): const { data } = await client.get<NexStation[]>('/nex-stations/');
  return mockDelay(MOCK_STATIONS.filter((s) => s.is_active));
}

/** Create a Nex session and return the confirmed record. */
export async function createNexSession(
  payload: NexSessionCreatePayload,
): Promise<NexSession> {
  // TODO(backend): const { data } = await client.post<NexSession>('/nex-sessions/', payload);
  const game = MOCK_GAMES.find((g) => g.id === payload.game_id);
  const sessionId = `NSS-${Date.now()}`;
  const session: NexSession = {
    id: sessionId,
    session_code: `NEX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    game_id: payload.game_id,
    game_name: game?.name ?? 'Unknown Game',
    duration_minutes: payload.duration_minutes,
    players: payload.players,
    station_codes: MOCK_STATIONS.filter((s) => s.is_active)
      .slice(0, payload.players)
      .map((s) => s.code),
    created_at: new Date().toISOString(),
  };
  return mockDelay(session, 800);
}

/** Fetch an existing Nex session by ID. */
export async function fetchNexSession(sessionId: string): Promise<NexSession> {
  // TODO(backend): const { data } = await client.get<NexSession>(`/nex-sessions/${sessionId}`);
  throw new Error('fetchNexSession: backend not yet implemented. Session data must come from store.');
}
