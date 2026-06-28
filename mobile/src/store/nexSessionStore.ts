/**
 * src/store/nexSessionStore.ts
 * ----------------------------
 * Zustand store that tracks the in-progress Nex Playground session booking flow.
 * Mirrors sessionStore.ts pattern. State resets after each completed session.
 */
import { create } from 'zustand';
import type { NexGame, NexSession, SessionDuration } from '../types';

interface NexSessionFlow {
  /** Step 1 – Nex game selected from library */
  selectedGame: NexGame | null;
  /** Step 2 – number of players chosen */
  selectedPlayers: number;
  /** Step 3 – duration chosen by player */
  selectedDuration: SessionDuration | null;
  /** Step 4 – confirmed server-side session */
  confirmedSession: NexSession | null;

  // Actions
  setSelectedGame: (game: NexGame) => void;
  setSelectedPlayers: (count: number) => void;
  setSelectedDuration: (duration: SessionDuration) => void;
  setConfirmedSession: (session: NexSession) => void;
  /** Reset to initial state – call after session is complete or cancelled. */
  resetFlow: () => void;
}

const initialState = {
  selectedGame: null,
  selectedPlayers: 1,
  selectedDuration: null,
  confirmedSession: null,
};

export const useNexSessionStore = create<NexSessionFlow>((set) => ({
  ...initialState,

  setSelectedGame: (game) =>
    set({ selectedGame: game, selectedPlayers: 1, selectedDuration: null }),

  setSelectedPlayers: (count) => set({ selectedPlayers: count }),

  setSelectedDuration: (duration) => set({ selectedDuration: duration }),

  setConfirmedSession: (session) => set({ confirmedSession: session }),

  resetFlow: () => set(initialState),
}));
