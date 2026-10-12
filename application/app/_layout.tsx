// app/_layout.tsx
import { useEffect, useState, useContext, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { LanguageProvider, LanguageContext } from '../src/context/LanguageContext';
import { Colors } from '../src/constants/Colors';
import AnimatedSplashScreen from '../src/components/AnimatedSplashScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const [appReady, setAppReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { isLoadingLanguage, t } = useContext(LanguageContext);
  const router = useRouter();
  const segments = useSegments();
  
  const initialRoutingDone = useRef(false);

  useEffect(() => {
    async function prepare() {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem('has_completed_onboarding');
        setIsFirstLaunch(hasCompletedOnboarding !== 'true');
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  // Hide the OS-level native splash screen once our code and language files are ready
  useEffect(() => {
    if (appReady && !isLoadingLanguage) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady, isLoadingLanguage]);

  // Handle routing BEHIND the splash screen immediately when appReady is true
  useEffect(() => {
    if (appReady && !isLoadingLanguage && isFirstLaunch !== null && !initialRoutingDone.current) {
      initialRoutingDone.current = true;
      
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      
      if (isFirstLaunch) {
        router.replace('/initial-language');
      } else if (!inTabsGroup && !inAuthGroup && segments[0] !== 'initial-language') {
        router.replace('/(tabs)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReady, isLoadingLanguage, isFirstLaunch]);

  // While raw data is loading, show nothing (the native OS splash is still visible here)
  if (!appReady || isLoadingLanguage) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 1. The Stack renders underneath and handles navigation quietly in the background */}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.ink,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.pageBase },
        }}
      >
        <Stack.Screen name="initial-language" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ title: t('product.details'), headerTintColor: Colors.primary }}
        />
        <Stack.Screen
          name="checkout"
          options={{ title: t('cart.orderInquiry'), headerTintColor: Colors.primary }}
        />
        <Stack.Screen name="contact-us" options={{ headerShown: false }} />
      </Stack>

      {/* 2. The Custom Splash Screen overlays the app until the animation finishes */}
      {!splashFinished && (
        <View style={styles.splashOverlay}>
          <AnimatedSplashScreen
            onAnimationComplete={() => setSplashFinished(true)}
          />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <RootNavigation />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999, // Guarantees the splash screen covers the navigation stack completely
  },
});