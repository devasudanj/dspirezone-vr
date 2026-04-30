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

interface Props {
  minutes: SessionDuration;
  selected: boolean;
  onPress: () => void;
}

const DURATION_META: Record<SessionDuration, { label: string; sublabel: string; price: string; color: string }> = {
  10: { label: '10', sublabel: 'minutes', price: '₹100', color: Colors.duration10 },
  30: { label: '30', sublabel: 'minutes', price: '₹250', color: Colors.duration30 },
  45: { label: '45', sublabel: 'minutes', price: '₹350', color: Colors.duration45 },
  60: { label: '1 hr', sublabel: 'max',     price: '₹400', color: Colors.duration60 },
};

export default function DurationButton({ minutes, selected, onPress }: Props) {
  const meta = DURATION_META[minutes];

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
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {meta.label}
        </Text>
        <Text style={[styles.sublabel, selected && styles.sublabelSelected]}>
          {meta.sublabel}
        </Text>
        <Text style={[styles.price, selected && styles.priceSelected]}>
          {meta.price}
        </Text>
        {selected && <View style={styles.selectedDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 140,
    height: 140,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
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
  price: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginTop: 2,
  },
  priceSelected: {
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
