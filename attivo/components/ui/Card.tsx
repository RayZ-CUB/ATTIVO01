import { StyleSheet, ViewStyle } from 'react-native';
import { Surface } from 'react-native-paper';
import { colors, radii, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return (
    <Surface style={[styles.card, style]} elevation={0}>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    ...shadows.card,
  },
});
