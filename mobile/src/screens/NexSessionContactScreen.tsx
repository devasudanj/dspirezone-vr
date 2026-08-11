/**
 * src/screens/NexSessionContactScreen.tsx
 * -------------------------------------
 * Collects the player's name and phone number before a Nex Playground session.
 * This data is posted to the same live session-contact endpoint used by VR.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useNexSessionStore } from '../store/nexSessionStore';
import { buildSessionContactPayload } from '../utils/sessionContact';
import type { NexSessionContactProps } from '../navigation/types';

const SESSION_CONTACT_URL = 'https://dspirezone-app-dev.azurewebsites.net/api/vr/session-contacts';

export default function NexSessionContactScreen({ navigation, route }: NexSessionContactProps) {
  const { gameId } = route.params;
  const selectedGame = useNexSessionStore((s) => s.selectedGame);
  const setPlayerContact = useNexSessionStore((s) => s.setPlayerContact);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10;

  const handleContinue = async () => {
    if (!selectedGame || !canSubmit) return;

    setSubmitting(true);
    try {
      const payload = buildSessionContactPayload({
        name,
        phone,
        selectedGameName: selectedGame.name,
        selectedGameId: selectedGame.id,
        stationName: 'NEX-01',
        source: 'nex-playground',
      });

      await axios.post(SESSION_CONTACT_URL, payload, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: 8000,
      });

      setPlayerContact({ name: payload.name, phone: payload.phone_number });
      navigation.navigate('NexPlaygroundTimeSelection', { gameId });
    } catch (error: any) {
      const message = error?.response?.data?.detail ?? error?.message ?? 'Unable to save your details right now.';
      Alert.alert('Unable to continue', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="person-circle-outline" size={34} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Tell us who is playing</Text>
          <Text style={styles.subtitle}>
            We’ll save your contact details for this Nex session before you begin.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            autoCorrect={false}
            style={styles.input}
            maxLength={15}
          />

          <View style={styles.gameSummary}>
            <Text style={styles.gameSummaryLabel}>Selected Game</Text>
            <Text style={styles.gameSummaryText}>{selectedGame?.name ?? 'Game'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || submitting) && styles.submitDisabled]}
          onPress={handleContinue}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel="Continue to Nex session duration selection"
        >
          {submitting ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.submitText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  gameSummary: {
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 14,
    marginTop: 8,
  },
  gameSummaryLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  gameSummaryText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginTop: 6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
});
