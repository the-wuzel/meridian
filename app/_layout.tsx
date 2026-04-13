import { initDatabase, seedTestData } from '@/services/database';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { SettingsProvider } from '@/context/SettingsContext';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDailyNotifications } from '@/hooks/useDailyNotifications';
import { useOnboarding } from '@/hooks/useOnboarding';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LockScreen } from '@/components/LockScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function NotificationSetup() {
  useDailyNotifications();
  return null;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { isLoading: isOnboardingLoading, hasViewedOnboarding } = useOnboarding();
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Bold.ttf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/Playfair_Display/static/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/Playfair_Display/static/PlayfairDisplay-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        await seedTestData();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && !isOnboardingLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, isOnboardingLoading, fontsLoaded]);

  if (!appIsReady || isOnboardingLoading || !fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
          <SettingsProvider>
            <RootLayoutContent hasViewedOnboarding={hasViewedOnboarding} />
          </SettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutContent({ hasViewedOnboarding }: { hasViewedOnboarding: boolean | null }) {
  const colorScheme = useColorScheme();
  const { isAppLockEnabled, isAppUnlocked, isLoading: isAuthLoading } = useAuth();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SnackbarProvider>
        <NotificationSetup />
        
        {/* Render main app logic only if it's unlocked OR app lock is disabled */}
        <View style={{ flex: 1, display: isAppUnlocked ? 'flex' : 'none' }}>
           <Stack screenOptions={{ headerShown: false }}>
             {hasViewedOnboarding ? (
               <>
                 <Stack.Screen name="(tabs)" />
                 <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
                 <Stack.Screen name="pin-setup" options={{ presentation: 'fullScreenModal', headerShown: false }} />
               </>
             ) : (
               <Stack.Screen name="(onboarding)" />
             )}
           </Stack>
        </View>

        {/* LockScreen Overlay */}
        {isAppLockEnabled && !isAppUnlocked && !isAuthLoading && (
            <LockScreen />
        )}

      </SnackbarProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={Colors[colorScheme ?? 'light'].background} />
    </ThemeProvider>
  );
}
