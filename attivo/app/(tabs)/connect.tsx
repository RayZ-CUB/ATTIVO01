import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../constants/theme';

export default function ConnectScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>CONNECT</Text>
        <Text style={styles.subtitle}>Find your perfect coach</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Coach listings coming soon...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  scroll: { padding: spacing.lg, gap: spacing.md },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['3xl'],
    color: colors.white,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.muted,
  },
  placeholder: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  placeholderText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
});
