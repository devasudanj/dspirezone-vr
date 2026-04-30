/**
 * src/store/sessionStore.ts
 * -------------------------
 * Zustand store that tracks the in-progress session booking flow.
 * State is reset after each completed or cancelled session.
 */
import { create } from 'zustand';
import type { Game, Session, SessionDuration } from '../types';

interface SessionFlow {
  /** Step 1 – game selected from library */
  selectedGame: Game | null;
  /** Step 2 – duration chosen by player */
  selectedDuration: SessionDuration | null;
  /** Step 3 – confirmed server-side session */
  confirmedSession: Session | null;

  // Actions
  setSelectedGame: (game: Game) => void;
  setSelectedDuration: (duration: SessionDuration) => void;
  setConfirmedSession: (session: Session) => void;
  /** Reset to initial state – call after slip is printed or session is cancelled. */
  resetFlow: () => void;
}

const initialState = {
  selectedGame: null,
  selectedDuration: null,
  confirmedSession: null,
};

export const useSessionStore = create<SessionFlow>((set) => ({
  ...initialState,

  setSelectedGame: (game) =>
    set({ selectedGame: game, selectedDuration: null }),

  setSelectedDuration: (duration) => set({ selectedDuration: duration }),

  setConfirmedSession: (session) => set({ confirmedSession: session }),

  resetFlow: () => set(initialState),
}));
