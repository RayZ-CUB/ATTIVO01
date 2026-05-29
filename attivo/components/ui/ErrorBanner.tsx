import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../constants/theme';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={20} color={colors.white} />
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={20} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.white,
    lineHeight: typography.sizes.sm * 1.4,
  },
});
