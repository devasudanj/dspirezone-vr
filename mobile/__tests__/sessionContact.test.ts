import { buildSessionContactPayload } from '../src/utils/sessionContact';
import { buildSessionSlipHtml } from '../src/utils/sessionSlip';
import { DEFAULT_DISCOUNT_CODE, getDiscountForCode } from '../src/utils/pricing';

describe('buildSessionContactPayload', () => {
  it('creates the required payload fields from a player and selected game', () => {
    const payload = buildSessionContactPayload({
      name: 'John Doe',
      phone: '9876543210',
      selectedGameName: 'NEX Fruit Frenzy',
      selectedGameId: 1,
      stationName: 'TV1',
    });

    expect(payload).toMatchObject({
      name: 'John Doe',
      phone_number: '9876543210',
      selected_game: 'NEX Fruit Frenzy',
      selected_game_id: 1,
      station_name: 'TV1',
      source: 'vr-app',
    });
    expect(payload.vr_session_id).toMatch(/^VR-/);
    expect(payload.session_started_at).toContain('T');
  });

  it('normalizes the phone number to digits only', () => {
    const payload = buildSessionContactPayload({
      name: 'Jane Doe',
      phone: '+91 98765 43210',
      selectedGameName: 'NEX Fruit Frenzy',
      selectedGameId: 2,
    });

    expect(payload.phone_number).toBe('919876543210');
  });
});

describe('buildSessionSlipHtml', () => {
  it('includes the player contact details on the printed slip', () => {
    const html = buildSessionSlipHtml(
      {
        id: 42,
        session_code: 'VR-1001',
        game_id: 7,
        duration_minutes: 30,
        created_at: new Date('2026-08-11T10:00:00Z').toISOString(),
        game_name: 'NEX Fruit Frenzy',
        headset_codes: ['TV1'],
        pricing_category: 'Standard',
        price_15_minutes: 200,
        total_price: 400,
        discount_percent: 10,
      },
      { name: 'John Doe', phone: '+91 98765 43210' },
    );

    expect(html).toContain('John Doe');
    expect(html).toContain('9876543210');
    expect(html).toContain('Phone');
    expect(html).toContain('GST');
    expect(html).toContain('18%');
  });
});

describe('discount validation', () => {
  it('accepts the default promotional code when it is active and current', () => {
    const activeCodes = [
      {
        code: 'DZVR-INTRO',
        description: 'Intro Offer',
        discount_pct: 15,
        valid_from: '2026-01-01',
        valid_until: '2026-12-31',
      },
    ];

    const result = getDiscountForCode(activeCodes, 'DZVR-INTRO', new Date('2026-08-11T12:00:00Z'));

    expect(result).not.toBeNull();
    expect(result?.discount_pct).toBe(15);
    expect(DEFAULT_DISCOUNT_CODE).toBe('DZVR-INTRO');
  });

  it('rejects expired discount codes', () => {
    const activeCodes = [
      {
        code: 'DZVR-INTRO',
        description: 'Intro Offer',
        discount_pct: 15,
        valid_from: '2026-01-01',
        valid_until: '2026-08-10',
      },
    ];

    expect(getDiscountForCode(activeCodes, 'DZVR-INTRO', new Date('2026-08-11T12:00:00Z'))).toBeNull();
  });
});
