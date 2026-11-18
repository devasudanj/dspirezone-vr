import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../theme/colors';
import Typography from '../theme/typography';
import type { PS5PricingProps } from '../navigation/types';
import { usePS5SessionStore, type PS5PackageSelection } from '../store/ps5SessionStore';

type HourOption = 1 | 2 | 3 | 5;
type GroupOption = 1 | 2 | 3 | 4;

interface PricePoint {
  original: number;
  discounted: number;
  save: number;
}

const SOLO_HOURS: HourOption[] = [1, 2, 3, 5];
const GROUP_HOURS: Array<1 | 2> = [1, 2];
const GROUP_OPTIONS: GroupOption[] = [1, 2, 3, 4];

const ALL_GAMES_SOLO_PRICING: Record<HourOption, PricePoint> = {
  1: { original: 219, discounted: 169, save: 50 },
  2: { original: 369, discounted: 319, save: 50 },
  3: { original: 569, discounted: 469, save: 100 },
  5: { original: 869, discounted: 719, save: 150 },
};

const ALL_GAMES_GROUP_PRICING: Record<Exclude<GroupOption, 1>, Record<1 | 2, PricePoint>> = {
  2: {
    1: { original: 319, discounted: 269, save: 50 },
    2: { original: 539, discounted: 439, save: 100 },
  },
  3: {
    1: { original: 479, discounted: 389, save: 90 },
    2: { original: 809, discounted: 639, save: 170 },
  },
  4: {
    1: { original: 639, discounted: 509, save: 130 },
    2: { original: 1079, discounted: 839, save: 240 },
  },
};

const GTA_SPECIAL_PRICING: Record<HourOption, PricePoint> = {
  1: { original: 299, discounted: 219, save: 80 },
  2: { original: 449, discounted: 349, save: 100 },
  3: { original: 599, discounted: 469, save: 120 },
  5: { original: 899, discounted: 759, save: 140 },
};

function formatRs(value: number): string {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

function PriceStrip({
  label,
  price,
  selected,
  onPress,
}: {
  label: string;
  price: PricePoint;
  selected?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.priceLabel}>{label}</Text>
      <View style={styles.priceNumbers}>
        <Text style={styles.oldPrice}>{formatRs(price.original)}</Text>
        <Text style={styles.newPrice}>{formatRs(price.discounted)}</Text>
        <View style={styles.saveBadge}>
          <Text style={styles.saveText}>SAVE {formatRs(price.save)}</Text>
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.priceStrip, selected && styles.priceStripSelected]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.priceStrip, selected && styles.priceStripSelected]}>{content}</View>
  );
}

function SelectorChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function PS5PricingScreen(_props: PS5PricingProps) {
  const { navigation } = _props;
  const setSelectedPackage = usePS5SessionStore((s) => s.setSelectedPackage);
  const resetPS5Flow = usePS5SessionStore((s) => s.resetFlow);

  const [groupPlayers, setGroupPlayers] = useState<GroupOption>(1);
  const [selectedHour, setSelectedHour] = useState<HourOption>(1);
  const [selectedPackageType, setSelectedPackageType] = useState<'ALL_GAMES' | 'GTA_V1'>('ALL_GAMES');

  const availableHours: HourOption[] = useMemo(() => {
    if (groupPlayers === 1) return SOLO_HOURS;
    return GROUP_HOURS;
  }, [groupPlayers]);

  const effectiveHour = availableHours.includes(selectedHour) ? selectedHour : availableHours[0];

  const selectedAllGamesPricing: PricePoint = useMemo(() => {
    if (groupPlayers === 1) return ALL_GAMES_SOLO_PRICING[effectiveHour];
    return ALL_GAMES_GROUP_PRICING[groupPlayers][effectiveHour as 1 | 2];
  }, [effectiveHour, groupPlayers]);

  const selectedGTAPricing = GTA_SPECIAL_PRICING[effectiveHour];

  const handleStartSession = () => {
    const selected: PS5PackageSelection = selectedPackageType === 'ALL_GAMES'
      ? {
          packageType: 'ALL_GAMES',
          packageLabel: 'All Games Package',
          gameName: 'PS5 All Games Package',
          players: groupPlayers,
          hours: effectiveHour,
          originalPrice: selectedAllGamesPricing.original,
          discountedPrice: selectedAllGamesPricing.discounted,
          savings: selectedAllGamesPricing.save,
        }
      : {
          packageType: 'GTA_V1',
          packageLabel: 'GTA V1 - Ultimate Edition',
          gameName: 'GTA V1 - Ultimate Edition',
          players: 1,
          hours: effectiveHour,
          originalPrice: selectedGTAPricing.original,
          discountedPrice: selectedGTAPricing.discounted,
          savings: selectedGTAPricing.save,
        };

    if (selected.packageType === 'GTA_V1' && groupPlayers > 1) {
      Alert.alert('GTA Package', 'GTA flyer pricing is for a single session slot. Group pricing uses the All Games package.');
      return;
    }

    resetPS5Flow();
    setSelectedPackage(selected);
    navigation.navigate('PS5SessionContact');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>PS5 Gaming Packages</Text>
        <Text style={styles.heroSubtitle}>
          Select hours and group size to view discounted package pricing.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>All Games Package</Text>
        <Text style={styles.sectionSubtitle}>Play any game on PS5 with offer pricing.</Text>

        <Text style={styles.controlLabel}>Group Size</Text>
        <View style={styles.chipRow}>
          {GROUP_OPTIONS.map((players) => (
            <SelectorChip
              key={players}
              label={`${players}P`}
              active={groupPlayers === players}
              onPress={() => {
                setGroupPlayers(players);
                if (players > 1 && selectedHour > 2) {
                  setSelectedHour(1);
                }
              }}
            />
          ))}
        </View>

        <Text style={styles.controlLabel}>Hours</Text>
        <View style={styles.chipRow}>
          {availableHours.map((hour) => (
            <SelectorChip
              key={hour}
              label={`${hour} Hour${hour > 1 ? 's' : ''}`}
              active={effectiveHour === hour}
              onPress={() => setSelectedHour(hour)}
            />
          ))}
        </View>

        {groupPlayers > 1 && (
          <Text style={styles.noteText}>
            Group package pricing is available for 1-hour and 2-hour slots.
          </Text>
        )}

        <PriceStrip
          label={`${groupPlayers} Player${groupPlayers > 1 ? 's' : ''} - ${effectiveHour} Hour${effectiveHour > 1 ? 's' : ''}`}
          price={selectedAllGamesPricing}
          selected={selectedPackageType === 'ALL_GAMES'}
          onPress={() => setSelectedPackageType('ALL_GAMES')}
        />
      </View>

      <View style={[styles.sectionCard, styles.gtaCard]}>
        <Text style={styles.sectionTitle}>GTA V1 - Ultimate Edition Package</Text>
        <Text style={styles.sectionSubtitle}>
          Special GTA pricing with strike price, offer price, and total savings.
        </Text>

        <View style={styles.listRows}>
          {SOLO_HOURS.map((hour) => (
            <PriceStrip
              key={hour}
              label={`${hour} Hour${hour > 1 ? 's' : ''}`}
              price={GTA_SPECIAL_PRICING[hour]}
              selected={selectedPackageType === 'GTA_V1' && effectiveHour === hour}
              onPress={() => {
                setSelectedPackageType('GTA_V1');
                setSelectedHour(hour);
                setGroupPlayers(1);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.footerText}>
          Selected: {selectedPackageType === 'ALL_GAMES' ? 'All Games Package' : 'GTA V1 - Ultimate Edition'}
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartSession}
          accessibilityRole="button"
        >
          <Text style={styles.startButtonText}>Start Session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  heroTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  gtaCard: {
    borderColor: Colors.warning,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  controlLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  noteText: {
    color: Colors.warning,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  listRows: {
    gap: 8,
    marginTop: 4,
  },
  priceStrip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  priceStripSelected: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  priceLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  priceNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  oldPrice: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    color: Colors.warning,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  saveBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  saveText: {
    color: Colors.background,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  footerCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.bold,
    fontSize: Typography.base,
  },
});
