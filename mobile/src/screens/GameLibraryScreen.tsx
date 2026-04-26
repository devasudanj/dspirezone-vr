/**
 * src/screens/GameLibraryScreen.tsx
 * ----------------------------------
 * The landing screen. Displays all active VR games in a tablet-friendly
 * grid with category filter tabs across the top.
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

import { fetchGames } from '../api/games';
import GameCard from '../components/GameCard';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import type { GameCategory, GameListItem } from '../types';
import type { GameLibraryProps } from '../navigation/types';

const CATEGORIES: Array<{ label: string; value: GameCategory | null }> = [
  { label: 'All', value: null },
  { label: '⚔️ Action', value: 'Action' },
  { label: '🗺️ Adventure', value: 'Adventure' },
  { label: '👻 Horror', value: 'Horror' },
  { label: '🧒 Kids', value: 'Kids' },
  { label: '📚 Educational', value: 'Educational' },
  { label: '⚽ Sports', value: 'Sports' },
  { label: '🏭 Simulation', value: 'Simulation' },
  { label: '🧩 Puzzle', value: 'Puzzle' },
];

export default function GameLibraryScreen({ navigation }: GameLibraryProps) {
  const [games, setGames] = useState<GameListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGames(activeCategory ?? undefined);
      setGames(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  // Reload whenever screen comes into focus (e.g., back navigation)
  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [loadGames]),
  );

  return (
    <View style={styles.container}>
      {/* Category filter tab bar */}
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
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading games…</Text>
        </View>
      ) : error ? (
        <View style={styles.centred}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={[styles.errorText, { fontSize: 11, marginTop: 4, opacity: 0.6 }]}>
            API: {process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGames}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : games.length === 0 ? (
        <View style={styles.centred}>
          <Text style={styles.emptyText}>No games found in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexGrow: 0,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  tabTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.bold,
  },
  grid: {
    padding: 16,
    gap: 16,
  },
  row: {
    gap: 16,
    justifyContent: 'flex-start',
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.base,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.bold,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.md,
  },
});
