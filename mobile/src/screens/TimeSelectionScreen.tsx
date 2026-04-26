/**
 * src/screens/TimeSelectionScreen.tsx
 * -------------------------------------
 * Player picks a session duration (10 / 30 / 45 / 60 minutes).
 * On confirmation → POST /sessions → SessionSummaryScreen.
 */
import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { createSession } from '../api/sessions';
import DurationButton from '../components/DurationButton';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useSessionStore } from '../store/sessionStore';
import { SESSION_DURATIONS, type SessionDuration } from '../types';
import type { TimeSelectionProps } from '../navigation/types';

export default function TimeSelectionScreen({ route, navigation }: TimeSelectionProps) {
  const { gameId, installation } = route.params;
  const selectedGame = useSessionStore((s) => s.selectedGame);
  const setSelectedDuration = useSessionStore((s) => s.setSelectedDuration);
  const setConfirmedSession = useSessionStore((s) => s.setConfirmedSession);

  const [selectedDuration, _setDuration] = useState<SessionDuration | null>(null);
  const [loading, setLoading] = useState(false);

  const chooseDuration = (d: SessionDuration) => {
    _setDuration(d);
    setSelectedDuration(d);
  };

  const confirmSession = async () => {
    if (!selectedDuration) return;

    Alert.alert(
      'Confirm Session',
      `Game: ${selectedGame?.name}\nHeadset: ${installation.headset_code}\nDuration: ${selectedDuration} minutes`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Print',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const session = await createSession({
                game_id: gameId,
                headset_id: installation.headset_id,
                duration_minutes: selectedDuration,
              });
              setConfirmedSession(session);
              navigation.navigate('SessionSummary', { sessionId: session.id });
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not create session. Please try again.');
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
      {/* Context header */}
      <View style={styles.context}>
        <Text style={styles.contextTitle}>
          🎮 {selectedGame?.name ?? 'Game'}
        </Text>
        <View style={styles.contextRow}>
          <Text style={styles.contextLabel}>Headset</Text>
          <Text style={styles.contextValue}>{installation.headset_code}</Text>
        </View>
      </View>

      {/* Duration selection */}
      <View style={styles.body}>
        <Text style={styles.prompt}>How long would you like to play?</Text>

        <View style={styles.durationGrid}>
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

      {/* Confirm button */}
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <TouchableOpacity
            style={[styles.confirmButton, !selectedDuration && styles.confirmDisabled]}
            onPress={confirmSession}
            disabled={!selectedDuration}
            accessibilityRole="button"
            accessibilityLabel="Confirm session booking"
          >
            <Text style={styles.confirmText}>
              {selectedDuration
                ? `✅ Confirm – ${selectedDuration} min`
                : 'Select a duration above'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  context: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  contextTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  contextLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  contextValue: {
    color: Colors.accent,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  prompt: {
    color: Colors.textPrimary,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },

  footer: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmDisabled: {
    backgroundColor: Colors.disabled,
  },
  confirmText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
});
