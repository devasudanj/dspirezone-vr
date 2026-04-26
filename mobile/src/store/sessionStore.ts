/**
 * src/store/sessionStore.ts
 * -------------------------
 * Zustand store that tracks the in-progress session booking flow.
 * State is reset after each completed or cancelled session.
 */
import { create } from 'zustand';
import type { Game, Installation, Session, SessionDuration } from '../types';

interface SessionFlow {
  /** Step 1 – game selected from library */
  selectedGame: Game | null;
  /** Step 2 – installation (game+headset pair) chosen by player */
  selectedInstallation: Installation | null;
  /** Step 3 – duration chosen by player */
  selectedDuration: SessionDuration | null;
  /** Step 4 – confirmed server-side session */
  confirmedSession: Session | null;

  // Actions
  setSelectedGame: (game: Game) => void;
  setSelectedInstallation: (installation: Installation) => void;
  setSelectedDuration: (duration: SessionDuration) => void;
  setConfirmedSession: (session: Session) => void;
  /** Reset to initial state – call after slip is printed or session is cancelled. */
  resetFlow: () => void;
}

const initialState = {
  selectedGame: null,
  selectedInstallation: null,
  selectedDuration: null,
  confirmedSession: null,
};

export const useSessionStore = create<SessionFlow>((set) => ({
  ...initialState,

  setSelectedGame: (game) =>
    set({ selectedGame: game, selectedInstallation: null, selectedDuration: null }),

  setSelectedInstallation: (installation) =>
    set({ selectedInstallation: installation, selectedDuration: null }),

  setSelectedDuration: (duration) => set({ selectedDuration: duration }),

  setConfirmedSession: (session) => set({ confirmedSession: session }),

  resetFlow: () => set(initialState),
}));
