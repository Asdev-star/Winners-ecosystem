import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Users, GraduationCap, ShoppingBag, Briefcase, BrainCircuit } from 'lucide-react-native';

import CommunityScreen from '../screens/community/FeedScreen';
import AcademyScreen from '../screens/academy/CoursesScreen';
import MarketScreen from '../screens/market/MarketScreen';
import WorkScreen from '../screens/work/JobsScreen';
import AriaScreen from '../screens/intelligence/AriaScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111D2E' },
        headerTitleStyle: { color: '#E8EEF5' },
        tabBarStyle: { backgroundColor: '#111D2E', borderTopColor: '#1E3248' },
        tabBarActiveTintColor: '#C9A84C',
        tabBarInactiveTintColor: '#5A7A96',
      }}
    >
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Academy" 
        component={AcademyScreen} 
        options={{ tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Market" 
        component={MarketScreen} 
        options={{ tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Work" 
        component={WorkScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Aria" 
        component={AriaScreen} 
        options={{ tabBarIcon: ({ color, size }) => <BrainCircuit color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
};