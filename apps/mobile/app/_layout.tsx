import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuthContext } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Auth guard — redirects based on authentication state
// ---------------------------------------------------------------------------

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in — redirect to welcome screen
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && (inAuthGroup || (!inAppGroup && segments.length === 0))) {
      // Logged in — redirect to app home
      router.replace('/(app)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AuthProvider>
  );
}
