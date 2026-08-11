/**
 * src/api/games.ts
 * ----------------
 * API calls for the Games endpoints.
 */
import vrClient from './vrClient';
import type { Game, GameListItem, GameCategory, Installation } from '../types';

type GameApiShape = Record<string, unknown>;
type InstallationsApiShape = Record<string, unknown>;

const VR_INSTALLATIONS_BASE_URL =
  process.env.EXPO_PUBLIC_VR_INSTALLATIONS_API_BASE_URL
  ?? 'https://dspirezone-vr-app.azurewebsites.net';

async function getWithFallback<T>(primaryPath: string, fallbackPath: string, config?: unknown): Promise<T> {
  try {
    const { data } = await vrClient.get<T>(primaryPath, config as any);
    return data;
  } catch (primaryError: any) {
    const primaryMessage = String(primaryError?.message ?? '');
    const shouldFallback =
      primaryMessage.includes('Not Found')
      || primaryMessage.includes('404')
      || primaryMessage.includes('Cannot GET');

    if (!shouldFallback) throw primaryError;

    const { data } = await vrClient.get<T>(fallbackPath, config as any);
    return data;
  }
}

async function postWithFallback<T>(primaryPath: string, fallbackPath: string): Promise<T> {
  try {
    const { data } = await vrClient.post<T>(primaryPath);
    return data;
  } catch (primaryError: any) {
    const primaryMessage = String(primaryError?.message ?? '');
    const shouldFallback =
      primaryMessage.includes('Not Found')
      || primaryMessage.includes('404')
      || primaryMessage.includes('Cannot GET');

    if (!shouldFallback) throw primaryError;

    const { data } = await vrClient.post<T>(fallbackPath);
    return data;
  }
}

function readOptionalString(raw: GameApiShape, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
}

function readOptionalNumber(raw: GameApiShape, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizeGameListItem(raw: GameApiShape): GameListItem {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    category: raw.category as GameCategory,
    thumbnail_url: String(raw.thumbnail_url ?? ''),
    status: raw.status as GameListItem['status'],
    pricing_category: readOptionalString(raw, 'pricing_category', 'pricingCategory', 'price_category', 'priceCategory'),
    price_15_minutes: readOptionalNumber(
      raw,
      'price_15_minutes',
      'price15Minutes',
      'fifteen_minute_price',
      'fifteenMinutePrice',
      'category_price',
      'categoryPrice',
      'price',
    ),
  };
}

function normalizeGame(raw: GameApiShape): Game {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    category: raw.category as GameCategory,
    thumbnail_url: String(raw.thumbnail_url ?? ''),
    video_url: (raw.video_url as string | null) ?? null,
    youtube_url: (raw.youtube_url as string | null) ?? null,
    viewable_age: (raw.viewable_age as number | null) ?? null,
    is_multiplayer: Boolean(raw.is_multiplayer),
    visit_count: Number(raw.visit_count ?? 0),
    status: raw.status as Game['status'],
    created_at: String(raw.created_at ?? ''),
    pricing_category: readOptionalString(raw, 'pricing_category', 'pricingCategory', 'price_category', 'priceCategory'),
    price_15_minutes: readOptionalNumber(
      raw,
      'price_15_minutes',
      'price15Minutes',
      'fifteen_minute_price',
      'fifteenMinutePrice',
      'category_price',
      'categoryPrice',
      'price',
    ),
  };
}

function extractGameListPayload(payload: unknown): GameApiShape[] {
  if (Array.isArray(payload)) return payload as GameApiShape[];
  if (!payload || typeof payload !== 'object') return [];

  const candidate = payload as Record<string, unknown>;
  const wrapped = candidate.items ?? candidate.data ?? candidate.results ?? candidate.games;
  return Array.isArray(wrapped) ? (wrapped as GameApiShape[]) : [];
}

function normalizeInstallation(raw: InstallationsApiShape): Installation {
  return {
    id: Number(raw.id),
    game_id: Number(raw.game_id ?? raw.gameId ?? 0),
    headset_id: Number(raw.headset_id ?? raw.headsetId ?? 0),
    headset_code: String(raw.headset_code ?? raw.headsetCode ?? ''),
    headset_model: String(raw.headset_model ?? raw.headsetModel ?? ''),
    install_date: String(raw.install_date ?? raw.installDate ?? ''),
    expiry_date: String(raw.expiry_date ?? raw.expiryDate ?? ''),
    installation_status: String(
      raw.installation_status
      ?? raw.installationStatus
      ?? 'EXPIRED',
    ).toUpperCase() as Installation['installation_status'],
  };
}

function extractInstallationsPayload(payload: unknown): Installation[] {
  const parseList = (items: unknown[]): Installation[] => items
    .filter((item): item is InstallationsApiShape => Boolean(item) && typeof item === 'object')
    .map(normalizeInstallation);

  if (Array.isArray(payload)) return parseList(payload);
  if (!payload || typeof payload !== 'object') return [];

  const candidate = payload as Record<string, unknown>;
  const wrapped = candidate.items
    ?? candidate.data
    ?? candidate.results
    ?? candidate.installations;

  return Array.isArray(wrapped) ? parseList(wrapped) : [];
}

/** Return the game library (ACTIVE games by default). */
export async function fetchGames(category?: GameCategory): Promise<GameListItem[]> {
  const params: Record<string, string> = { status: 'ACTIVE' };
  if (category) params.category = category;
  const data = await getWithFallback<unknown>(
    '/api/vr-games/',
    '/games/',
    { params },
  );
  return extractGameListPayload(data).map(normalizeGameListItem);
}

/** Return full details for a single game. */
export async function fetchGame(gameId: number): Promise<Game> {
  const data = await getWithFallback<GameApiShape>(
    `/api/vr-games/${gameId}`,
    `/games/${gameId}`,
  );
  return normalizeGame(data);
}

/** Increment the visit counter for a game (fire-and-forget). */
export async function recordGameVisit(gameId: number): Promise<void> {
  await postWithFallback(
    `/api/vr-games/${gameId}/visit`,
    `/games/${gameId}/visit`,
  );
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
  const endpoint = `${VR_INSTALLATIONS_BASE_URL}/games/${gameId}/installations`;
  const { data } = await vrClient.get<unknown>(endpoint, {
    params: { active_only: activeOnly },
  });
  return extractInstallationsPayload(data);
}
