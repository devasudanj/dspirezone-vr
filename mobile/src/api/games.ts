/**
 * src/api/games.ts
 * ----------------
 * API calls for the Games endpoints.
 */
import client from './client';
import type { Game, GameListItem, GameCategory, Installation } from '../types';

/** Return the game library (ACTIVE games by default). */
export async function fetchGames(category?: GameCategory): Promise<GameListItem[]> {
  const params: Record<string, string> = { status: 'ACTIVE' };
  if (category) params.category = category;
  const { data } = await client.get<GameListItem[]>('/games/', { params });
  return data;
}

/** Return full details for a single game. */
export async function fetchGame(gameId: number): Promise<Game> {
  const { data } = await client.get<Game>(`/games/${gameId}`);
  return data;
}

/**
 * Return all installations for a game.
 * Pass activeOnly=true to filter out expired installations
 * (used when presenting headset selection to the player).
 */
export async function fetchGameInstallations(
  gameId: number,
  activeOnly = false,
): Promise<Installation[]> {
  const { data } = await client.get<Installation[]>(
    `/games/${gameId}/installations`,
    { params: { active_only: activeOnly } },
  );
  return data;
}
