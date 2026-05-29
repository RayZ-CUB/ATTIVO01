import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, typography, radii } from '../../constants/theme';

interface AvatarProps {
  uri?: string;
  displayName: string;
  size?: number;
}

export function Avatar({ uri, displayName, size = 48 }: AvatarProps) {
  const initials = getInitials(displayName);
  const fontSize = size * 0.4;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontFamily: typography.fonts.heading,
    color: colors.white,
    letterSpacing: 1,
  },
});
