/**
 * src/components/InstallationRow.tsx
 * ------------------------------------
 * A single row in the GameDetailScreen's installation list.
 * Displays headset code, dates, and a coloured status indicator.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import type { Installation } from '../types';

interface Props {
  installation: Installation;
}

const STATUS_CONFIG = {
  ACTIVE: {
    icon: 'checkmark-circle' as const,
    color: Colors.success,
    label: 'Active',
  },
  EXPIRING_SOON: {
    icon: 'warning' as const,
    color: Colors.warning,
    label: 'Expiring Soon',
  },
  EXPIRED: {
    icon: 'close-circle' as const,
    color: Colors.danger,
    label: 'Expired',
  },
};

export default function InstallationRow({ installation }: Props) {
  const config = STATUS_CONFIG[installation.installation_status];

  return (
    <View style={styles.container}>
      {/* Left: headset code */}
      <View style={styles.left}>
        <Text style={styles.code}>{installation.headset_code}</Text>
        <Text style={styles.model}>{installation.headset_model}</Text>
      </View>

      {/* Centre: dates */}
      <View style={styles.dates}>
        <Text style={styles.dateLabel}>Installed</Text>
        <Text style={styles.dateValue}>{installation.install_date}</Text>
        <Text style={styles.dateLabel}>Expires</Text>
        <Text style={styles.dateValue}>{installation.expiry_date}</Text>
      </View>

      {/* Right: status */}
      <View style={[styles.status, { borderColor: config.color }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
        <Text style={[styles.statusLabel, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  left: {
    minWidth: 60,
    gap: 2,
  },
  code: {
    color: Colors.accent,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  model: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  dates: {
    flex: 1,
    gap: 2,
  },
  dateLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  dateValue: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
});
