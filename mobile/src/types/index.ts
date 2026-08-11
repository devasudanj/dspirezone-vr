/**
 * src/types/index.ts
 * ------------------
 * Shared TypeScript interfaces matching the FastAPI Pydantic schemas.
 * Keep these in sync with backend/schemas.py.
 */

/** Distinguishes which gaming platform a flow belongs to. */
export type GamePlatform = 'VR' | 'NEX_PLAYGROUND';

export type GameStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED';

export type GameCategory =
  | 'Action'
  | 'Adventure'
  | 'Kids'
  | 'Horror'
  | 'Educational'
  | 'Sports'
  | 'Simulation'
  | 'Puzzle'
  | 'Other';

export type InstallationStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export interface GameListItem {
  id: number;
  name: string;
  category: GameCategory;
  thumbnail_url: string;
  status: GameStatus;
  pricing_category?: string | null;
  price_15_minutes?: number | null;
}

export interface Game {
  id: number;
  name: string;
  description: string;
  category: GameCategory;
  thumbnail_url: string;
  video_url: string | null;
  youtube_url: string | null;
  viewable_age: number | null;
  is_multiplayer: boolean;
  visit_count: number;
  status: GameStatus;
  created_at: string; // ISO 8601
  pricing_category?: string | null;
  price_15_minutes?: number | null;
}

// ---------------------------------------------------------------------------
// Headsets
// ---------------------------------------------------------------------------

export interface Headset {
  id: number;
  code: string;
  model: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Installations
// ---------------------------------------------------------------------------

export interface Installation {
  id: number;
  game_id: number;
  headset_id: number;
  headset_code: string;
  headset_model: string;
  install_date: string; // YYYY-MM-DD
  expiry_date: string;  // YYYY-MM-DD
  installation_status: InstallationStatus;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface Session {
  id: number;
  session_code: string;
  game_id: number;
  duration_minutes: number;
  created_at: string; // ISO 8601
  game_name: string;
  /** All active headsets on which this game is installed. */
  headset_codes: string[];
  pricing_category?: string | null;
  price_15_minutes?: number | null;
  total_price?: number | null;
  discount_percent?: number | null;
  discount_code?: string | null;
}

export interface SessionCreatePayload {
  game_id: number;
  duration_minutes: number;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/** Available session durations in minutes. */
export const SESSION_DURATIONS = [15, 30] as const;
export type SessionDuration = (typeof SESSION_DURATIONS)[number];

// ---------------------------------------------------------------------------
// Nex Playground
// ---------------------------------------------------------------------------
// TODO(backend): Replace mock types with real Pydantic-aligned interfaces once
// the /nex-games/ endpoint is available in backend/routers/nex_games.py.

export type NexGameCategory =
  | GameCategory
  | 'Dance'
  | 'Multiplayer';

/** Lightweight item returned by the Nex games list endpoint. */
export interface NexGameListItem {
  id: string;          // client-side UUID until backend assigns numeric IDs
  name: string;
  category: NexGameCategory;
  thumbnail_url: string;
  status: GameStatus;
}

/** Full Nex Playground game detail. */
export interface NexGame {
  id: string;
  name: string;
  description: string;
  category: NexGameCategory;
  thumbnail_url: string;
  trailer_url: string | null;
  min_players: number;
  max_players: number;
  min_age: number | null;
  status: GameStatus;
}

/** A physical Nex Playground station in the venue. */
export interface NexStation {
  id: string;
  code: string;       // e.g. "NEX-01"
  is_active: boolean;
}

/** A confirmed Nex Playground session returned after booking. */
export interface NexSession {
  id: string;
  session_code: string;
  game_id: string;
  game_name: string;
  duration_minutes: number;
  players: number;
  station_codes: string[];
  created_at: string;
  total_price?: number | null;
  discount_percent?: number | null;
  discount_code?: string | null;
}

export interface NexSessionCreatePayload {
  game_id: string;
  duration_minutes: SessionDuration;
  players: number;
}
