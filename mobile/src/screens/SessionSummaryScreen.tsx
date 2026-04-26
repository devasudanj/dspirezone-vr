/**
 * src/screens/SessionSummaryScreen.tsx
 * --------------------------------------
 * Shows the confirmed session slip and provides options to:
 *   - Print (Android Print API via expo-print)
 *   - Share (WhatsApp / email / etc via expo-sharing)
 *   - Start a new session (resets flow and goes back to library)
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

import { fetchSession } from '../api/sessions';
import { buildSessionSlipHtml } from '../utils/sessionSlip';
import { printSessionSlip, shareSessionSlip } from '../utils/print';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useSessionStore } from '../store/sessionStore';
import type { Session } from '../types';
import type { SessionSummaryProps } from '../navigation/types';

export default function SessionSummaryScreen({ route, navigation }: SessionSummaryProps) {
  const { sessionId } = route.params;
  const confirmedSession = useSessionStore((s) => s.confirmedSession);
  const resetFlow = useSessionStore((s) => s.resetFlow);

  const [session, setSession] = useState<Session | null>(confirmedSession);
  const [loading, setLoading] = useState(!confirmedSession);
  const [printing, setPrinting] = useState(false);

  // If navigated directly (e.g., deep link) without store data, fetch from API
  useEffect(() => {
    if (confirmedSession) return;
    (async () => {
      try {
        const data = await fetchSession(sessionId);
        setSession(data);
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Could not load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, confirmedSession]);

  const handlePrint = async () => {
    if (!session) return;
    setPrinting(true);
    try {
      const html = buildSessionSlipHtml(session);
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
      const html = buildSessionSlipHtml(session);
      await shareSessionSlip(html, session.session_code);
    } catch (e: any) {
      Alert.alert('Share Error', e.message ?? 'Could not share the slip');
    } finally {
      setPrinting(false);
    }
  };

  const handleNewSession = () => {
    resetFlow();
    navigation.navigate('GameLibrary');
  };

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
          <Text style={styles.successSub}>Your session slip is ready below</Text>
        </View>

        {/* Session slip card */}
        <View style={styles.slip}>
          <View style={styles.slipHeader}>
            <Text style={styles.centerName}>🎮 Dspire VR Zone</Text>
            <Text style={styles.slipLabel}>VR Gaming Session Slip</Text>
          </View>

          <View style={styles.divider} />

          <SlipRow label="Session ID" value={session.session_code} highlight />
          <SlipRow label="Game" value={session.game_name} />
          <SlipRow label="Headset" value={session.headset_code} highlight />
          <SlipRow label="Duration" value={`${session.duration_minutes} minutes`} />
          <SlipRow label="Date" value={dateStr} />
          <SlipRow label="Time" value={timeStr} />

          <View style={styles.divider} />

          <Text style={styles.slipFooter}>
            Thank you for visiting Dspire VR Zone!
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
// Sub-component: a single row in the session slip
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
    <View style={slipRowStyles.row}>
      <Text style={slipRowStyles.label}>{label}</Text>
      <Text style={[slipRowStyles.value, highlight && slipRowStyles.valueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const slipRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    maxWidth: '60%',
    textAlign: 'right',
  },
  valueHighlight: {
    color: Colors.accent,
    fontWeight: Typography.bold,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 100 },

  successBanner: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  successTitle: {
    color: Colors.textPrimary,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
  },
  successSub: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
  },

  slip: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  slipHeader: {
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  centerName: {
    color: Colors.primary,
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    letterSpacing: 1,
  },
  slipLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  slipFooter: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: 'center',
    marginTop: 8,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionShare: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionNew: {
    backgroundColor: Colors.success,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.base,
  },
});
