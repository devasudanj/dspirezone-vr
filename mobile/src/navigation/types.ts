/**
 * src/navigation/types.ts
 * -----------------------
 * Typed navigation parameter list for react-navigation.
 * Every screen's route params are declared here.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Game, Installation } from '../types';

export type RootStackParamList = {
  GameLibrary: undefined;
  GameDetail: { gameId: number };
  HeadsetSelection: { gameId: number };
  TimeSelection: { gameId: number; installation: Installation };
  SessionSummary: { sessionId: number };
};

// Convenience prop types for each screen
export type GameLibraryProps = NativeStackScreenProps<RootStackParamList, 'GameLibrary'>;
export type GameDetailProps = NativeStackScreenProps<RootStackParamList, 'GameDetail'>;
export type HeadsetSelectionProps = NativeStackScreenProps<RootStackParamList, 'HeadsetSelection'>;
export type TimeSelectionProps = NativeStackScreenProps<RootStackParamList, 'TimeSelection'>;
export type SessionSummaryProps = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;
