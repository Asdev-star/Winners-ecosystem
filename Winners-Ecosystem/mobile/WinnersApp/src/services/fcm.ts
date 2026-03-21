import * as Notifications from 'expo-notifications';

export const fcm = {
  register: async (userId: string) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('[FCM] Device Token:', token);
    
    // Register token with server
    // await api.post('/push/register', { userId, token, platform: 'mobile' });
  },
  
  listen: (callback: (notification: any) => void) => {
    return Notifications.addNotificationReceivedListener(callback);
  },
};