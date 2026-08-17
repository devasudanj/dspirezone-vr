/**
 * src/screens/GameTypeSelectionScreen.tsx
 * ----------------------------------------
 * First screen users see in the Games tab.
 * Presents two platform choices: Nex Playground Games or VR Games.
 * Routes to the appropriate game library based on selection.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { trackGameTypeSelected } from '../utils/analytics';
import type { GameTypeSelectionProps } from '../navigation/types';

interface PlatformOption {
  id: 'VR' | 'NEX_PLAYGROUND';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  destination: 'GameLibrary' | 'NexPlaygroundLibrary';
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'NEX_PLAYGROUND',
    title: 'Action Playground',
    subtitle: 'Full-body motion gaming\nNo headset required',
    icon: 'body-outline',
    accentColor: Colors.accent,
    destination: 'NexPlaygroundLibrary',
  },
  {
    id: 'VR',
    title: 'VR Games',
    subtitle: 'Immersive virtual reality\nHeadset experiences',
    icon: 'glasses-outline',
    accentColor: Colors.primary,
    destination: 'GameLibrary',
  },
];

export default function GameTypeSelectionScreen({
  navigation,
}: GameTypeSelectionProps) {
  const handleSelect = (option: PlatformOption) => {
    trackGameTypeSelected(option.id);
    navigation.navigate(option.destination);
  };

  return (
    <View style={styles.container} accessibilityRole="none">
      <Text style={styles.heading} accessibilityRole="header">
        Choose Your Experience
      </Text>
      <Text style={styles.subheading}>
        Select a game type to get started
      </Text>

      <View style={styles.optionsRow}>
        {PLATFORMS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.card, { borderColor: option.accentColor }]}
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
            <Text style={[styles.cardTitle, { color: option.accentColor }]}>
              {option.title}
            </Text>
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            <View style={[styles.ctaButton, { backgroundColor: option.accentColor }]}>
              <Text style={styles.ctaText}>Browse Games</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textOnPrimary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 24,
    width: '100%',
    maxWidth: 800,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 16,
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
});
