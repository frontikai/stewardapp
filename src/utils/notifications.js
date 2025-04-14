import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Push notifications not supported in emulator');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission not granted for notifications');
      return false;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    // We'd typically send this token to a server, but we're storing locally for now
    await AsyncStorage.setItem('pushToken', token);
    
    // Configure Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
};

// Schedule a notification
export const scheduleNotification = async (title, body, trigger) => {
  try {
    // Get existing notifications
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Create a unique identifier for this notification type
    const notificationId = `${title}_${JSON.stringify(trigger)}`;
    
    // Check if a similar notification already exists
    const notificationExists = existingNotifications.some(notification => {
      return notification.content.title === title && 
             JSON.stringify(notification.trigger) === JSON.stringify(trigger);
    });
    
    if (!notificationExists) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'reminder' },
        },
        trigger,
      });
      
      // Store notification ID for later reference
      const storedNotifications = await AsyncStorage.getItem('scheduledNotifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : {};
      notifications[notificationId] = { title, body, trigger };
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
      
      return notificationId;
    }
    
    return null;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Schedule weekly reminder notification
export const scheduleWeeklyReminder = async (dayOfWeek, hour, minute) => {
  try {
    return await scheduleNotification(
      'Giving Reminder',
      'Remember to record your tithes and offerings.',
      {
        weekday: dayOfWeek, // 1-7 (Monday-Sunday)
        hour,
        minute,
        repeats: true,
      }
    );
  } catch (error) {
    console.error('Error scheduling weekly reminder:', error);
    return null;
  }
};

// Schedule monthly reminder notification
export const scheduleMonthlyReminder = async (dayOfMonth, hour, minute) => {
  try {
    return await scheduleNotification(
      'Monthly Giving Reminder',
      'It\'s time to review your monthly giving goals.',
      {
        day: dayOfMonth, // 1-31
        hour,
        minute,
        repeats: true,
      }
    );
  } catch (error) {
    console.error('Error scheduling monthly reminder:', error);
    return null;
  }
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('scheduledNotifications');
    return true;
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return false;
  }
};

// Cancel a specific notification
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    
    // Remove from stored notifications
    const storedNotifications = await AsyncStorage.getItem('scheduledNotifications');
    if (storedNotifications) {
      const notifications = JSON.parse(storedNotifications);
      delete notifications[notificationId];
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
    }
    
    return true;
  } catch (error) {
    console.error('Error canceling notification:', error);
    return false;
  }
};

// Listen for notification responses
export const addNotificationResponseListener = (callback) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    callback(response);
  });
  return subscription;
};

// Remove notification listener
export const removeNotificationListener = (subscription) => {
  Notifications.removeNotificationSubscription(subscription);
};
