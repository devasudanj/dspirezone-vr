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
    throw error;
  }
}

/** Retrieve an existing session (e.g., to re-print a slip). */
export async function fetchSession(sessionId: number): Promise<Session> {
  const { data } = await vrClient.get<Session>(sessionsUrl(`/sessions/${sessionId}`));
  return data;
}
