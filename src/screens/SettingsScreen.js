import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  List, 
  Divider, 
  Switch, 
  TextInput, 
  Button, 
  useTheme,
  Text,
  Portal,
  Dialog,
  RadioButton
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';

import { AppContext } from '../context/AppContext';
import { updateSetting } from '../database/Database';
import { currencies } from '../utils/currencies';
import { scheduleNotification, cancelAllNotifications } from '../utils/notifications';

const SettingsScreen = () => {
  const theme = useTheme();
  const { settings, updateSettings } = useContext(AppContext);
  
  const [tithePercentage, setTithePercentage] = useState(settings.tithePercentage || '10');
  const [incomeTrackingEnabled, setIncomeTrackingEnabled] = useState(settings.incomeTrackingEnabled === 'true');
  const [securityEnabled, setSecurityEnabled] = useState(settings.securityEnabled === 'true');
  const [securityType, setSecurityType] = useState(settings.securityType || 'none');
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled === 'true');
  const [currency, setCurrency] = useState(settings.currency || 'USD');
  
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  
  // Check if device has biometric capabilities
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);
    })();
  }, []);
  
  const saveSettings = async () => {
    try {
      // Save tithe percentage
      if (tithePercentage !== settings.tithePercentage) {
        await updateSetting('tithePercentage', tithePercentage);
      }
      
      // Save income tracking
      if (incomeTrackingEnabled !== (settings.incomeTrackingEnabled === 'true')) {
        await updateSetting('incomeTrackingEnabled', incomeTrackingEnabled ? 'true' : 'false');
      }
      
      // Save security settings
      if (securityEnabled !== (settings.securityEnabled === 'true')) {
        await updateSetting('securityEnabled', securityEnabled ? 'true' : 'false');
      }
      
      if (securityType !== settings.securityType) {
        await updateSetting('securityType', securityType);
      }
      
      // Save notification settings
      if (notificationsEnabled !== (settings.notificationsEnabled === 'true')) {
        await updateSetting('notificationsEnabled', notificationsEnabled ? 'true' : 'false');
        
        if (notificationsEnabled) {
          // Schedule a sample notification
          await scheduleNotification(
            'Giving Reminder',
            'Remember to record your donations this week.',
            { weekday: 1 } // Monday
          );
        } else {
          // Cancel all notifications
          await cancelAllNotifications();
        }
      }
      
      // Save currency
      if (currency !== settings.currency) {
        await updateSetting('currency', currency);
      }
      
      // Update the context
      updateSettings({
        tithePercentage,
        incomeTrackingEnabled: incomeTrackingEnabled ? 'true' : 'false',
        securityEnabled: securityEnabled ? 'true' : 'false',
        securityType,
        notificationsEnabled: notificationsEnabled ? 'true' : 'false',
        currency
      });
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };
  
  const handleSecurityChange = async (value) => {
    if (value && securityType === 'none') {
      // When enabling security, show the dialog to select security type
      setShowSecurityDialog(true);
    } else {
      setSecurityEnabled(value);
    }
  };
  
  const confirmSecurityType = async () => {
    setSecurityEnabled(true);
    setShowSecurityDialog(false);
    
    if (securityType === 'biometric') {
      // Test biometric auth
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to setup biometric security',
          fallbackLabel: 'Use passcode'
        });
        
        if (!result.success) {
          // If biometric auth fails, default to PIN
          setSecurityType('pin');
          Alert.alert('Biometric Authentication Failed', 'PIN security will be used instead.');
        }
      } catch (error) {
        console.error('Biometric error:', error);
        setSecurityType('pin');
        Alert.alert('Biometric Setup Error', 'PIN security will be used instead.');
      }
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Donation Settings</List.Subheader>
        
        <List.Item
          title="Tithe Percentage"
          description="Set your default tithe percentage"
          left={props => <List.Icon {...props} icon="percent" />}
          right={() => (
            <TextInput
              style={styles.percentageInput}
              keyboardType="numeric"
              value={tithePercentage}
              onChangeText={text => {
                // Ensure it's a valid percentage
                const value = parseFloat(text);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                  setTithePercentage(text);
                }
              }}
              maxLength={5}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Income Tracking"
          description="Track income to calculate tithes"
          left={props => <List.Icon {...props} icon="calculator" />}
          right={() => (
            <Switch
              value={incomeTrackingEnabled}
              onValueChange={setIncomeTrackingEnabled}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Currency"
          description={`Current: ${currencies.find(c => c.code === currency)?.name || currency}`}
          left={props => <List.Icon {...props} icon="currency-usd" />}
          onPress={() => setShowCurrencyDialog(true)}
        />
      </List.Section>
      
      <List.Section>
        <List.Subheader>App Settings</List.Subheader>
        
        <List.Item
          title="App Security"
          description={securityEnabled ? `Enabled (${securityType === 'biometric' ? 'Biometric' : 'PIN'})` : "Disabled"}
          left={props => <List.Icon {...props} icon="shield" />}
          right={() => (
            <Switch
              value={securityEnabled}
              onValueChange={handleSecurityChange}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Notifications"
          description="Enable giving reminders"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="About"
          description="Stewardship Keeper v1.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
      </List.Section>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={saveSettings}
          style={styles.saveButton}
        >
          Save Settings
        </Button>
      </View>
      
      <Portal>
        <Dialog
          visible={showCurrencyDialog}
          onDismiss={() => setShowCurrencyDialog(false)}
        >
          <Dialog.Title>Select Currency</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                onValueChange={value => {
                  setCurrency(value);
                  setShowCurrencyDialog(false);
                }}
                value={currency}
              >
                {currencies.map(curr => (
                  <RadioButton.Item 
                    key={curr.code}
                    label={`${curr.code} - ${curr.name} (${curr.symbol})`}
                    value={curr.code}
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCurrencyDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog
          visible={showSecurityDialog}
          onDismiss={() => setShowSecurityDialog(false)}
        >
          <Dialog.Title>Security Type</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={value => setSecurityType(value)}
              value={securityType}
            >
              {hasBiometrics && (
                <RadioButton.Item 
                  label="Biometric Authentication"
                  value="biometric"
                />
              )}
              <RadioButton.Item 
                label="PIN Code"
                value="pin"
              />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSecurityDialog(false)}>Cancel</Button>
            <Button onPress={confirmSecurityType} mode="contained">Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  percentageInput: {
    width: 70,
    height: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 32,
  },
  saveButton: {
    paddingVertical: 6,
  },
  dialogScrollArea: {
    maxHeight: 300,
  },
});

export default SettingsScreen;
