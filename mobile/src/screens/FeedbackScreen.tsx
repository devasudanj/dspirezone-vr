/**
 * src/screens/FeedbackScreen.tsx
 * --------------------------------
 * Allows users to suggest a new VR game or experience they'd like to see.
 * Submissions are stored in the backend feedback table.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

import { submitFeedback } from '../api/feedback';
import Colors from '../theme/colors';
import Typography from '../theme/typography';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function FeedbackScreen() {
  const [gameTitle, setGameTitle] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = gameTitle.trim().length > 0 && submitState !== 'loading';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitState('loading');
    setErrorMsg('');
    try {
      await submitFeedback(gameTitle.trim());
      setSubmitState('success');
      setGameTitle('');
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail ?? e.message ?? 'Something went wrong. Please try again.');
      setSubmitState('error');
    }
  };

  const handleReset = () => {
    setSubmitState('idle');
    setErrorMsg('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header icon + title */}
        <View style={styles.headerBlock}>
          <View style={styles.iconWrap}>
            <Ionicons name="game-controller" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.heading}>Suggest a Game</Text>
          <Text style={styles.subheading}>
            Can't find a game you love? Let us know and we'll do our best to add it to the VR lineup!
          </Text>
        </View>

        {submitState === 'success' ? (
          /* Success state */
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={52} color={Colors.success} />
            <Text style={styles.successTitle}>Request Received!</Text>
            <Text style={styles.successBody}>
              Thanks for your suggestion. Our team will review it and consider adding it to the VR library.
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Suggest Another Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Form state */
          <View style={styles.card}>
            <Text style={styles.label}>Title of Game / App</Text>
            <TextInput
              style={styles.input}
              value={gameTitle}
              onChangeText={setGameTitle}
              placeholder="e.g. Superhot VR, Pistol Whip…"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={submitState !== 'loading'}
              maxLength={300}
            />
            <Text style={styles.charCount}>{gameTitle.length}/300</Text>

            {submitState === 'error' && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Submit game suggestion"
            >
              {submitState === 'loading' ? (
                <ActivityIndicator color={Colors.textOnPrimary} />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color={Colors.textOnPrimary} />
                  <Text style={styles.submitText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Requests are reviewed by our team. Availability depends on licensing and hardware compatibility.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 480,
  },

  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },

  label: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'right',
    marginTop: -4,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.sm,
    flex: 1,
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  submitDisabled: {
    backgroundColor: Colors.disabled,
  },
  submitText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },

  note: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },

  // Success state
  successCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: 'center',
    gap: 14,
  },
  successTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  successBody: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 6,
  },
  resetButtonText: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
