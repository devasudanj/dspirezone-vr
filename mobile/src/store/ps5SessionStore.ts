import { create } from 'zustand';

export type PS5PackageType = 'ALL_GAMES' | 'GTA_V1';

export interface PS5PackageSelection {
  packageType: PS5PackageType;
  packageLabel: string;
  gameName: string;
  players: 1 | 2 | 3 | 4;
  hours: 1 | 2 | 3 | 5;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
}

export interface PS5PlayerContact {
  name: string;
  phone: string;
}

export interface PS5ConfirmedSession {
  sessionCode: string;
  createdAt: string;
  selection: PS5PackageSelection;
  playerContact: PS5PlayerContact;
}

interface PS5SessionFlow {
  selectedPackage: PS5PackageSelection | null;
  playerContact: PS5PlayerContact | null;
  confirmedSession: PS5ConfirmedSession | null;

  setSelectedPackage: (selection: PS5PackageSelection) => void;
  setPlayerContact: (contact: PS5PlayerContact) => void;
  setConfirmedSession: (session: PS5ConfirmedSession) => void;
  resetFlow: () => void;
}

const initialState = {
  selectedPackage: null,
  playerContact: null,
  confirmedSession: null,
};

export const usePS5SessionStore = create<PS5SessionFlow>((set) => ({
  ...initialState,

  setSelectedPackage: (selection) =>
    set({ selectedPackage: selection }),

  setPlayerContact: (contact) =>
    set({ playerContact: contact }),

  setConfirmedSession: (session) =>
    set({ confirmedSession: session }),

  resetFlow: () => set(initialState),
}));
