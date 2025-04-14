import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import { AppContextProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';
import { initDatabase } from './src/database/Database';
import { registerForPushNotifications } from './src/utils/notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
        
        // Load fonts or other assets
        await Font.loadAsync({
          'Roboto-Regular': require('expo-font/build/Roboto/Roboto.ttf'),
          'Roboto-Medium': require('expo-font/build/Roboto/Roboto_medium.ttf'),
        });
      } catch (e) {
        console.warn(e);
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
    <AppContextProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer onReady={onLayoutRootView}>
          <StatusBar style="auto" />
          <AppNavigator hasOnboarded={hasOnboarded} />
        </NavigationContainer>
      </PaperProvider>
    </AppContextProvider>
  );
}
