import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.displayName?.toUpperCase()}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
          {user?.location && (
            <Text style={styles.location}>📍 {user.location}</Text>
          )}
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Profile details coming soon...</Text>
        </View>

        <Button
          label="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lime + '20',
    borderWidth: 2,
    borderColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.lime,
  },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.white,
    letterSpacing: 2,
  },
  roleBadge: {
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
  location: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  placeholder: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  signOutBtn: { marginTop: spacing.md },
});
