/**
 * src/navigation/types.ts
 * -----------------------
 * Typed navigation parameter list for react-navigation.
 * Every screen's route params are declared here.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';

/** Nested stack inside the Games tab.
 *  Screens with "NexPlayground" prefix belong to the Nex Playground flow.
 *  All others belong to the existing VR flow.
 */
export type GamesStackParamList = {
  // ── Top-level selection ──────────────────────────────────────────────────
  GameTypeSelection: undefined;

  // ── VR flow (unchanged) ──────────────────────────────────────────────────
  GameLibrary: undefined;
  GameDetail: { gameId: number };
  HeadsetSelection: { gameId: number };
  TimeSelection: { gameId: number };
  SessionSummary: { sessionId: number };

  // ── Nex Playground flow ──────────────────────────────────────────────────
  NexPlaygroundLibrary: undefined;
  NexPlaygroundDetail: { gameId: string };
  NexPlaygroundTimeSelection: { gameId: string };
  NexPlaygroundSessionSummary: { sessionId: string };
};

/** Root bottom-tab navigator. */
export type RootTabParamList = {
  GamesStack: NavigatorScreenParams<GamesStackParamList>;
  Feedback: undefined;
};

// Keep backward compat alias
export type RootStackParamList = GamesStackParamList;

// Convenience prop types for each screen
export type GameTypeSelectionProps = NativeStackScreenProps<GamesStackParamList, 'GameTypeSelection'>;
export type GameLibraryProps = NativeStackScreenProps<GamesStackParamList, 'GameLibrary'>;
export type GameDetailProps = NativeStackScreenProps<GamesStackParamList, 'GameDetail'>;
export type TimeSelectionProps = NativeStackScreenProps<GamesStackParamList, 'TimeSelection'>;
export type SessionSummaryProps = NativeStackScreenProps<GamesStackParamList, 'SessionSummary'>;
export type FeedbackTabProps = BottomTabScreenProps<RootTabParamList, 'Feedback'>;

export type HeadsetSelectionProps = NativeStackScreenProps<GamesStackParamList, 'HeadsetSelection'>;

// Nex Playground screen prop types
export type NexPlaygroundLibraryProps = NativeStackScreenProps<GamesStackParamList, 'NexPlaygroundLibrary'>;
export type NexPlaygroundDetailProps = NativeStackScreenProps<GamesStackParamList, 'NexPlaygroundDetail'>;
export type NexPlaygroundTimeSelectionProps = NativeStackScreenProps<GamesStackParamList, 'NexPlaygroundTimeSelection'>;
export type NexPlaygroundSessionSummaryProps = NativeStackScreenProps<GamesStackParamList, 'NexPlaygroundSessionSummary'>;
