import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './features/notifications/screens/LoginScreen';
import { InboxScreen } from './features/notifications/screens/InboxScreen';
import { NotificationDetailScreen } from './features/notifications/screens/NotificationDetailScreen';
import { usePushRegistration } from './features/notifications/hooks/usePushRegistration';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();
  usePushRegistration();

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: 'Notifications' }} />
          <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ title: 'Detail' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function App(): React.ReactElement {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
