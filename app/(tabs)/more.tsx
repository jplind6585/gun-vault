import { View, Text, StyleSheet } from 'react-native';
import { theme, spacing } from '../../constants/theme';

export default function More() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>More - Coming Soon</Text>
      <Text style={styles.subtext}>
        Caliber database, target analysis, gunsmithing, and more
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
