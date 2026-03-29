import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme, spacing } from '../../constants/theme';
import type { Gun } from '../../db/schema';

interface GunRowProps {
  gun: Gun;
  onPress: () => void;
}

export function GunRow({ gun, onPress }: GunRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.main}>
        <Text style={styles.makeModel} numberOfLines={1}>
          {gun.make} {gun.model}
        </Text>
        <Text style={styles.caliber} numberOfLines={1}>
          {gun.caliber}
        </Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.roundCount}>
          {(gun.roundCount || 0).toLocaleString()}
        </Text>
        <Text style={styles.label}>ROUNDS</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  makeModel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  caliber: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.textSecondary,
  },
  stats: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  roundCount: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 0.5,
    color: theme.textMuted,
    marginTop: 2,
  },
});
