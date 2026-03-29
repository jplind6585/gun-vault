import { View, Text, StyleSheet } from 'react-native';
import { theme, spacing } from '../../constants/theme';

export default function Reloading() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PRO</Text>
      </View>
      <Text style={styles.text}>Reloading Bench - Pro Feature</Text>
      <Text style={styles.subtext}>
        Handload management, batch tracking, and component inventory
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
    paddingHorizontal: spacing.xl,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 3,
    backgroundColor: theme.accentDim,
    borderWidth: 0.5,
    borderColor: theme.accent,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.accent,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 0.8,
    color: theme.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  subtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
