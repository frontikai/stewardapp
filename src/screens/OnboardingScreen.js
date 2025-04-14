import React, { useState, useRef, useContext } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Image, 
  Animated, 
  ScrollView 
} from 'react-native';
import { 
  Text, 
  Button, 
  useTheme, 
  Switch, 
  Surface 
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

import { AppContext } from '../context/AppContext';
import { updateSetting } from '../database/Database';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const theme = useTheme();
  const { updateSettings } = useContext(AppContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [incomeTrackingEnabled, setIncomeTrackingEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const scrollViewRef = useRef(null);
  
  const pages = [
    {
      title: 'Welcome to Stewardship Keeper',
      description: 'Your companion for managing tithes and offerings with simplicity and grace.',
      icon: 'heart',
    },
    {
      title: 'Track Your Giving',
      description: 'Keep a record of all your donations and see your generosity at a glance.',
      icon: 'gift',
    },
    {
      title: 'Income Tracking',
      description: 'Would you like to track your income to calculate tithes?',
      icon: 'dollar-sign',
      setting: (
        <View style={styles.settingContainer}>
          <Text>Enable Income Tracking</Text>
          <Switch
            value={incomeTrackingEnabled}
            onValueChange={setIncomeTrackingEnabled}
            color={theme.colors.primary}
          />
        </View>
      ),
    },
    {
      title: 'Reminders',
      description: 'Get gentle reminders to help you stay consistent in your giving.',
      icon: 'bell',
      setting: (
        <View style={styles.settingContainer}>
          <Text>Enable Giving Reminders</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            color={theme.colors.primary}
          />
        </View>
      ),
    },
    {
      title: 'All Set!',
      description: 'You\'re ready to begin your stewardship journey. May your giving be blessed!',
      icon: 'check-circle',
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      scrollViewRef.current.scrollTo({
        x: width * (currentPage + 1),
        animated: true,
      });
      setCurrentPage(currentPage + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      scrollViewRef.current.scrollTo({
        x: width * (currentPage - 1),
        animated: true,
      });
      setCurrentPage(currentPage - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save user preferences
      await updateSetting('incomeTrackingEnabled', incomeTrackingEnabled ? 'true' : 'false');
      await updateSetting('notificationsEnabled', notificationsEnabled ? 'true' : 'false');
      
      // Update the context
      updateSettings({
        incomeTrackingEnabled: incomeTrackingEnabled ? 'true' : 'false',
        notificationsEnabled: notificationsEnabled ? 'true' : 'false',
      });
      
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasOnboarded', 'true');
      
      // Navigate to the main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {pages.map((page, index) => (
          <View key={index} style={[styles.page, { width }]}>
            <Surface style={styles.iconContainer}>
              <Feather 
                name={page.icon} 
                size={80} 
                color={theme.colors.primary} 
              />
            </Surface>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
            {page.setting && (
              <View style={styles.settingWrapper}>
                {page.setting}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.paginationContainer}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: index === currentPage ? theme.colors.primary : theme.colors.backdrop }
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonsContainer}>
        {currentPage > 0 ? (
          <Button
            mode="text"
            onPress={handleBack}
            style={styles.button}
          >
            Back
          </Button>
        ) : (
          <View style={styles.buttonPlaceholder} />
        )}
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
        >
          {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  settingWrapper: {
    width: '100%',
    marginVertical: 20,
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    minWidth: 100,
  },
  buttonPlaceholder: {
    minWidth: 100,
  },
});

export default OnboardingScreen;
