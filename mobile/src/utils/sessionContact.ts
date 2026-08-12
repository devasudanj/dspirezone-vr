import { DEFAULT_DISCOUNT_CODE, addGst, applyDiscountToAmount } from './pricing';

export interface SessionContactPayloadInput {
  name: string;
  phone: string;
  selectedGameName: string;
  selectedGameId?: number | string | null;
  stationName?: string | null;
  source?: string;
  sessionStartedAt?: Date;
  vrSessionId?: string | null;
  originalGamePrice?: number | null;
  selectedSessionTime?: number | null;
  discountCode?: string | null;
  discountPct?: number | null;
  finalPriceInclGst?: number | null;
}

export interface SessionContactPayload {
  name: string;
  phone_number: string;
  selected_game: string;
  session_started_at: string;
  selected_game_id?: number | null;
  vr_session_id?: string;
  station_name?: string | null;
  source: string;
  original_game_price?: number | null;
  selected_session_time?: string | null;
  discount_code?: string | null;
  discount_pct?: number | null;
  final_price_incl_gst?: number | null;
}

export function buildSessionContactPayload({
  name,
  phone,
  selectedGameName,
  selectedGameId,
  stationName,
  source = 'vr-app',
  sessionStartedAt = new Date(),
  vrSessionId,
  originalGamePrice,
  selectedSessionTime,
  discountCode,
  discountPct,
  finalPriceInclGst,
}: SessionContactPayloadInput): SessionContactPayload {
  const cleanName = name.trim();
  const cleanPhone = phone.replace(/\D/g, '');
  const resolvedOriginalPrice = typeof originalGamePrice === 'number' ? originalGamePrice : 250;
  const resolvedDiscountCode = (discountCode ?? '').trim() || DEFAULT_DISCOUNT_CODE;
  const resolvedDiscountPct = typeof discountPct === 'number' ? discountPct : 15;
  const resolvedFinalPrice = typeof finalPriceInclGst === 'number'
    ? finalPriceInclGst
    : addGst(applyDiscountToAmount(resolvedOriginalPrice, resolvedDiscountPct));

  return {
    name: cleanName,
    phone_number: cleanPhone,
    selected_game: selectedGameName.trim(),
    session_started_at: sessionStartedAt.toISOString(),
    selected_game_id: selectedGameId !== undefined && selectedGameId !== null ? Number(selectedGameId) : undefined,
    vr_session_id: vrSessionId ?? `VR-${Date.now()}`,
    station_name: stationName ?? null,
    source,
    original_game_price: resolvedOriginalPrice,
    selected_session_time: typeof selectedSessionTime === 'number' ? String(selectedSessionTime) : null,
    discount_code: resolvedDiscountCode,
    discount_pct: resolvedDiscountPct,
    final_price_incl_gst: resolvedFinalPrice,
  };
}
