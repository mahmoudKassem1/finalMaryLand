import { Stack } from 'expo-router';
import Colors from '../../src/constants/Colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign In' }} />
      <Stack.Screen name="register" options={{ title: 'Create Account' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
    </Stack>
  );
}
