import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="create-tontine" />
          <Stack.Screen name="create-tontine-step-2" />
          <Stack.Screen name="create-tontine-step-3" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/kyc" />
          <Stack.Screen name="auth/kyc-step-2" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/kyc-pending" />
          <Stack.Screen name="explore" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
