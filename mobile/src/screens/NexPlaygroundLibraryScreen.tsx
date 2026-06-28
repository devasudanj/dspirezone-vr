/**
 * src/screens/NexPlaygroundLibraryScreen.tsx
 * -------------------------------------------
 * Browse screen for Nex Playground games. Mirrors GameLibraryScreen patterns:
 * category filter tabs, 3-column grid, loading/error/empty states.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';

import { fetchNexGames } from '../api/nexPlayground';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { trackNexLibraryViewed } from '../utils/analytics';
import type { NexGameCategory, NexGameListItem } from '../types';
import type { NexPlaygroundLibraryProps } from '../navigation/types';

const CATEGORIES: Array<{ label: string; value: NexGameCategory | null }> = [
  { label: 'All', value: null },
  { label: '⚡ Action', value: 'Action' },
  { label: '💃 Dance', value: 'Dance' },
  { label: '⚽ Sports', value: 'Sports' },
  { label: '🗺️ Adventure', value: 'Adventure' },
  { label: '🧒 Kids', value: 'Kids' },
  { label: '👥 Multiplayer', value: 'Multiplayer' },
];

// ---------------------------------------------------------------------------
// NexGameCard – inline card matching GameCard aesthetics
// ---------------------------------------------------------------------------
interface CardProps {
  game: NexGameListItem;
  onPress: () => void;
}

function NexGameCard({ game, onPress }: CardProps) {
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
      {isUnavailable && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            {game.status === 'DISABLED' ? 'Disabled' : 'Unavailable'}
          </Text>
        </View>
      )}
      {/* Nex badge */}
      <View style={styles.nexBadge}>
        <Text style={styles.nexBadgeText}>NEX</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{game.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{game.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NexPlaygroundLibraryScreen({
  navigation,
}: NexPlaygroundLibraryProps) {
  const [games, setGames] = useState<NexGameListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<NexGameCategory | null>(null);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNexGames(activeCategory ?? undefined);
      setGames(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load Nex games');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useFocusEffect(
    useCallback(() => {
      loadGames();
      trackNexLibraryViewed();
    }, [loadGames]),
  );

  return (
    <View style={styles.container}>
      {/* Category filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveCategory(cat.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Game grid */}
      {loading ? (
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading Nex games…</Text>
        </View>
      ) : error ? (
        <View style={styles.centred}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGames}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : games.length === 0 ? (
        <View style={styles.centred}>
          <Text style={styles.emptyText}>No Nex games found in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <NexGameCard
              game={item}
              onPress={() =>
                navigation.navigate('NexPlaygroundDetail', { gameId: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Tab bar
  tabBar: { maxHeight: 52, flexGrow: 0 },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: { color: Colors.background, fontWeight: Typography.bold },
  // Grid
  grid: { padding: 16, paddingTop: 8 },
  row: { gap: 12, marginBottom: 12 },
  // Card
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
  cardUnavailable: { opacity: 0.5 },
  thumbnail: { width: '100%', height: 140, backgroundColor: Colors.surfaceAlt },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  overlayText: {
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
    fontSize: Typography.base,
  },
  nexBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nexBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.background,
  },
  info: { padding: 10 },
  name: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '33',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.accent,
  },
  // States
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.sm },
  errorText: { color: Colors.danger, fontSize: Typography.base, textAlign: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: Typography.base, textAlign: 'center' },
  retryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: {
    color: Colors.background,
    fontWeight: Typography.bold,
    fontSize: Typography.base,
  },
});
