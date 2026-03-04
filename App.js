import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import { AppContextProvider, AppContext } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { theme, darkTheme, getTheme } from './src/theme/theme';
import { initDatabase } from './src/database/Database';
import { registerForPushNotifications } from './src/utils/notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Inner component that has access to AppContext
const AppContent = ({ hasOnboarded, onOnboardingComplete, onReady }) => {
  const colorScheme = useColorScheme();
  const { settings } = useContext(AppContext);
  
  const activeTheme = getTheme(colorScheme, settings.themeSetting);
  const statusBarStyle = settings.themeSetting === 'dark' || 
    (settings.themeSetting === 'auto' && colorScheme === 'dark') 
    ? 'light' : 'dark';

  return (
    <PaperProvider theme={activeTheme}>
      <NavigationContainer 
        onReady={onReady}
        theme={{
          dark: activeTheme === darkTheme,
          colors: {
            primary: activeTheme.colors.primary,
            background: activeTheme.colors.background,
            card: activeTheme.colors.surface,
            text: activeTheme.colors.text || activeTheme.colors.onSurface,
            border: activeTheme.colors.disabled,
            notification: activeTheme.colors.error,
          },
        }}
      >
        <StatusBar style={statusBarStyle} />
        <AppNavigator 
          hasOnboarded={hasOnboarded} 
          onOnboardingComplete={onOnboardingComplete}
        />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize the database
        await initDatabase();
        
        // Check if user has completed onboarding
        const onboardingStatus = await AsyncStorage.getItem('hasOnboarded');
        setHasOnboarded(onboardingStatus === 'true');
        
        // Register for push notifications
        await registerForPushNotifications();
      } catch (e) {
        if (__DEV__) {
          console.warn('App initialization error:', e);
        }
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AppContextProvider>
        <AppContent 
          hasOnboarded={hasOnboarded}
          onOnboardingComplete={() => setHasOnboarded(true)}
          onReady={onLayoutRootView}
        />
      </AppContextProvider>
    </ErrorBoundary>
  );
}
