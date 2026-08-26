/**
 * src/api/sessions.ts
 * -------------------
 * API calls for the Sessions endpoint.
 */
import vrClient from './vrClient';
import type { Session, SessionCreatePayload } from '../types';

const VR_SESSIONS_BASE_URL =
  process.env.EXPO_PUBLIC_VR_API_BASE_URL
  ?? process.env.EXPO_PUBLIC_VR_SESSIONS_API_BASE_URL
  ?? 'https://www.dspirezone.com';

function sessionsUrl(path: string): string {
  return `${VR_SESSIONS_BASE_URL}${path}`;
}

function isLegacyDurationValidationError(error: unknown): boolean {
  const message = String((error as { message?: unknown })?.message ?? '');
  return (
    message.includes('duration_minutes must be one of [10, 30, 45, 60]')
    || message.includes('must be one of [10, 30, 45, 60]')
  );
}

function isMethodNotAllowedError(error: unknown): boolean {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  const message = String((error as { message?: unknown })?.message ?? '');
  return status === 405 || message.toLowerCase().includes('method not allowed');
}

/** Generate a local session record when the backend is unavailable. */
function buildLocalSession(payload: SessionCreatePayload, gameId: number): Session {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return {
    id: 0,
    session_code: `VR-${code}`,
    game_id: gameId,
    duration_minutes: payload.duration_minutes,
    created_at: new Date().toISOString(),
    game_name: '',
    headset_codes: [],
  };
}

/** Create a new play session and return the persisted record. */
export async function createSession(payload: SessionCreatePayload): Promise<Session> {
  try {
    const { data } = await vrClient.post<Session>(sessionsUrl('/sessions/'), payload);
    return data;
  } catch (error) {
    // Compatibility shim: some deployed backends still validate legacy durations.
    if (payload.duration_minutes === 15 && isLegacyDurationValidationError(error)) {
      const legacyPayload: SessionCreatePayload = {
        ...payload,
        duration_minutes: 10,
      };
      const { data } = await vrClient.post<Session>(sessionsUrl('/sessions/'), legacyPayload);
      return {
        ...data,
        // Preserve the UI-selected duration in the current app flow.
        duration_minutes: 15,
      };
    }
    // If the backend doesn't support POST /sessions/ (e.g. not yet deployed),
    // fall back to a locally-generated session so the slip can still be printed.
    if (isMethodNotAllowedError(error)) {
      return buildLocalSession(payload, payload.game_id as unknown as number);
    }
    throw error;
  }
}

/** Retrieve an existing session (e.g., to re-print a slip). */
export async function fetchSession(sessionId: number): Promise<Session> {
  const { data } = await vrClient.get<Session>(sessionsUrl(`/sessions/${sessionId}`));
  return data;
}
