import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppThemeProvider, useAppTheme } from '~/components/theme/AppThemeContext';
import { AuthProvider, useAuth } from '~/contexts/AuthContext';
import { NotificationsProvider } from '~/contexts/NotificationsContext';
import { getRoleLayout } from '~/types';

export const unstable_settings = { anchor: '(tech)' };

function NavigationWithTheme() {
  const { mode } = useAppTheme();
  const { isLoading, isAuthenticated, role } = useAuth();
  const router = useRouter();

  const layout = getRoleLayout(role);

  // Fires when auth state resolves (initial load) or changes (login/logout)
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login' as any);
    } else if (layout === 'tech') {
      router.replace('/(tech)' as any);
    }
  }, [isLoading, isAuthenticated, layout, router]);

  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tech)"    options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"    options={{ headerShown: false }} />

        <Stack.Screen name="jobs"                         options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]"                    options={{ headerShown: false }} />
        <Stack.Screen name="notifications"                options={{ headerShown: false }} />
        <Stack.Screen name="need-action"                  options={{ headerShown: false }} />
        <Stack.Screen name="my-schedule"                  options={{ headerShown: false }} />
        <Stack.Screen name="support/[deptId]"             options={{ headerShown: false }} />
        <Stack.Screen name="support/ticket/[ticketId]"    options={{ headerShown: false }} />
        <Stack.Screen name="auth/login"                   options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>

      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <NavigationWithTheme />
        </NotificationsProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
