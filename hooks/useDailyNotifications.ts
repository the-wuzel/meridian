import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSettings } from '@/context/SettingsContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useDailyNotifications() {
  const {
    preferences: {
      morningNotificationEnabled,
      morningNotificationHour,
      morningNotificationMinute,
      eveningNotificationEnabled,
      eveningNotificationHour,
      eveningNotificationMinute,
    },
    isLoading
  } = useSettings();

  useEffect(() => {
    if (isLoading) return;
    async function configureNotifications() {
      if (Platform.OS === 'web') return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      if (morningNotificationEnabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Morning Check-in ☀️',
            body: "Take a moment to start your day with intention. How are you feeling?",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: morningNotificationHour,
            minute: morningNotificationMinute,
          } as Notifications.DailyTriggerInput,
        });
      }

      if (eveningNotificationEnabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Evening Reflection 🌙',
            body: "Time to wind down. Reflect on your day and log your thoughts.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: eveningNotificationHour,
            minute: eveningNotificationMinute,
          } as Notifications.DailyTriggerInput,
        });
      }

      // TEMPORARY: Test notification 5 seconds from now
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification 🚀',
          body: "This is a test notification to verify it's working!",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });

    }

    configureNotifications();
  }, [
    isLoading,
    morningNotificationEnabled,
    morningNotificationHour,
    morningNotificationMinute,
    eveningNotificationEnabled,
    eveningNotificationHour,
    eveningNotificationMinute
  ]);
}
