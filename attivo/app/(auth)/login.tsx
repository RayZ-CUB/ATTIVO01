import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing } from '../../constants/theme';

export default function LoginScreen() {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { user, error: authError } = await authService.signUp(
          email,
          password,
          displayName
        );
        if (authError) {
          setError(authError);
        } else if (user) {
          setUser(user);
          router.replace('/(auth)/onboarding');
        }
      } else {
        const { user, error: authError } = await authService.signIn(
          email,
          password
        );
        if (authError) {
          setError(authError);
        } else if (user) {
          setUser(user);
          if (user.role) {
            router.replace('/(tabs)/discover');
          } else {
            router.replace('/(auth)/onboarding');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <Text style={styles.logo}>ATTIVO</Text>
            <Text style={styles.tagline}>Your tennis community</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <Input
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                autoCapitalize="words"
              />
            )}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Button
              label={isSignUp ? 'Create Account' : 'Sign In'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />

            <Button
              label={
                isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"
              }
              onPress={() => {
                setError(null);
                setIsSignUp(!isSignUp);
              }}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['4xl'],
    color: colors.lime,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
