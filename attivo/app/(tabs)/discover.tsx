import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing } from '../../constants/theme';

export default function DiscoverScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.greeting}>
            WELCOME BACK,
          </Text>
          <Text style={styles.name}>
            {user?.displayName?.toUpperCase() || 'PLAYER'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role?.toUpperCase() || 'PLAYER'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FEATURED EVENTS</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Events loading soon...</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMUNITY HIGHLIGHTS</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Feed loading soon...</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  hero: { gap: spacing.sm },
  greeting: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    letterSpacing: 2,
  },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['3xl'],
    color: colors.white,
    letterSpacing: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lime + '20',
    borderWidth: 1,
    borderColor: colors.lime,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.lime,
    letterSpacing: 1,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.white,
    letterSpacing: 2,
  },
  placeholder: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
});
