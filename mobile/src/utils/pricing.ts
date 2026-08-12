import type { Game, Session, SessionDuration } from '../types';

export const INTRO_OFFER_DISCOUNT_PERCENT = 15;
export const GST_PERCENT = 18;
export const DEFAULT_DISCOUNT_CODE = 'DZVR-INTRO';

export interface ActiveDiscountCode {
  code: string;
  description: string;
  discount_pct: number;
  valid_from: string;
  valid_until: string;
}

const DEFAULT_PRICE_15_MINUTES = 250;

export function getBase15MinutePrice(
  game?: Pick<Game, 'pricing_category' | 'category_price' | 'price_15_minutes'> | null,
): number {
  const categoryName = game?.pricing_category?.trim();
  const categoryPrice = typeof game?.category_price === 'number' ? game.category_price : null;

  if (categoryName?.toLowerCase() === 'special vr' && categoryPrice !== null) {
    return categoryPrice;
  }

  if (typeof game?.price_15_minutes === 'number') {
    return game.price_15_minutes;
  }

  if (categoryPrice !== null) {
    return categoryPrice;
  }

  return DEFAULT_PRICE_15_MINUTES;
}

export function getBasePriceForDuration(
  price15Minutes: number,
  durationMinutes: SessionDuration,
): number {
  return durationMinutes === 30 ? price15Minutes * 2 : price15Minutes;
}

export function applyIntroDiscount(basePrice: number): number {
  return roundCurrency(basePrice * (1 - INTRO_OFFER_DISCOUNT_PERCENT / 100));
}

export function addGst(amount: number): number {
  return roundCurrency(amount * (1 + GST_PERCENT / 100));
}

export function getAmountBeforeGst(amountWithGst: number): number {
  return roundCurrency(amountWithGst / (1 + GST_PERCENT / 100));
}

export function getDiscountedPriceForDuration(
  price15Minutes: number,
  durationMinutes: SessionDuration,
): number {
  return applyIntroDiscount(getBasePriceForDuration(price15Minutes, durationMinutes));
}

export function getDiscountForCode(
  activeCodes: ActiveDiscountCode[],
  enteredCode: string,
  now: Date = new Date(),
): ActiveDiscountCode | null {
  const normalizedInput = enteredCode.trim().toUpperCase();
  if (!normalizedInput) return null;

  const activeCode = activeCodes.find((code) => code.code.trim().toUpperCase() === normalizedInput);
  if (!activeCode) return null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const validFrom = new Date(`${activeCode.valid_from}T00:00:00Z`);
  const validUntil = new Date(`${activeCode.valid_until}T23:59:59Z`);

  if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) {
    return null;
  }

  if (today < validFrom || today > validUntil) {
    return null;
  }

  return activeCode;
}

export function applyDiscountToAmount(amount: number, discountPercent: number): number {
  if (discountPercent <= 0) return roundCurrency(amount);
  return roundCurrency(amount * (1 - discountPercent / 100));
}

export function getPriceAfterSelectedDiscount(amount: number, discountPercent: number): number {
  return applyDiscountToAmount(amount, discountPercent);
}

export function getFinalPriceWithGst(
  price15Minutes: number,
  durationMinutes: SessionDuration,
): number {
  return addGst(getDiscountedPriceForDuration(price15Minutes, durationMinutes));
}

export function formatRs(price: number): string {
  return `Rs. ${Math.round(roundCurrency(price))}`;
}

export function getSessionDisplayPrice(session: Pick<Session, 'total_price' | 'price_15_minutes' | 'duration_minutes'>): number | null {
  if (typeof session.total_price === 'number') {
    return addGst(getAmountBeforeGst(session.total_price));
  }
  if (typeof session.price_15_minutes === 'number' && (session.duration_minutes === 15 || session.duration_minutes === 30)) {
    return getFinalPriceWithGst(session.price_15_minutes, session.duration_minutes as SessionDuration);
  }
  return null;
}

export function getSessionOriginalPrice(
  session: Pick<Session, 'total_price' | 'price_15_minutes' | 'duration_minutes' | 'discount_percent'>,
): number | null {
  if (typeof session.price_15_minutes === 'number' && (session.duration_minutes === 15 || session.duration_minutes === 30)) {
    return getBasePriceForDuration(session.price_15_minutes, session.duration_minutes as SessionDuration);
  }

  if (typeof session.total_price === 'number') {
    const discount = typeof session.discount_percent === 'number'
      ? session.discount_percent
      : INTRO_OFFER_DISCOUNT_PERCENT;

    if (discount > 0 && discount < 100) {
      return roundCurrency(session.total_price / (1 - discount / 100));
    }
  }

  return null;
}

function roundCurrency(value: number): number {
  return Math.round(value);
}
