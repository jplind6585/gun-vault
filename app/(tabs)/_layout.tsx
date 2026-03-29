import { Tabs } from 'expo-router';
import { theme } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: {
          fontFamily: 'monospace',
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Vault',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="arsenal"
        options={{
          title: 'Arsenal',
        }}
      />
      <Tabs.Screen
        name="reloading"
        options={{
          title: 'Reloading',
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
        }}
      />
    </Tabs>
  );
}
