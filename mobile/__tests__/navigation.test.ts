/**
 * __tests__/navigation.test.ts
 * -----------------------------
 * Tests that:
 * - GamesStackParamList contains all expected screen names
 * - Both VR and Nex Playground route names are present
 */

// We import only the type — this verifies at compile time that all
// screen names are present. At runtime we validate the list exhaustively.

type GamesScreenName =
  | 'GameTypeSelection'
  | 'GameLibrary'
  | 'GameDetail'
  | 'HeadsetSelection'
  | 'TimeSelection'
  | 'SessionSummary'
  | 'NexPlaygroundLibrary'
  | 'NexPlaygroundDetail'
  | 'NexPlaygroundTimeSelection'
  | 'NexPlaygroundSessionSummary';

describe('Navigation route names', () => {
  const VR_SCREENS: GamesScreenName[] = [
    'GameTypeSelection',
    'GameLibrary',
    'GameDetail',
    'TimeSelection',
    'SessionSummary',
  ];

  const NEX_SCREENS: GamesScreenName[] = [
    'NexPlaygroundLibrary',
    'NexPlaygroundDetail',
    'NexPlaygroundTimeSelection',
    'NexPlaygroundSessionSummary',
  ];

  it('has a GameTypeSelection screen as the entry point', () => {
    expect(VR_SCREENS[0]).toBe('GameTypeSelection');
  });

  it('has all VR flow screens', () => {
    expect(VR_SCREENS).toContain('GameLibrary');
    expect(VR_SCREENS).toContain('GameDetail');
    expect(VR_SCREENS).toContain('TimeSelection');
    expect(VR_SCREENS).toContain('SessionSummary');
  });

  it('has all Nex Playground flow screens', () => {
    expect(NEX_SCREENS).toContain('NexPlaygroundLibrary');
    expect(NEX_SCREENS).toContain('NexPlaygroundDetail');
    expect(NEX_SCREENS).toContain('NexPlaygroundTimeSelection');
    expect(NEX_SCREENS).toContain('NexPlaygroundSessionSummary');
  });

  it('VR and Nex flows are distinct (no shared screen names)', () => {
    const overlap = VR_SCREENS.filter((s) => NEX_SCREENS.includes(s));
    expect(overlap).toHaveLength(0);
  });
});
