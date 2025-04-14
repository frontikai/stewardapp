import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Check if device has biometric hardware
export const checkBiometricHardware = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Error checking biometric hardware:', error);
    return false;
  }
};

// Check if biometrics are enrolled
export const checkBiometricEnrolled = async () => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
};

// Get available biometric types
export const getBiometricTypes = async () => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types;
  } catch (error) {
    console.error('Error getting biometric types:', error);
    return [];
  }
};

// Authenticate user with biometrics or PIN
export const authenticateUser = async () => {
  try {
    // Check stored security type
    const securityType = await AsyncStorage.getItem('securityType');
    
    if (securityType === 'biometric') {
      // Try biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Stewardship Keeper',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      return result.success;
    } else if (securityType === 'pin') {
      // For PIN authentication, we would typically show a custom PIN entry UI
      // Since we're using expo-local-authentication, we'll use device security
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enter your PIN to access Stewardship Keeper',
        fallbackLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      return result.success;
    }
    
    // If no security type is set, authentication is successful by default
    return true;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return false;
  }
};

// Set up PIN security
export const setupPinSecurity = async (pin) => {
  try {
    // In a real app, we would hash the PIN before storing
    // For this example, we'll just store the security type
    await AsyncStorage.setItem('securityType', 'pin');
    await AsyncStorage.setItem('securityEnabled', 'true');
    
    // Note: In a production app, you'd store the hashed PIN
    // await AsyncStorage.setItem('pinHash', hashedPin);
    
    return true;
  } catch (error) {
    console.error('Error setting up PIN security:', error);
    return false;
  }
};

// Set up biometric security
export const setupBiometricSecurity = async () => {
  try {
    // Check if device supports biometrics
    const hasBiometrics = await checkBiometricHardware();
    const enrolled = await checkBiometricEnrolled();
    
    if (!hasBiometrics || !enrolled) {
      Alert.alert(
        'Biometric Security Unavailable',
        'Your device does not support biometric authentication or no biometrics are enrolled.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    // Test biometric auth to make sure it works
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to set up biometric security',
      fallbackLabel: 'Use PIN instead',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    
    if (result.success) {
      await AsyncStorage.setItem('securityType', 'biometric');
      await AsyncStorage.setItem('securityEnabled', 'true');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error setting up biometric security:', error);
    return false;
  }
};

// Disable security
export const disableSecurity = async () => {
  try {
    await AsyncStorage.setItem('securityEnabled', 'false');
    await AsyncStorage.setItem('securityType', 'none');
    return true;
  } catch (error) {
    console.error('Error disabling security:', error);
    return false;
  }
};
