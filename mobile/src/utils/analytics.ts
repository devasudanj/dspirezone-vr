/**
 * src/utils/analytics.ts
 * ----------------------
 * Lightweight analytics utility. Logs structured events to the console in
 * development and is designed to be easily wired to a real analytics provider
 * (Amplitude, Mixpanel, Firebase Analytics, etc.) in production.
 *
 * TODO(analytics): Replace console.log calls with your analytics SDK calls.
 * Example for Firebase:
 *   import analytics from '@react-native-firebase/analytics';
 *   await analytics().logEvent(name, params);
 */
import type { GamePlatform } from '../types';

type EventName =
  | 'game_type_selected'
  | 'nex_library_viewed'
  | 'nex_detail_viewed'
  | 'nex_booking_initiated'
  | 'nex_session_confirmed'
  | 'vr_library_viewed'
  | 'vr_detail_viewed'
  | 'vr_booking_initiated'
  | 'vr_session_confirmed';

type EventParams = Record<string, string | number | boolean | null | undefined>;

/** Track an analytics event with optional parameters. */
export function trackEvent(name: EventName, params?: EventParams): void {
  if (__DEV__) {
    console.log(`[Analytics] ${name}`, params ?? {});
  }
  // TODO(analytics): Forward to real analytics provider here
}

/** Convenience: track game type selection at the top-level screen. */
export function trackGameTypeSelected(type: GamePlatform): void {
  trackEvent('game_type_selected', { type });
}

/** Convenience: track Nex Playground library viewed. */
export function trackNexLibraryViewed(): void {
  trackEvent('nex_library_viewed');
}

/** Convenience: track Nex game detail viewed. */
export function trackNexDetailViewed(gameId: string, gameName: string): void {
  trackEvent('nex_detail_viewed', { game_id: gameId, game_name: gameName });
}

/** Convenience: track Nex booking / session start initiated. */
export function trackNexBookingInitiated(
  gameId: string,
  durationMinutes: number,
  players: number,
): void {
  trackEvent('nex_booking_initiated', {
    game_id: gameId,
    duration_minutes: durationMinutes,
    players,
  });
}

/** Convenience: track Nex session confirmed. */
export function trackNexSessionConfirmed(
  sessionCode: string,
  gameId: string,
): void {
  trackEvent('nex_session_confirmed', {
    session_code: sessionCode,
    game_id: gameId,
  });
}
