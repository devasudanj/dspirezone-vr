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

import Colors from '../theme/colors';
import Typography from '../theme/typography';
import type { PS5SessionContactProps } from '../navigation/types';
import { usePS5SessionStore } from '../store/ps5SessionStore';

export default function PS5SessionContactScreen({ navigation }: PS5SessionContactProps) {
  const selectedPackage = usePS5SessionStore((s) => s.selectedPackage);
  const setPlayerContact = usePS5SessionStore((s) => s.setPlayerContact);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10;

  const handleContinue = async () => {
    if (!selectedPackage || !canSubmit) return;

    setSubmitting(true);
    try {
      setPlayerContact({
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
      });
      navigation.navigate('PS5SessionSummary');
    } catch (error: any) {
      Alert.alert('Unable to continue', error?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedPackage) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Please select a PS5 package first.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('PS5Pricing')}>
          <Text style={styles.backButtonText}>Back to PS5 Packages</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tell us who is playing</Text>
        <Text style={styles.subtitle}>We will attach these details to your PS5 session slip.</Text>

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

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Selected Package</Text>
            <Text style={styles.summaryText}>{selectedPackage.packageLabel}</Text>
            <Text style={styles.summaryMeta}>
              {selectedPackage.players} player{selectedPackage.players > 1 ? 's' : ''} • {selectedPackage.hours} hour{selectedPackage.hours > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryMeta}>Offer Price: Rs {selectedPackage.discountedPrice}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || submitting) && styles.submitDisabled]}
          onPress={handleContinue}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel="Continue to PS5 session summary"
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
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 28 },
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    marginBottom: 6,
  },
  summaryCard: {
    marginTop: 8,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  summaryTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginTop: 4,
  },
  summaryMeta: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.55 },
  submitText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.bold,
  },
});
