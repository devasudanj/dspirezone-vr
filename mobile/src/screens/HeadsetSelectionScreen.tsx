/**
 * src/screens/HeadsetSelectionScreen.tsx
 * ----------------------------------------
 * Displays all non-expired headsets on which the selected game is installed.
 * Shows visual status (ACTIVE / EXPIRING SOON). Expired installs are excluded.
 *
 * On selection → TimeSelectionScreen
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fetchGameInstallations } from '../api/games';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useSessionStore } from '../store/sessionStore';
import type { Installation } from '../types';
import type { HeadsetSelectionProps } from '../navigation/types';

function statusIcon(status: Installation['installation_status']) {
  if (status === 'ACTIVE') return { icon: 'checkmark-circle', color: Colors.success };
  if (status === 'EXPIRING_SOON') return { icon: 'warning', color: Colors.warning };
  return { icon: 'close-circle', color: Colors.danger };
}

export default function HeadsetSelectionScreen({ route, navigation }: HeadsetSelectionProps) {
  const { gameId } = route.params;
  const selectedGame = useSessionStore((s) => s.selectedGame);
  const setSelectedInstallation = useSessionStore((s) => s.setSelectedInstallation);

  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // active_only=true – server filters expired; we still show EXPIRING_SOON
        const data = await fetchGameInstallations(gameId, true);
        if (!cancelled) setInstallations(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load headsets');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  const handleSelect = (inst: Installation) => {
    setSelectedInstallation(inst);
    navigation.navigate('TimeSelection', { gameId, installation: inst });
  };

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header hint */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>
          🎮 {selectedGame?.name ?? 'Game'}
        </Text>
        <Text style={styles.headerSub}>
          Select a headset to play on
        </Text>
      </View>

      {installations.length === 0 ? (
        <View style={styles.centred}>
          <Ionicons name="warning" size={48} color={Colors.warning} />
          <Text style={styles.emptyText}>
            No available headsets for this game.
          </Text>
          <Text style={styles.emptySubText}>
            All installations may have expired or no headset is assigned.
          </Text>
        </View>
      ) : (
        <FlatList
          data={installations}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const { icon, color } = statusIcon(item.installation_status);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={`Select headset ${item.headset_code}`}
              >
                {/* Headset code – large for easy tap targeting */}
                <Text style={styles.headsetCode}>{item.headset_code}</Text>
                <Text style={styles.headsetModel}>{item.headset_model}</Text>

                {/* Status badge */}
                <View style={[styles.statusBadge, { borderColor: color }]}>
                  <Ionicons name={icon as any} size={16} color={color} />
                  <Text style={[styles.statusText, { color }]}>
                    {item.installation_status === 'EXPIRING_SOON'
                      ? 'Expiring Soon'
                      : item.installation_status === 'ACTIVE'
                      ? 'Active'
                      : 'Expired'}
                  </Text>
                </View>

                <Text style={styles.expiryText}>
                  Expires: {item.expiry_date}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  headerBanner: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    marginTop: 2,
  },

  grid: { padding: 20, gap: 16 },
  row: { gap: 16, justifyContent: 'flex-start' },

  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  headsetCode: {
    color: Colors.accent,
    fontSize: Typography['3xl'],
    fontWeight: Typography.extrabold,
    letterSpacing: 2,
  },
  headsetModel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  expiryText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },

  errorText: { color: Colors.danger, fontSize: Typography.base, textAlign: 'center', paddingHorizontal: 32 },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.lg, textAlign: 'center', marginTop: 16 },
  emptySubText: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center', paddingHorizontal: 40 },
});
