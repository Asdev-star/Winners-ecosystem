import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { linking } from './src/navigation/linking';

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}