import { Stack } from 'expo-router';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: {
          fontFamily: 'monospace',
          letterSpacing: 1,
        },
        contentStyle: {
          backgroundColor: theme.bg,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add-gun"
        options={{
          title: 'Add Firearm',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
