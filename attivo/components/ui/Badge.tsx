import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../constants/theme';

type BadgeVariant = 'lime' | 'gold' | 'silver' | 'muted' | 'error';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  lime:   { bg: colors.lime + '20',   text: colors.lime,   border: colors.lime },
  gold:   { bg: colors.gold + '20',   text: colors.gold,   border: colors.gold },
  silver: { bg: colors.silver + '20', text: colors.silver, border: colors.silver },
  muted:  { bg: colors.card,          text: colors.muted,  border: colors.border },
  error:  { bg: '#ff6b6b20',          text: '#ff6b6b',     border: '#ff6b6b' },
};

export function Badge({ label, variant = 'lime' }: BadgeProps) {
  const c = variantColors[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
      ]}
    >
      <Text style={[styles.text, { color: c.text }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    letterSpacing: 1,
  },
});
