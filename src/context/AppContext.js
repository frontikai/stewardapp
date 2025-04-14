import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllSettings } from '../database/Database';

// Create the context
export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    currency: 'USD',
    tithePercentage: '10',
    incomeTrackingEnabled: 'true',
    notificationsEnabled: 'true',
    themeSetting: 'auto',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Load settings from the database when the component mounts
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Get all settings from the database
      const dbSettings = await getAllSettings();
      
      // Convert the array of settings objects to a single object
      const settingsObj = {};
      if (dbSettings && dbSettings.length > 0) {
        dbSettings.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        
        // Update state with the loaded settings
        setSettings(prev => ({
          ...prev,
          ...settingsObj,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update settings
  const updateSettings = async (newSettings) => {
    try {
      setSettings(prev => ({
        ...prev,
        ...newSettings,
      }));
    } catch (error) {
      console.error('Error updating settings in context:', error);
    }
  };
  
  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};