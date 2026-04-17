import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing, radii } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.black : colors.lime}
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Variants
  primary: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.lime,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  // Sizes
  size_sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  size_md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  size_lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  // States
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  // Labels
  label: {
    fontFamily: typography.fonts.heading,
    letterSpacing: 1.5,
  },
  label_primary: { color: colors.black },
  label_outline: { color: colors.lime },
  label_ghost: { color: colors.muted },
  labelSize_sm: { fontSize: typography.sizes.xs },
  labelSize_md: { fontSize: typography.sizes.base },
  labelSize_lg: { fontSize: typography.sizes.md },
});
