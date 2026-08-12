import { buildSessionContactPayload } from '../src/utils/sessionContact';
import { buildSessionSlipHtml } from '../src/utils/sessionSlip';
import {
  DEFAULT_DISCOUNT_CODE,
  getBase15MinutePrice,
  getBasePriceForDuration,
  getDiscountForCode,
  getPriceAfterSelectedDiscount,
  addGst,
} from '../src/utils/pricing';

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
      original_game_price: 250,
      selected_session_time: null,
      discount_code: 'DZVR-INTRO',
      discount_pct: 15,
      final_price_incl_gst: 251,
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

  it('uses the final 30-minute price in the contact payload', () => {
    const payload = buildSessionContactPayload({
      name: 'Jane Doe',
      phone: '9876543210',
      selectedGameName: 'NEX Fruit Frenzy',
      selectedGameId: 2,
      originalGamePrice: 500,
      selectedSessionTime: 30,
      discountCode: 'DZVR-INTRO',
      discountPct: 15,
      finalPriceInclGst: 503,
    });

    expect(payload.original_game_price).toBe(500);
    expect(payload.selected_session_time).toBe('30');
    expect(payload.discount_pct).toBe(15);
    expect(payload.final_price_incl_gst).toBe(503);
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
  it('applies only the selected promotional percentage once', () => {
    const discounted = getPriceAfterSelectedDiscount(250, 25);

    expect(discounted).toBe(188);
    expect(addGst(discounted)).toBe(222);
  });

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

  it('uses the category price for Special VR games when the backend exposes it', () => {
    const game = {
      pricing_category: 'Special VR',
      category_price: 400,
      price_15_minutes: undefined,
    } as any;

    expect(getBase15MinutePrice(game)).toBe(400);
    expect(getBasePriceForDuration(getBase15MinutePrice(game), 30)).toBe(800);
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
