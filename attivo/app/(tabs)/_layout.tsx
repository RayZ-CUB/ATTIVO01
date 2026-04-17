import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors, typography } from '../../constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: typography.fonts.heading,
        fontSize: 9,
        color: focused ? colors.lime : colors.muted,
        letterSpacing: 1,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.heading,
          fontSize: 9,
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'DISCOVER',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🏠' : '🏠'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: 'CONNECT',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🎾' : '🎾'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'COMMUNITY',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '👥' : '👥'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '👤' : '👤'}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
