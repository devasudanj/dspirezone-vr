/**
 * src/api/feedback.ts
 * -------------------
 * API calls for the Feedback (game suggestion) endpoint.
 */
import client from './client';

export interface FeedbackRead {
  id: number;
  game_title: string;
  submitted_at: string; // ISO 8601
}

export async function submitFeedback(gameTitle: string): Promise<FeedbackRead> {
  const { data } = await client.post<FeedbackRead>('/feedback/', { game_title: gameTitle });
  return data;
}
