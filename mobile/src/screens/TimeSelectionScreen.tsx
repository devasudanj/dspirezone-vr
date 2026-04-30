/**
 * src/screens/TimeSelectionScreen.tsx
 * -------------------------------------
 * Player picks a session duration (10 / 30 / 45 / 60 minutes).
 * Available headsets are shown as informational chips – not selectable.
 * On confirmation → POST /sessions → SessionSummaryScreen.
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

import { createSession } from '../api/sessions';
import { fetchGameInstallations } from '../api/games';
import DurationButton from '../components/DurationButton';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useSessionStore } from '../store/sessionStore';
import { SESSION_DURATIONS, type SessionDuration, type Installation } from '../types';
import type { TimeSelectionProps } from '../navigation/types';

function statusColor(status: Installation['installation_status']) {
  if (status === 'ACTIVE') return Colors.success;
  if (status === 'EXPIRING_SOON') return Colors.warning;
  return Colors.danger;
}

export default function TimeSelectionScreen({ route, navigation }: TimeSelectionProps) {
  const { gameId } = route.params;
  const selectedGame = useSessionStore((s) => s.selectedGame);
  const setSelectedDuration = useSessionStore((s) => s.setSelectedDuration);
  const setConfirmedSession = useSessionStore((s) => s.setConfirmedSession);

  const [installations, setInstallations] = useState<Installation[]>([]);
  const [selectedDuration, _setDuration] = useState<SessionDuration | null>(null);
  const [playMode, setPlayMode] = useState<'solo' | 'multiplayer'>('solo');
  const [loading, setLoading] = useState(false);

  const isMultiplayer = selectedGame?.is_multiplayer ?? false;

  useEffect(() => {
    let cancelled = false;
    fetchGameInstallations(gameId, true)
      .then((data) => { if (!cancelled) setInstallations(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [gameId]);

  const chooseDuration = (d: SessionDuration) => {
    _setDuration(d);
    setSelectedDuration(d);
  };

  const confirmSession = async () => {
    if (!selectedDuration) return;

    const headsetList = installations
      .map((i) => i.headset_code)
      .join(', ');

    const modeLabel = isMultiplayer ? (playMode === 'multiplayer' ? 'Multiplayer' : 'Solo') : 'Solo';

    Alert.alert(
      'Confirm Session',
      `Game: ${selectedGame?.name}\nMode: ${modeLabel}\nHeadsets: ${headsetList || 'N/A'}\nDuration: ${selectedDuration} minutes`,
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
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Context header */}
        <View style={styles.context}>
          <Text style={styles.contextTitle}>
            🎮 {selectedGame?.name ?? 'Game'}
          </Text>
        </View>

        {/* Available headsets — informational only */}
        <View style={styles.headsetsSection}>
          <Text style={styles.headsetsLabel}>
            <Ionicons name="hardware-chip-outline" size={14} color={Colors.textSecondary} />
            {'  '}Available Headsets
          </Text>
          {installations.length === 0 ? (
            <Text style={styles.headsetsEmpty}>Loading headsets…</Text>
          ) : (
            <View style={styles.chipsRow}>
              {installations.map((inst) => (
                <View
                  key={inst.id}
                  style={[styles.chip, { borderColor: statusColor(inst.installation_status) }]}
                >
                  <View
                    style={[styles.chipDot, { backgroundColor: statusColor(inst.installation_status) }]}
                  />
                  <Text style={styles.chipText}>{inst.headset_code}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Play Mode — only shown for multiplayer games */}
        {isMultiplayer && (
          <View style={styles.playModeSection}>
            <Text style={styles.playModeLabel}>Play Mode</Text>
            <View style={styles.playModeRow}>
              <TouchableOpacity
                style={[
                  styles.playModeBtn,
                  playMode === 'solo' && styles.playModeBtnActive,
                ]}
                onPress={() => setPlayMode('solo')}
                accessibilityRole="button"
                accessibilityLabel="Solo play mode"
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={playMode === 'solo' ? Colors.textOnPrimary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.playModeBtnText,
                    playMode === 'solo' && styles.playModeBtnTextActive,
                  ]}
                >
                  Solo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.playModeBtn,
                  playMode === 'multiplayer' && styles.playModeBtnActiveMulti,
                ]}
                onPress={() => setPlayMode('multiplayer')}
                accessibilityRole="button"
                accessibilityLabel="Multiplayer play mode"
              >
                <Ionicons
                  name="people"
                  size={18}
                  color={playMode === 'multiplayer' ? Colors.textOnPrimary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.playModeBtnText,
                    playMode === 'multiplayer' && styles.playModeBtnTextActive,
                  ]}
                >
                  Multiplayer
                </Text>
              </TouchableOpacity>
            </View>

            {playMode === 'multiplayer' && (
              <View style={styles.multiplayerNote}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
                <Text style={styles.multiplayerNoteText}>
                  This is based on headset availability and will be determined by the VR admin during booking.
                </Text>
              </View>
            )}
          </View>
        )}

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

          {/* Discount note */}
          <View style={styles.discountNote}>
            <Ionicons name="pricetag-outline" size={15} color={Colors.warning} />
            <Text style={styles.discountNoteText}>
              Any available discounts will be applied at the counter during payment.
            </Text>
          </View>
        </View>
      </ScrollView>

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
  scroll: { paddingBottom: 20 },

  context: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contextTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },

  headsetsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  headsetsLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headsetsEmpty: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: Colors.surfaceAlt,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
  },

  playModeSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  playModeLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  playModeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  playModeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  playModeBtnActiveMulti: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  playModeBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  playModeBtnTextActive: {
    color: Colors.textOnPrimary,
  },
  multiplayerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 10,
    padding: 12,
  },
  multiplayerNoteText: {
    flex: 1,
    color: Colors.accent,
    fontSize: Typography.sm,
    lineHeight: 18,
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
  discountNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 420,
  },
  discountNoteText: {
    flex: 1,
    color: Colors.warning,
    fontSize: Typography.sm,
    lineHeight: 18,
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
