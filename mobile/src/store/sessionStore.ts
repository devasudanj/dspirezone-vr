/**
 * src/store/sessionStore.ts
 * -------------------------
 * Zustand store that tracks the in-progress session booking flow.
 * State is reset after each completed or cancelled session.
 */
import { create } from 'zustand';
import type { Game, Session, SessionDuration } from '../types';
import { DEFAULT_DISCOUNT_CODE } from '../utils/pricing';

interface PlayerContact {
  name: string;
  phone: string;
}

interface SessionFlow {
  /** Step 1 – game selected from library */
  selectedGame: Game | null;
  /** Step 1b – installation/headset chosen (HeadsetSelectionScreen) */
  selectedInstallation: null;
  /** Step 2 – duration chosen by player */
  selectedDuration: SessionDuration | null;
  /** Step 2b – contact info captured before booking */
  playerContact: PlayerContact | null;
  discountCode: string;
  discountPercent: number;
  /** Step 3 – confirmed server-side session */
  confirmedSession: Session | null;

  // Actions
  setSelectedGame: (game: Game) => void;
  setSelectedInstallation: (installation: unknown) => void;
  setSelectedDuration: (duration: SessionDuration) => void;
  setPlayerContact: (contact: PlayerContact) => void;
  setDiscountCode: (code: string, percent: number) => void;
  setConfirmedSession: (session: Session) => void;
  /** Reset to initial state – call after slip is printed or session is cancelled. */
  resetFlow: () => void;
}

const initialState = {
  selectedGame: null,
  selectedInstallation: null,
  selectedDuration: null,
  playerContact: null,
  discountCode: DEFAULT_DISCOUNT_CODE,
  discountPercent: 15,
  confirmedSession: null,
};

export const useSessionStore = create<SessionFlow>((set) => ({
  ...initialState,

  setSelectedGame: (game) =>
    set({ selectedGame: game, selectedDuration: null }),

  setSelectedInstallation: (_installation) => {
    // No-op placeholder – HeadsetSelectionScreen passes the chosen installation
    // here before navigating onward. Extend as needed.
  },

  setSelectedDuration: (duration) => set({ selectedDuration: duration }),

  setPlayerContact: (contact) => set({ playerContact: contact }),

  setDiscountCode: (code, percent) => set({ discountCode: code, discountPercent: percent }),

  setConfirmedSession: (session) => set({ confirmedSession: session }),

  resetFlow: () => set(initialState),
}));
