import React, { useMemo, useState } from 'react';
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
import axios from 'axios';

import Colors from '../theme/colors';
import Typography from '../theme/typography';
import type { PS5SessionSummaryProps } from '../navigation/types';
import {
  usePS5SessionStore,
  type PS5ConfirmedSession,
} from '../store/ps5SessionStore';
import { buildSessionContactPayload } from '../utils/sessionContact';
import { printSessionSlip, shareSessionSlip } from '../utils/print';

const CONTACT_SAVE_URL = 'https://dspirezone-app-dev.azurewebsites.net/api/vr/session-contacts';

function buildSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const token = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PS5-${token}`;
}

function formatRs(value: number): string {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

function buildPs5SlipHtml(session: PS5ConfirmedSession): string {
  const createdAt = new Date(session.createdAt);
  const dateStr = createdAt.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PS5 Session Slip</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #151523; }
    .title { font-size: 24px; font-weight: 800; color: #6c63ff; }
    .sub { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .id { margin: 14px 0; padding: 12px; border: 2px solid #6c63ff; border-radius: 10px; text-align: center; }
    .idv { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #6c63ff; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; gap: 12px; }
    .label { color: #666; font-size: 13px; }
    .value { color: #111; font-size: 14px; font-weight: 700; text-align: right; }
    .strike { text-decoration: line-through; color: #888; font-weight: 600; }
    .save { color: #0a9f7d; font-weight: 800; }
    .total { color: #6c63ff; font-size: 16px; font-weight: 800; }
    .footer { margin-top: 16px; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="title">Dspire VR Zone</div>
  <div class="sub">PS5 Session Slip</div>

  <div class="id">
    <div>Session ID</div>
    <div class="idv">${session.sessionCode}</div>
  </div>

  <div class="row"><div class="label">Name</div><div class="value">${session.playerContact.name}</div></div>
  <div class="row"><div class="label">Phone</div><div class="value">${session.playerContact.phone}</div></div>
  <div class="row"><div class="label">Package</div><div class="value">${session.selection.packageLabel}</div></div>
  <div class="row"><div class="label">Game Option</div><div class="value">${session.selection.gameName}</div></div>
  <div class="row"><div class="label">Players</div><div class="value">${session.selection.players}</div></div>
  <div class="row"><div class="label">Duration</div><div class="value">${session.selection.hours} hour${session.selection.hours > 1 ? 's' : ''}</div></div>
  <div class="row"><div class="label">Strike Price</div><div class="value strike">${formatRs(session.selection.originalPrice)}</div></div>
  <div class="row"><div class="label">Offer Price</div><div class="value total">${formatRs(session.selection.discountedPrice)}</div></div>
  <div class="row"><div class="label">Savings</div><div class="value save">${formatRs(session.selection.savings)}</div></div>
  <div class="row"><div class="label">Date</div><div class="value">${dateStr}</div></div>
  <div class="row"><div class="label">Time</div><div class="value">${timeStr}</div></div>

  <div class="footer">Thank you for visiting Dspire VR Zone.</div>
</body>
</html>`;
}

export default function PS5SessionSummaryScreen({ navigation }: PS5SessionSummaryProps) {
  const selectedPackage = usePS5SessionStore((s) => s.selectedPackage);
  const playerContact = usePS5SessionStore((s) => s.playerContact);
  const confirmedSession = usePS5SessionStore((s) => s.confirmedSession);
  const setConfirmedSession = usePS5SessionStore((s) => s.setConfirmedSession);
  const resetFlow = usePS5SessionStore((s) => s.resetFlow);

  const [busy, setBusy] = useState(false);

  const session = useMemo(() => {
    if (confirmedSession) return confirmedSession;
    if (!selectedPackage || !playerContact) return null;

    return {
      sessionCode: buildSessionCode(),
      createdAt: new Date().toISOString(),
      selection: selectedPackage,
      playerContact,
    };
  }, [confirmedSession, selectedPackage, playerContact]);

  const ensureSavedSession = async (): Promise<PS5ConfirmedSession | null> => {
    if (!session) return null;
    if (!confirmedSession) {
      setConfirmedSession(session);
      try {
        const payload = buildSessionContactPayload({
          name: session.playerContact.name,
          phone: session.playerContact.phone,
          selectedGameName: session.selection.gameName,
          selectedGameId: null,
          stationName: 'PS5',
          source: 'ps5-package',
          sessionStartedAt: new Date(session.createdAt),
          vrSessionId: session.sessionCode,
          originalGamePrice: session.selection.originalPrice,
          selectedSessionTime: session.selection.hours * 60,
          discountCode: `${session.selection.packageType}-FLYER`,
          discountPct: Math.round((session.selection.savings / session.selection.originalPrice) * 100),
          finalPriceInclGst: session.selection.discountedPrice,
        });

        await axios.post(CONTACT_SAVE_URL, payload, {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          timeout: 8000,
        });
      } catch {
        // Do not block printing when contact API is temporarily unavailable.
      }
    }

    return confirmedSession ?? session;
  };

  const handlePrint = async () => {
    setBusy(true);
    try {
      const current = await ensureSavedSession();
      if (!current) return;
      await printSessionSlip(buildPs5SlipHtml(current));
    } catch (error: any) {
      Alert.alert('Print Error', error?.message ?? 'Could not print session slip.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const current = await ensureSavedSession();
      if (!current) return;
      await shareSessionSlip(buildPs5SlipHtml(current), current.sessionCode);
    } catch (error: any) {
      Alert.alert('Share Error', error?.message ?? 'Could not share session slip.');
    } finally {
      setBusy(false);
    }
  };

  const handleNewSession = () => {
    resetFlow();
    navigation.navigate('GameTypeSelection');
  };

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>PS5 session details are missing.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('PS5Pricing')}>
          <Text style={styles.ctaButtonText}>Back to PS5 Packages</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
          <Text style={styles.bannerTitle}>PS5 Session Ready!</Text>
          <Text style={styles.bannerSub}>Your session has been saved. Print or share the slip below.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session {session.sessionCode}</Text>
          <Text style={styles.row}><Text style={styles.label}>Name:</Text> {session.playerContact.name}</Text>
          <Text style={styles.row}><Text style={styles.label}>Phone:</Text> {session.playerContact.phone}</Text>
          <Text style={styles.row}><Text style={styles.label}>Package:</Text> {session.selection.packageLabel}</Text>
          <Text style={styles.row}><Text style={styles.label}>Game Option:</Text> {session.selection.gameName}</Text>
          <Text style={styles.row}><Text style={styles.label}>Players:</Text> {session.selection.players}</Text>
          <Text style={styles.row}><Text style={styles.label}>Duration:</Text> {session.selection.hours} hour{session.selection.hours > 1 ? 's' : ''}</Text>
          <Text style={styles.row}><Text style={styles.label}>Strike Price:</Text> <Text style={styles.strike}>{formatRs(session.selection.originalPrice)}</Text></Text>
          <Text style={styles.row}><Text style={styles.label}>Offer Price:</Text> <Text style={styles.offer}>{formatRs(session.selection.discountedPrice)}</Text></Text>
          <Text style={styles.row}><Text style={styles.label}>Savings:</Text> <Text style={styles.save}>{formatRs(session.selection.savings)}</Text></Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, busy && styles.disabled]}
          onPress={handlePrint}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color={Colors.textOnPrimary} /> : <Text style={styles.footerButtonText}>Print</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, styles.shareButton, busy && styles.disabled]}
          onPress={handleShare}
          disabled={busy}
        >
          <Text style={styles.footerButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerButton, styles.newButton]} onPress={handleNewSession}>
          <Text style={styles.footerButtonText}>New Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 24,
    gap: 12,
  },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.base, textAlign: 'center' },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ctaButtonText: { color: Colors.textOnPrimary, fontWeight: Typography.bold },
  scroll: { padding: 20, gap: 16, paddingBottom: 100 },
  banner: { alignItems: 'center', gap: 8, marginBottom: 6 },
  bannerTitle: { color: Colors.textPrimary, fontSize: Typography['2xl'], fontWeight: Typography.bold },
  bannerSub: { color: Colors.textSecondary, fontSize: Typography.base, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardTitle: { color: Colors.primary, fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: 6 },
  row: { color: Colors.textPrimary, fontSize: Typography.base },
  label: { color: Colors.textSecondary, fontWeight: Typography.semibold },
  strike: { textDecorationLine: 'line-through', color: Colors.textMuted },
  offer: { color: Colors.warning, fontWeight: Typography.bold },
  save: { color: Colors.success, fontWeight: Typography.bold },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
  },
  shareButton: { backgroundColor: Colors.accent },
  newButton: { backgroundColor: Colors.warning },
  footerButtonText: { color: Colors.textOnPrimary, fontWeight: Typography.bold },
  disabled: { opacity: 0.55 },
});
