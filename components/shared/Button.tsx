import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/theme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ onPress, title, variant = 'secondary', disabled, loading }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        isPrimary && styles.buttonPrimary,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? theme.bg : theme.textPrimary} />
      ) : (
        <Text style={[styles.text, isPrimary && styles.textPrimary]}>
          {title.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility
  },
  buttonPrimary: {
    backgroundColor: theme.textPrimary,
    borderColor: theme.textPrimary,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.8,
    color: theme.textPrimary,
  },
  textPrimary: {
    color: theme.bg,
  },
});
