import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { playerService } from '../../services/playerService';
import { coachService } from '../../services/coachService';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing, radii } from '../../constants/theme';
import type { UserRole, SkillLevel, PlayStyle } from '../../types';

type Step = 'role' | 'player-details' | 'coach-details';

export default function OnboardingScreen() {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player fields
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('both');

  // Coach fields
  const [speciality, setSpeciality] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [rateMin, setRateMin] = useState('');
  const [rateMax, setRateMax] = useState('');
  const [bio, setBio] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep(role === 'player' ? 'player-details' : 'coach-details');
  };

  const handlePlayerSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await playerService.createPlayer({
        userId: user.id,
        skillLevel,
        playStyle,
      });
      router.replace('/(tabs)/discover');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCoachSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await coachService.createCoach({
        userId: user.id,
        speciality,
        yearsExperience: parseInt(yearsExp, 10) || 0,
        rateMin: parseFloat(rateMin) || 0,
        rateMax: parseFloat(rateMax) || 0,
        bio,
      });
      router.replace('/(tabs)/discover');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>I AM A</Text>
          <Text style={styles.subtitle}>Choose your role to get started</Text>

          <View style={styles.roleCards}>
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelect('player')}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🎾</Text>
              <Text style={styles.roleTitle}>PLAYER</Text>
              <Text style={styles.roleDesc}>
                Find coaches, join events, connect with the community
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelect('coach')}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🏆</Text>
              <Text style={styles.roleTitle}>COACH</Text>
              <Text style={styles.roleDesc}>
                Offer lessons, manage sessions, grow your student base
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'player-details') {
    const skillLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'competitive'];
    const playStyles: PlayStyle[] = ['singles', 'doubles', 'both'];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>YOUR GAME</Text>
          <Text style={styles.subtitle}>Tell us about your tennis</Text>

          <Text style={styles.fieldLabel}>Skill Level</Text>
          <View style={styles.chipRow}>
            {skillLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, skillLevel === level && styles.chipActive]}
                onPress={() => setSkillLevel(level)}
              >
                <Text style={[styles.chipText, skillLevel === level && styles.chipTextActive]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Play Style</Text>
          <View style={styles.chipRow}>
            {playStyles.map((style) => (
              <TouchableOpacity
                key={style}
                style={[styles.chip, playStyle === style && styles.chipActive]}
                onPress={() => setPlayStyle(style)}
              >
                <Text style={[styles.chipText, playStyle === style && styles.chipTextActive]}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Let's Play"
            onPress={handlePlayerSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>YOUR COACHING</Text>
        <Text style={styles.subtitle}>Set up your coach profile</Text>

        <Input label="Speciality" value={speciality} onChangeText={setSpeciality} placeholder="e.g. Serve & Volley, Baseline" />
        <Input label="Years of Experience" value={yearsExp} onChangeText={setYearsExp} placeholder="5" keyboardType="numeric" />
        <Input label="Rate Min ($/hr)" value={rateMin} onChangeText={setRateMin} placeholder="50" keyboardType="numeric" />
        <Input label="Rate Max ($/hr)" value={rateMax} onChangeText={setRateMax} placeholder="100" keyboardType="numeric" />
        <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell players about yourself..." multiline numberOfLines={4} />

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.pendingNote}>
          Your profile will be reviewed before appearing in listings.
        </Text>

        <Button
          label="Submit for Review"
          onPress={handleCoachSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['3xl'],
    color: colors.lime,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  roleCards: { gap: spacing.md, marginTop: spacing.md },
  roleCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  roleEmoji: { fontSize: 40 },
  roleTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.white,
    letterSpacing: 2,
  },
  roleDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  fieldLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.lime, backgroundColor: colors.lime + '20' },
  chipText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  chipTextActive: { color: colors.lime },
  pendingNote: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  error: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  submitBtn: { marginTop: spacing.sm },
});
