/**
 * src/components/GameCard.tsx
 * ----------------------------
 * Touchable card displayed in the 3-column game library grid.
 * Shows thumbnail, game name, and category badge.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import type { GameListItem } from '../types';

interface Props {
  game: GameListItem;
  onPress: () => void;
}

export default function GameCard({ game, onPress }: Props) {
  const isUnavailable = game.status !== 'ACTIVE';

  return (
    <TouchableOpacity
      style={[styles.card, isUnavailable && styles.cardUnavailable]}
      onPress={onPress}
      disabled={isUnavailable}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${game.name} – ${game.category}`}
    >
      <Image
        source={{ uri: game.thumbnail_url || 'https://via.placeholder.com/300x180' }}
        style={styles.thumbnail}
        contentFit="cover"
      />

      {/* Status overlay for non-active games */}
      {isUnavailable && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            {game.status === 'DISABLED' ? 'Disabled' : 'Expired'}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{game.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{game.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 200,
    maxWidth: '33%',
  },
  cardUnavailable: {
    opacity: 0.5,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.surfaceAlt,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: Colors.danger,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  info: {
    padding: 12,
    gap: 6,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    lineHeight: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
});
