/**
 * __tests__/nexSessionStore.test.ts
 * ----------------------------------
 * Unit tests for the Nex Playground session Zustand store.
 */
import { useNexSessionStore } from '../src/store/nexSessionStore';
import type { NexGame, NexSession } from '../src/types';

const MOCK_GAME: NexGame = {
  id: 'nex-001',
  name: 'Beat Blaster',
  description: 'A rhythm action game.',
  category: 'Action',
  thumbnail_url: 'https://example.com/img.jpg',
  trailer_url: null,
  min_players: 1,
  max_players: 2,
  min_age: 7,
  status: 'ACTIVE',
};

const MOCK_SESSION: NexSession = {
  id: 'NSS-1',
  session_code: 'NEX-ABCDEF',
  game_id: 'nex-001',
  game_name: 'Beat Blaster',
  duration_minutes: 30,
  players: 1,
  station_codes: ['NEX-01'],
  created_at: new Date().toISOString(),
};

describe('useNexSessionStore', () => {
  beforeEach(() => {
    useNexSessionStore.getState().resetFlow();
  });

  it('starts with empty state', () => {
    const state = useNexSessionStore.getState();
    expect(state.selectedGame).toBeNull();
    expect(state.selectedDuration).toBeNull();
    expect(state.confirmedSession).toBeNull();
    expect(state.selectedPlayers).toBe(1);
  });

  it('setSelectedGame sets game and resets duration', () => {
    useNexSessionStore.getState().setSelectedDuration(30);
    useNexSessionStore.getState().setSelectedGame(MOCK_GAME);
    const state = useNexSessionStore.getState();
    expect(state.selectedGame?.id).toBe('nex-001');
    expect(state.selectedDuration).toBeNull(); // reset
    expect(state.selectedPlayers).toBe(1);    // reset
  });

  it('setSelectedDuration updates duration', () => {
    useNexSessionStore.getState().setSelectedDuration(45);
    expect(useNexSessionStore.getState().selectedDuration).toBe(45);
  });

  it('setSelectedPlayers updates player count', () => {
    useNexSessionStore.getState().setSelectedPlayers(3);
    expect(useNexSessionStore.getState().selectedPlayers).toBe(3);
  });

  it('setConfirmedSession stores the session', () => {
    useNexSessionStore.getState().setConfirmedSession(MOCK_SESSION);
    expect(useNexSessionStore.getState().confirmedSession?.session_code).toBe('NEX-ABCDEF');
  });

  it('resetFlow clears all state', () => {
    useNexSessionStore.getState().setSelectedGame(MOCK_GAME);
    useNexSessionStore.getState().setSelectedDuration(30);
    useNexSessionStore.getState().setSelectedPlayers(2);
    useNexSessionStore.getState().setConfirmedSession(MOCK_SESSION);
    useNexSessionStore.getState().resetFlow();
    const state = useNexSessionStore.getState();
    expect(state.selectedGame).toBeNull();
    expect(state.selectedDuration).toBeNull();
    expect(state.selectedPlayers).toBe(1);
    expect(state.confirmedSession).toBeNull();
  });
});
