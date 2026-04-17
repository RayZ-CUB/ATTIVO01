import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { setUser, setLoading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    // Restore session on app launch
    const restoreSession = async () => {
      setLoading(true);
      const user = await authService.getCurrentUser();
      setUser(user);
      setLoading(false);
    };

    restoreSession();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.black} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="coach/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="admin/index" />
      </Stack>
    </SafeAreaProvider>
  );
}
