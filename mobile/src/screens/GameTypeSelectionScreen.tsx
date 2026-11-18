/**
 * src/screens/GameTypeSelectionScreen.tsx
 * ----------------------------------------
 * First screen users see in the Games tab.
 * Presents two platform choices: Nex Playground Games or VR Games.
 * Routes to the appropriate game library based on selection.
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { trackGameTypeSelected } from '../utils/analytics';
import type { GameTypeSelectionProps } from '../navigation/types';

interface PlatformOption {
  id: 'VR' | 'NEX_PLAYGROUND' | 'PS5';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  destination: 'GameLibrary' | 'NexPlaygroundLibrary' | 'PS5Pricing';
  discountText: string;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'NEX_PLAYGROUND',
    title: 'Action Playground',
    subtitle: 'Full-body motion gaming\nNo headset required',
    icon: 'body-outline',
    accentColor: Colors.accent,
    destination: 'NexPlaygroundLibrary',
    discountText: 'Special Offer',
  },
  {
    id: 'VR',
    title: 'VR Games',
    subtitle: 'Immersive virtual reality\nHeadset experiences',
    icon: 'glasses-outline',
    accentColor: Colors.primary,
    destination: 'GameLibrary',
    discountText: 'Special Offer',
  },
  {
    id: 'PS5',
    title: 'PS5 Packages',
    subtitle: 'Hourly and group pricing\nwith special GTA offers',
    icon: 'game-controller-outline',
    accentColor: Colors.warning,
    destination: 'PS5Pricing',
    discountText: 'Special Offer',
  },
];

export default function GameTypeSelectionScreen({
  navigation,
}: GameTypeSelectionProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 900;

  const handleSelect = (option: PlatformOption) => {
    trackGameTypeSelected(option.id);
    navigation.navigate(option.destination);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityRole="none"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <Text style={styles.heading} accessibilityRole="header">
        Choose Your Experience
      </Text>
      <Text style={styles.subheading}>
        Select a game type to get started
      </Text>

      <View style={[styles.optionsRow, isPhone && styles.optionsColumn]}>
        {PLATFORMS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.card,
              { borderColor: option.accentColor },
              isPhone ? styles.cardPhone : styles.cardTablet,
            ]}
            onPress={() => handleSelect(option)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`${option.title}: ${option.subtitle.replace('\n', ', ')}`}
            accessibilityHint={`Double tap to browse ${option.title}`}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: option.accentColor + '22' }]}
            >
              <Ionicons
                name={option.icon}
                size={52}
                color={option.accentColor}
              />
            </View>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, { color: option.accentColor }]}> 
                {option.title}
              </Text>
              <View style={styles.offerBadgeWrap}>
                <View style={styles.offerBadgeOuter}>
                  <View style={styles.offerBadgeInner}>
                    <Ionicons name="star" size={10} color={Colors.warning} style={styles.offerStarTop} />
                    <Ionicons name="star" size={9} color={Colors.warning} style={styles.offerStarBottom} />
                    <Text style={styles.offerTopText}>SPECIAL</Text>
                    <Text style={styles.offerBottomText}>OFFER</Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            <View style={[styles.ctaButton, { backgroundColor: option.accentColor }]}>
              <Text style={styles.ctaText}>Browse Games</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textOnPrimary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footerPromoWrap}>
        <Text style={styles.footerPromoText}>upto 50% off on most games..</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  heading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: Typography.base,
    fontWeight: Typography.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 980,
  },
  optionsColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 16,
  },
  cardPhone: {
    width: '100%',
    maxWidth: 420,
  },
  cardTablet: {
    width: '31%',
    minWidth: 220,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  offerBadgeWrap: {
    marginTop: -2,
  },
  offerBadgeOuter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FF3F5F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4B6E',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  offerBadgeInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#252A4A',
    borderWidth: 2,
    borderColor: '#3A4270',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  offerStarTop: {
    position: 'absolute',
    top: 3,
    right: 5,
  },
  offerStarBottom: {
    position: 'absolute',
    bottom: 5,
    left: 4,
  },
  offerTopText: {
    color: '#DDE4FF',
    fontSize: 8,
    fontWeight: Typography.extrabold,
    letterSpacing: 0.5,
  },
  offerBottomText: {
    color: '#FFD84D',
    fontSize: 8,
    fontWeight: Typography.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    textAlign: 'center',
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  ctaText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textOnPrimary,
  },
  footerPromoWrap: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#311435',
    borderWidth: 1,
    borderColor: '#FF4FD8',
  },
  footerPromoText: {
    color: '#FFD84D',
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
