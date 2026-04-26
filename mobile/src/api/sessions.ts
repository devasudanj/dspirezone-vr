/**
 * src/api/sessions.ts
 * -------------------
 * API calls for the Sessions endpoint.
 */
import client from './client';
import type { Session, SessionCreatePayload } from '../types';

/** Create a new play session and return the persisted record. */
export async function createSession(payload: SessionCreatePayload): Promise<Session> {
  const { data } = await client.post<Session>('/sessions/', payload);
  return data;
}

/** Retrieve an existing session (e.g., to re-print a slip). */
export async function fetchSession(sessionId: number): Promise<Session> {
  const { data } = await client.get<Session>(`/sessions/${sessionId}`);
  return data;
}
