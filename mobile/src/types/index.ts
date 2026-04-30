/**
 * src/types/index.ts
 * ------------------
 * Shared TypeScript interfaces matching the FastAPI Pydantic schemas.
 * Keep these in sync with backend/schemas.py.
 */

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
}

export interface SessionCreatePayload {
  game_id: number;
  duration_minutes: number;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/** Available session durations in minutes. */
export const SESSION_DURATIONS = [10, 30, 45, 60] as const;
export type SessionDuration = (typeof SESSION_DURATIONS)[number];
