/**
 * src/navigation/types.ts
 * -----------------------
 * Typed navigation parameter list for react-navigation.
 * Every screen's route params are declared here.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';

/** Nested stack inside the Games tab. */
export type GamesStackParamList = {
  GameLibrary: undefined;
  GameDetail: { gameId: number };
  TimeSelection: { gameId: number };
  SessionSummary: { sessionId: number };
};

/** Root bottom-tab navigator. */
export type RootTabParamList = {
  GamesStack: NavigatorScreenParams<GamesStackParamList>;
  Feedback: undefined;
};

// Keep backward compat alias
export type RootStackParamList = GamesStackParamList;

// Convenience prop types for each screen
export type GameLibraryProps = NativeStackScreenProps<GamesStackParamList, 'GameLibrary'>;
export type GameDetailProps = NativeStackScreenProps<GamesStackParamList, 'GameDetail'>;
export type TimeSelectionProps = NativeStackScreenProps<GamesStackParamList, 'TimeSelection'>;
export type SessionSummaryProps = NativeStackScreenProps<GamesStackParamList, 'SessionSummary'>;
export type FeedbackTabProps = BottomTabScreenProps<RootTabParamList, 'Feedback'>;
