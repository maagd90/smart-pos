import { useEffect } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth, savePushToken } from '../../../context/AuthContext';
import { registerDevice } from '../api/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!Device.isDevice) return;
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      await savePushToken(token);
      await registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
    })().catch(() => undefined);
  }, [user]);
}

export function useNotificationNavigation(navigation: { navigate: (screen: string, params?: object) => void }) {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const notificationId = response.notification.request.content.data?.notificationId;
      if (typeof notificationId === 'string') {
        navigation.navigate('NotificationDetail', { id: notificationId });
      }
    });
    return () => sub.remove();
  }, [navigation]);
}
