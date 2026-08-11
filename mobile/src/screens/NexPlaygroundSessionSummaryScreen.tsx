/**
 * src/screens/NexPlaygroundSessionSummaryScreen.tsx
 * --------------------------------------------------
 * Displays the confirmed Nex Playground session slip.
 * Provides Print, Share, and New Session actions.
 * Mirrors SessionSummaryScreen patterns.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { printSessionSlip, shareSessionSlip } from '../utils/print';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useNexSessionStore } from '../store/nexSessionStore';
import { trackNexSessionConfirmed } from '../utils/analytics';
import type { NexSession } from '../types';
import type { NexPlaygroundSessionSummaryProps } from '../navigation/types';

function buildNexSlipHtml(
  session: NexSession,
  playerContact?: { name: string; phone: string } | null,
): string {
  const createdAt = new Date(session.created_at);
  const dateStr = createdAt.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
  const contactName = playerContact?.name ? playerContact.name : 'Guest';
  const normalizedPhone = playerContact?.phone ? playerContact.phone.replace(/\D/g, '') : '';
  const contactPhone = normalizedPhone || 'N/A';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nex Session Slip</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
  h1 { color: #00D4FF; font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #555; margin-top: 0; }
  hr { border: none; border-top: 1px dashed #ccc; margin: 16px 0; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .label { color: #666; }
  .value { font-weight: bold; }
  .highlight .value { color: #00D4FF; font-size: 16px; }
  footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
</style>
</head>
<body>
<h1>🕹️ Dspire VR Zone</h1>
<h2>Nex Playground Session Slip</h2>
<hr/>
<div class="row highlight"><span class="label">Session ID</span><span class="value">${session.session_code}</span></div>
<div class="row"><span class="label">Game</span><span class="value">${session.game_name}</span></div>
<div class="row"><span class="label">Name</span><span class="value">${contactName}</span></div>
<div class="row"><span class="label">Phone</span><span class="value">${contactPhone}</span></div>
<div class="row highlight"><span class="label">Players</span><span class="value">${session.players}</span></div>
<div class="row highlight"><span class="label">Stations</span><span class="value">${session.station_codes.join(', ') || 'N/A'}</span></div>
<div class="row"><span class="label">Duration</span><span class="value">${session.duration_minutes} minutes</span></div>
<div class="row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
<div class="row"><span class="label">Time</span><span class="value">${timeStr}</span></div>
<hr/>
<footer>Thank you for playing at Dspire VR Zone!</footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NexPlaygroundSessionSummaryScreen({
  route,
  navigation,
}: NexPlaygroundSessionSummaryProps) {
  const { sessionId } = route.params;
  const confirmedSession = useNexSessionStore((s) => s.confirmedSession);
  const playerContact = useNexSessionStore((s) => s.playerContact);
  const resetFlow = useNexSessionStore((s) => s.resetFlow);

  const [session, setSession] = useState<NexSession | null>(confirmedSession);
  const [loading, setLoading] = useState(!confirmedSession);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (confirmedSession) {
      trackNexSessionConfirmed(confirmedSession.session_code, confirmedSession.game_id);
      return;
    }
    // TODO(backend): once fetchNexSession is implemented, fetch here by sessionId
    setLoading(false);
  }, [confirmedSession, sessionId]);

  const handlePrint = async () => {
    if (!session) return;
    setPrinting(true);
    try {
      const html = buildNexSlipHtml(session, playerContact ?? undefined);
      await printSessionSlip(html);
    } catch (e: any) {
      Alert.alert('Print Error', e.message ?? 'Could not send to printer');
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    if (!session) return;
    setPrinting(true);
    try {
      const html = buildNexSlipHtml(session, playerContact ?? undefined);
      await shareSessionSlip(html, session.session_code);
    } catch (e: any) {
      Alert.alert('Share Error', e.message ?? 'Could not share the slip');
    } finally {
      setPrinting(false);
    }
  };

  const handleNewSession = () => {
    resetFlow();
    navigation.navigate('GameTypeSelection');
  };

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorText}>Session not found.</Text>
      </View>
    );
  }

  const createdAt = new Date(session.created_at);
  const dateStr = createdAt.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success banner */}
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
          <Text style={styles.successTitle}>Session Confirmed!</Text>
          <Text style={styles.successSub}>Your Nex Playground session slip is ready</Text>
        </View>

        {/* Session slip card */}
        <View style={styles.slip}>
          <View style={styles.slipHeader}>
            <Text style={styles.centerName}>🕹️ Dspire VR Zone</Text>
            <Text style={styles.slipLabel}>Nex Playground Session Slip</Text>
          </View>
          <View style={styles.divider} />
          <SlipRow label="Session ID" value={session.session_code} highlight />
          <SlipRow label="Game" value={session.game_name} />
          <SlipRow label="Name" value={playerContact?.name ?? 'Guest'} />
          <SlipRow label="Phone" value={playerContact?.phone ?? 'N/A'} />
          <SlipRow label="Players" value={String(session.players)} highlight />
          <SlipRow
            label="Stations"
            value={session.station_codes.length > 0 ? session.station_codes.join(', ') : 'N/A'}
            highlight
          />
          <SlipRow label="Duration" value={`${session.duration_minutes} minutes`} />
          <SlipRow label="Date" value={dateStr} />
          <SlipRow label="Time" value={timeStr} />
          <View style={styles.divider} />
          <Text style={styles.slipFooter}>
            Thank you for playing at Dspire VR Zone!
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, printing && styles.actionDisabled]}
          onPress={handlePrint}
          disabled={printing}
          accessibilityRole="button"
          accessibilityLabel="Print session slip"
        >
          {printing ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="print-outline" size={22} color={Colors.textOnPrimary} />
              <Text style={styles.actionText}>Print</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionShare, printing && styles.actionDisabled]}
          onPress={handleShare}
          disabled={printing}
          accessibilityRole="button"
          accessibilityLabel="Share session slip"
        >
          <Ionicons name="share-social-outline" size={22} color={Colors.textOnPrimary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionNew]}
          onPress={handleNewSession}
          accessibilityRole="button"
          accessibilityLabel="Start a new session"
        >
          <Ionicons name="add-circle-outline" size={22} color={Colors.textOnPrimary} />
          <Text style={styles.actionText}>New Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SlipRow sub-component
// ---------------------------------------------------------------------------
function SlipRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.slipRow}>
      <Text style={styles.slipRowLabel}>{label}</Text>
      <Text style={[styles.slipRowValue, highlight && styles.slipRowHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.danger, fontSize: Typography.base },
  scroll: { padding: 20, gap: 20, alignItems: 'center' },
  // Banner
  successBanner: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  successSub: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  // Slip
  slip: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    padding: 24,
    gap: 8,
  },
  slipHeader: { alignItems: 'center', marginBottom: 4 },
  centerName: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  slipLabel: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: Typography.semibold,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 8 },
  slipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  slipRowLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  slipRowValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.semibold,
  },
  slipRowHighlight: { color: Colors.accent, fontSize: Typography.md },
  slipFooter: {
    textAlign: 'center',
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  // Footer actions
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  actionShare: { backgroundColor: Colors.primaryLight },
  actionNew: { backgroundColor: Colors.primary },
  actionDisabled: { opacity: 0.5 },
  actionText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textOnPrimary,
  },
});
