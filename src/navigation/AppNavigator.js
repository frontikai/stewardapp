import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, IconButton, Text, Button } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import HomeScreen from '../screens/HomeScreen';
import GivingScreen from '../screens/GivingScreen';
import IncomeScreen from '../screens/IncomeScreen';
import ReportsScreen from '../screens/ReportsScreen';
import RecipientsScreen from '../screens/RecipientsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Utils
import { authenticateUser } from '../utils/authentication';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Settings stack navigator
const SettingsStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="SettingsMain" 
      component={SettingsScreen} 
      options={{
        title: 'Settings',
      }}
    />
    <Stack.Screen 
      name="Recipients" 
      component={RecipientsScreen} 
      options={{
        title: 'Recipients',
      }}
    />
  </Stack.Navigator>
);

// Main tab navigator
const MainTabNavigator = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Giving') {
            iconName = 'heart';
          } else if (route.name === 'Income') {
            iconName = 'dollar-sign';
          } else if (route.name === 'Reports') {
            iconName = 'bar-chart-2';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Stewardship Keeper',
        }}
      />
      <Tab.Screen 
        name="Giving" 
        component={GivingScreen} 
        options={{
          title: 'Giving',
        }}
      />
      <Tab.Screen 
        name="Income" 
        component={IncomeScreen} 
        options={{
          title: 'Income',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{
          title: 'Reports',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStackNavigator} 
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

// Auth screen (shown when app is locked)
const AuthScreen = ({ navigation }) => {
  const handleAuth = async () => {
    const result = await authenticateUser();
    if (result) {
      // Navigate to main app after authentication
      navigation.replace('Main');
    }
  };
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 24 }}>App Locked</Text>
      <Button mode="contained" onPress={handleAuth}>
        Authenticate to Unlock
      </Button>
    </View>
  );
};

// Root navigator
const AppNavigator = ({ hasOnboarded }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [securityEnabled, setSecurityEnabled] = useState(false);
  
  useEffect(() => {
    // Check if security is enabled
    const checkSecurity = async () => {
      try {
        const securityEnabledValue = await AsyncStorage.getItem('securityEnabled');
        const securityEnabled = securityEnabledValue === 'true';
        setSecurityEnabled(securityEnabled);
        
        if (securityEnabled) {
          setIsAuthenticated(false);
          
          // Try to authenticate on startup
          const authResult = await authenticateUser();
          setIsAuthenticated(authResult);
        }
      } catch (error) {
        console.error('Error checking security settings:', error);
      }
    };
    
    checkSecurity();
  }, []);
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasOnboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : securityEnabled && !isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
