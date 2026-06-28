/**
 * __tests__/analytics.test.ts
 * ----------------------------
 * Unit tests for the analytics utility.
 */
import { trackGameTypeSelected, trackNexLibraryViewed, trackNexDetailViewed, trackNexBookingInitiated, trackNexSessionConfirmed } from '../src/utils/analytics';

// Suppress console.log output during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('analytics', () => {
  it('trackGameTypeSelected logs without throwing for VR', () => {
    expect(() => trackGameTypeSelected('VR')).not.toThrow();
  });

  it('trackGameTypeSelected logs without throwing for NEX_PLAYGROUND', () => {
    expect(() => trackGameTypeSelected('NEX_PLAYGROUND')).not.toThrow();
  });

  it('trackNexLibraryViewed runs without throwing', () => {
    expect(() => trackNexLibraryViewed()).not.toThrow();
  });

  it('trackNexDetailViewed runs without throwing', () => {
    expect(() => trackNexDetailViewed('nex-001', 'Beat Blaster')).not.toThrow();
  });

  it('trackNexBookingInitiated runs without throwing', () => {
    expect(() => trackNexBookingInitiated('nex-001', 30, 2)).not.toThrow();
  });

  it('trackNexSessionConfirmed runs without throwing', () => {
    expect(() => trackNexSessionConfirmed('NEX-ABCDEF', 'nex-001')).not.toThrow();
  });
});
