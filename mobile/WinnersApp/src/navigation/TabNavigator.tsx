import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BrainCircuit, Briefcase, GraduationCap, ShoppingBag, Users } from "lucide-react-native";
import { TabParamList } from "./types";
import FeedScreen from "../screens/community/FeedScreen";
import CoursesScreen from "../screens/academy/CoursesScreen";
import MarketScreen from "../screens/market/MarketScreen";
import JobsScreen from "../screens/work/JobsScreen";
import AriaScreen from "../screens/intelligence/AriaScreen";

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#111D2E" },
        headerTitleStyle: { color: "#E8EEF5", fontWeight: "700" },
        headerTintColor: "#E8EEF5",
        sceneStyle: { backgroundColor: "#0D1520" },
        tabBarStyle: {
          backgroundColor: "#111D2E",
          borderTopColor: "#1E3248",
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#C9A84C",
        tabBarInactiveTintColor: "#64819B",
      }}
    >
      <Tab.Screen
        name="Community"
        component={FeedScreen}
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Academy"
        component={CoursesScreen}
        options={{
          title: "Academy",
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{
          title: "Market",
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Work"
        component={JobsScreen}
        options={{
          title: "Work",
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Aria"
        component={AriaScreen}
        options={{
          title: "Aria",
          tabBarIcon: ({ color, size }) => <BrainCircuit color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
