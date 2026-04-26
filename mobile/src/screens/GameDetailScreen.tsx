/**
 * src/screens/GameDetailScreen.tsx
 * ---------------------------------
 * Shows full info about a game: description, category badge, and the list of
 * headsets it's installed on with visual status indicators.
 *
 * CTA: "Start Session" → HeadsetSelectionScreen
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { fetchGame, fetchGameInstallations } from '../api/games';
import InstallationRow from '../components/InstallationRow';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useSessionStore } from '../store/sessionStore';
import type { Game, Installation } from '../types';
import type { GameDetailProps } from '../navigation/types';

export default function GameDetailScreen({ route, navigation }: GameDetailProps) {
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedGame = useSessionStore((s) => s.setSelectedGame);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, insts] = await Promise.all([
          fetchGame(gameId),
          fetchGameInstallations(gameId),
        ]);
        if (!cancelled) {
          setGame(g);
          setInstallations(insts);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load game');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  const activeInstallations = installations.filter(
    (i) => i.installation_status !== 'EXPIRED',
  );
  const canStartSession = game?.status === 'ACTIVE' && activeInstallations.length > 0;

  const handleStartSession = () => {
    if (!game) return;
    setSelectedGame(game);
    navigation.navigate('HeadsetSelection', { gameId: game.id });
  };

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorText}>{error ?? 'Game not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero image */}
        <Image
          source={{ uri: game.thumbnail_url || 'https://via.placeholder.com/800x300' }}
          style={styles.hero}
          contentFit="cover"
        />

        {/* Meta info */}
        <View style={styles.meta}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{game.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{game.category}</Text>
            </View>
          </View>
          <Text style={styles.description}>{game.description}</Text>
        </View>

        {/* Installations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Installed on {installations.length} headset{installations.length !== 1 ? 's' : ''}
          </Text>
          {installations.length === 0 ? (
            <Text style={styles.noInstalls}>
              This game has no headset installations yet.
            </Text>
          ) : (
            installations.map((inst) => (
              <InstallationRow key={inst.id} installation={inst} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.footer}>
        {!canStartSession && (
          <Text style={styles.blockedHint}>
            {game.status !== 'ACTIVE'
              ? `Game is ${game.status.toLowerCase()} – sessions unavailable`
              : 'No active headset installations available'}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.ctaButton, !canStartSession && styles.ctaDisabled]}
          onPress={handleStartSession}
          disabled={!canStartSession}
          accessibilityRole="button"
          accessibilityLabel="Start a play session for this game"
        >
          <Text style={styles.ctaText}>🎮 Start Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 100 },

  hero: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.surface,
  },

  meta: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: 22,
  },

  section: {
    margin: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginBottom: 12,
  },
  noInstalls: {
    color: Colors.textMuted,
    fontSize: Typography.base,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  blockedHint: {
    color: Colors.warning,
    fontSize: Typography.sm,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: Colors.disabled,
  },
  ctaText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.base,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
