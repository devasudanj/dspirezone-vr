/**
 * src/api/nexPlayground.ts
 * ------------------------
 * API calls for the Nex Playground screens.
 *
 * The game library + game detail are sourced from the existing /games backend
 * endpoints so the Nex flow always reflects live backend data.
 *
 * Nex stations and Nex sessions remain mock-backed until dedicated backend
 * routes are introduced.
 */
import client from './client';
import type {
  Game,
  GameListItem,
  GameCategory,
  NexGame,
  NexGameCategory,
  NexGameListItem,
  NexSession,
  NexSessionCreatePayload,
  NexStation,
} from '../types';

interface NexApiGame {
  id: number;
  name: string;
  description?: string;
  status?: string;
  is_available?: boolean;
  station_id?: number;
  category?: string;
  thumbnail_url?: string;
}

interface NexApiListResponse {
  items: NexApiGame[];
}

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

function toNexCategory(category: GameCategory): NexGameCategory {
  return category;
}

function normalizeNexStatus(status?: string): 'ACTIVE' | 'EXPIRED' | 'DISABLED' {
  if (!status) return 'ACTIVE';
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'ACTIVE';
  if (normalized === 'disabled' || normalized === 'inactive') return 'DISABLED';
  return 'EXPIRED';
}

function normalizeNexCategory(category?: string): NexGameCategory {
  const known: readonly NexGameCategory[] = [
    'Action',
    'Adventure',
    'Kids',
    'Horror',
    'Educational',
    'Sports',
    'Simulation',
    'Puzzle',
    'Other',
    'Dance',
    'Multiplayer',
  ];
  if (!category) return 'Other';
  const match = known.find((value) => value.toLowerCase() === category.toLowerCase());
  return match ?? 'Other';
}

function mapGameListItemToNex(item: GameListItem): NexGameListItem {
  return {
    id: String(item.id),
    name: item.name,
    category: toNexCategory(item.category),
    thumbnail_url: item.thumbnail_url,
    status: item.status,
  };
}

function mapGameToNex(game: Game): NexGame {
  return {
    id: String(game.id),
    name: game.name,
    description: game.description,
    category: toNexCategory(game.category),
    thumbnail_url: game.thumbnail_url,
    trailer_url: game.video_url ?? game.youtube_url,
    min_players: game.is_multiplayer ? 2 : 1,
    max_players: game.is_multiplayer ? 4 : 2,
    min_age: game.viewable_age,
    status: game.status,
  };
}

function mapNexApiGameListItem(item: NexApiGame): NexGameListItem {
  return {
    id: String(item.id),
    name: item.name,
    category: normalizeNexCategory(item.category),
    thumbnail_url: item.thumbnail_url ?? 'https://via.placeholder.com/300x180',
    status: normalizeNexStatus(item.status),
  };
}

function mapNexApiGameDetail(item: NexApiGame): NexGame {
  return {
    id: String(item.id),
    name: item.name,
    description: item.description ?? '',
    category: normalizeNexCategory(item.category),
    thumbnail_url: item.thumbnail_url ?? 'https://via.placeholder.com/600x340',
    trailer_url: null,
    min_players: 1,
    max_players: 4,
    min_age: null,
    status: normalizeNexStatus(item.status),
  };
}

function parseGameId(gameId: string): number {
  const direct = Number(gameId);
  if (Number.isInteger(direct) && direct > 0) {
    return direct;
  }

  // Backward compatibility with legacy IDs like "nex-001".
  const suffixMatch = gameId.match(/(\d+)$/);
  const fromSuffix = suffixMatch ? Number(suffixMatch[1]) : Number.NaN;
  if (!Number.isInteger(fromSuffix) || fromSuffix <= 0) {
    throw new Error('Invalid game ID');
  }
  return fromSuffix;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/** Return the Nex Playground game library filtered by optional category. */
export async function fetchNexGames(
  category?: NexGameCategory,
): Promise<NexGameListItem[]> {
  const params: Record<string, string> = { status: 'active' };
  if (category) params.category = category;

  const { data } = await client.get<NexApiListResponse | Array<NexGameListItem | GameListItem | NexApiGame>>('/api/nex-games/', {
    params,
  });

  const items = Array.isArray(data)
    ? data
    : Array.isArray((data as NexApiListResponse).items)
      ? (data as NexApiListResponse).items
      : [];

  return items.map((item) => {
    if (item && typeof item === 'object' && 'station_id' in item) {
      return mapNexApiGameListItem(item as NexApiGame);
    }
    if (typeof item.id === 'string') {
      return item as NexGameListItem;
    }
    return mapGameListItemToNex(item as GameListItem);
  });
}

/** Return full details for a single Nex game. */
export async function fetchNexGame(gameId: string): Promise<NexGame> {
  const parsedId = parseGameId(gameId);
  try {
    const { data } = await client.get<NexGame | Game | NexApiGame>(`/api/nex-games/${parsedId}`);
    if (data && typeof data === 'object' && 'station_id' in data) {
      return mapNexApiGameDetail(data as NexApiGame);
    }
    if (typeof data.id === 'string') {
      return data as NexGame;
    }
    return mapGameToNex(data as Game);
  } catch (error: any) {
    if (String(error?.message ?? '').toLowerCase().includes('game not found')) {
      throw new Error('Nex game not found');
    }
    throw error;
  }
}

/** Increment the visit counter for a Nex game (fire-and-forget). */
export async function recordNexGameVisit(gameId: string): Promise<void> {
  const parsedId = parseGameId(gameId);
  await client.post(`/api/nex-games/${parsedId}/visit`);
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
  let gameName = game?.name ?? 'Unknown Game';
  if (!game && /^\d+$/.test(payload.game_id)) {
    try {
      const backendGame = await fetchNexGame(payload.game_id);
      gameName = backendGame.name;
    } catch {
      // Keep fallback name when backend detail is unavailable.
    }
  }
  const sessionId = `NSS-${Date.now()}`;
  const session: NexSession = {
    id: sessionId,
    session_code: `NEX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    game_id: payload.game_id,
    game_name: gameName,
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
