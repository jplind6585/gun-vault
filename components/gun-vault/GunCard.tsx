import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme, spacing } from '../../constants/theme';
import type { Gun } from '../../db/schema';

interface GunCardProps {
  gun: Gun;
  onPress: () => void;
}

export function GunCard({ gun, onPress }: GunCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image placeholder */}
      <View style={styles.imageContainer}>
        {gun.imageUrl ? (
          <Image source={{ uri: gun.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              {gun.type.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.makeModel} numberOfLines={1}>
          {gun.make} {gun.model}
        </Text>
        <Text style={styles.caliber} numberOfLines={1}>
          {gun.caliber}
        </Text>

        {/* Round count badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {(gun.roundCount || 0).toLocaleString()} RDS
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: theme.bg,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceAlt,
  },
  imagePlaceholderText: {
    fontFamily: 'monospace',
    fontSize: 48,
    color: theme.textMuted,
    opacity: 0.3,
  },
  info: {
    padding: spacing.md,
  },
  makeModel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  caliber: {
    fontSize: 14,
    color: theme.caliberRed,
    marginBottom: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 0.5,
    color: theme.textSecondary,
  },
});
