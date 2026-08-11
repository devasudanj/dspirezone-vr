/**
 * src/components/DurationButton.tsx
 * -----------------------------------
 * Large, accessible touch target for selecting a session duration.
 * Each duration has a distinct accent colour for quick visual identification.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import type { SessionDuration } from '../types';
import {
  formatRs,
  getBasePriceForDuration,
  applyIntroDiscount,
  INTRO_OFFER_DISCOUNT_PERCENT,
} from '../utils/pricing';

interface Props {
  minutes: SessionDuration;
  selected: boolean;
  onPress: () => void;
  price15Minutes?: number;
}

const DURATION_META: Record<SessionDuration, { label: string; sublabel: string; multiplier: number; color: string }> = {
  15: { label: '15', sublabel: 'minutes', multiplier: 1, color: Colors.duration10 },
  30: { label: '30', sublabel: 'minutes', multiplier: 2, color: Colors.duration30 },
};

export default function DurationButton({ minutes, selected, onPress, price15Minutes = 250 }: Props) {
  const meta = DURATION_META[minutes];
  const basePrice = getBasePriceForDuration(price15Minutes, minutes);
  const discountedPrice = applyIntroDiscount(basePrice);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${minutes} minutes`}
    >
      <View
        style={[
          styles.button,
          { borderColor: meta.color },
          selected && { backgroundColor: meta.color },
        ]}
      >
        <View style={styles.contentWrap}>
          <Text style={[styles.label, selected && styles.labelSelected]}>
            {meta.label}
          </Text>
          <Text style={[styles.sublabel, selected && styles.sublabelSelected]}>
            {meta.sublabel}
          </Text>
          <Text style={[styles.originalPrice, selected && styles.originalPriceSelected]}>
            {formatRs(basePrice)} per person
          </Text>
          <Text style={[styles.price, selected && styles.priceSelected]}>
            {formatRs(discountedPrice)} per person
          </Text>
          <Text style={[styles.offerTag, selected && styles.offerTagSelected]}>
            Intro Offer {INTRO_OFFER_DISCOUNT_PERCENT}% OFF
          </Text>
        </View>
        {selected && <View style={styles.selectedDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 140,
    minHeight: 150,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    position: 'relative',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 3,
    paddingTop: 6,
    paddingBottom: 4,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography['3xl'],
    fontWeight: Typography.extrabold,
  },
  labelSelected: {
    color: Colors.background,
  },
  sublabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sublabelSelected: {
    color: Colors.background,
    opacity: 0.8,
  },
  originalPrice: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textDecorationLine: 'line-through',
    marginTop: 2,
    textAlign: 'center',
  },
  originalPriceSelected: {
    color: Colors.background,
    opacity: 0.75,
  },
  price: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginTop: 1,
    textAlign: 'center',
  },
  priceSelected: {
    color: Colors.background,
  },
  offerTag: {
    color: Colors.warning,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  offerTagSelected: {
    color: Colors.background,
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.background,
  },
});
