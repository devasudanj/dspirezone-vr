/**
 * src/screens/NexPlaygroundTimeSelectionScreen.tsx
 * --------------------------------------------------
 * Player picks duration and number of players for a Nex Playground session.
 * Mirrors TimeSelectionScreen patterns.
 * On confirmation → POST to Nex sessions → NexPlaygroundSessionSummaryScreen.
 */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { createNexSession, fetchNexStations } from '../api/nexPlayground';
import DurationButton from '../components/DurationButton';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useNexSessionStore } from '../store/nexSessionStore';
import { trackNexBookingInitiated } from '../utils/analytics';
import {
  SESSION_DURATIONS,
  type SessionDuration,
  type NexStation,
} from '../types';
import type { NexPlaygroundTimeSelectionProps } from '../navigation/types';

const MAX_PLAYERS = 4;
const PLAYER_COUNTS = [1, 2, 3, 4] as const;

export default function NexPlaygroundTimeSelectionScreen({
  route,
  navigation,
}: NexPlaygroundTimeSelectionProps) {
  const { gameId } = route.params;

  const selectedGame = useNexSessionStore((s) => s.selectedGame);
  const playerContact = useNexSessionStore((s) => s.playerContact);
  const setSelectedDuration = useNexSessionStore((s) => s.setSelectedDuration);
  const setSelectedPlayers = useNexSessionStore((s) => s.setSelectedPlayers);
  const setConfirmedSession = useNexSessionStore((s) => s.setConfirmedSession);

  const [stations, setStations] = useState<NexStation[]>([]);
  const [selectedDuration, _setDuration] = useState<SessionDuration | null>(null);
  const [players, setPlayers] = useState(1);
  const [loading, setLoading] = useState(false);

  const maxPlayers = selectedGame
    ? Math.min(selectedGame.max_players, MAX_PLAYERS)
    : MAX_PLAYERS;

  useEffect(() => {
    let cancelled = false;
    fetchNexStations()
      .then((data) => { if (!cancelled) setStations(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const chooseDuration = (d: SessionDuration) => {
    _setDuration(d);
    setSelectedDuration(d);
  };

  const choosePlayerCount = (count: number) => {
    setPlayers(count);
    setSelectedPlayers(count);
  };

  const confirmSession = async () => {
    if (!selectedDuration) return;

    const stationList = stations.map((s) => s.code).join(', ');

    Alert.alert(
      'Confirm Nex Session',
      `Game: ${selectedGame?.name}\nPlayers: ${players}\nStations: ${stationList || 'N/A'}\nDuration: ${selectedDuration} minutes`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Print',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              trackNexBookingInitiated(gameId, selectedDuration, players);
              const session = await createNexSession({
                game_id: gameId,
                duration_minutes: selectedDuration,
                players,
              });
              setConfirmedSession(session);
              navigation.navigate('NexPlaygroundSessionSummary', {
                sessionId: session.id,
              });
            } catch (e: any) {
              Alert.alert(
                'Error',
                e.message ?? 'Could not create session. Please try again.',
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Context header */}
        <View style={styles.context}>
          <Text style={styles.contextTitle}>
            🕹️ {selectedGame?.name ?? 'Nex Game'}
          </Text>
        </View>

        {/* Active stations */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <Ionicons
              name="hardware-chip-outline"
              size={14}
              color={Colors.textSecondary}
            />
            {'  '}Available Stations
          </Text>
          {stations.length === 0 ? (
            <Text style={styles.emptyChip}>Loading stations…</Text>
          ) : (
            <View style={styles.chipsRow}>
              {stations.map((station) => (
                <View key={station.id} style={styles.chip}>
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: station.is_active ? Colors.success : Colors.disabled },
                    ]}
                  />
                  <Text style={styles.chipText}>{station.code}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Number of players */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            {'  '}Number of Players
          </Text>
          <View style={styles.playerRow}>
            {(PLAYER_COUNTS as readonly number[])
              .filter((c) => c <= maxPlayers)
              .map((count) => {
                const isSelected = players === count;
                return (
                  <TouchableOpacity
                    key={count}
                    style={[styles.playerButton, isSelected && styles.playerButtonActive]}
                    onPress={() => choosePlayerCount(count)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${count} player${count > 1 ? 's' : ''}`}
                  >
                    <Text
                      style={[
                        styles.playerButtonText,
                        isSelected && styles.playerButtonTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                    <Text
                      style={[
                        styles.playerButtonSub,
                        isSelected && styles.playerButtonSubActive,
                      ]}
                    >
                      {count === 1 ? 'player' : 'players'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>

        {/* Duration picker – reuses existing DurationButton */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="timer-outline" size={14} color={Colors.textSecondary} />
            {'  '}Select Duration
          </Text>
          <View style={styles.durationRow}>
            {SESSION_DURATIONS.map((d) => (
              <DurationButton
                key={d}
                minutes={d}
                selected={selectedDuration === d}
                onPress={() => chooseDuration(d)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedDuration || loading) && styles.confirmDisabled,
          ]}
          onPress={confirmSession}
          disabled={!selectedDuration || loading}
          accessibilityRole="button"
          accessibilityLabel="Confirm Nex Playground session"
          accessibilityState={{ disabled: !selectedDuration || loading }}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color={Colors.textOnPrimary} />
              <Text style={styles.confirmText}>Confirm & Print</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, gap: 28 },
  context: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contextTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  section: { gap: 12 },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  emptyChip: { color: Colors.textMuted, fontSize: Typography.sm },
  // Player count
  playerRow: { flexDirection: 'row', gap: 12 },
  playerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  playerButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  playerButtonText: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  playerButtonTextActive: { color: Colors.background },
  playerButtonSub: { fontSize: Typography.xs, color: Colors.textMuted },
  playerButtonSubActive: { color: Colors.background },
  // Duration
  durationRow: { flexDirection: 'row', gap: 12 },
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  confirmDisabled: { backgroundColor: Colors.disabled },
  confirmText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textOnPrimary,
  },
});
