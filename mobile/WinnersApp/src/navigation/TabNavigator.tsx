import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FeedScreen from "../screens/community/FeedScreen";
import PostScreen from "../screens/community/PostScreen";
import CoursesScreen from "../screens/academy/CoursesScreen";
import LessonScreen from "../screens/academy/LessonScreen";
import MarketScreen from "../screens/market/MarketScreen";
import CheckoutScreen from "../screens/market/CheckoutScreen";
import JobsScreen from "../screens/work/JobsScreen";
import AriaScreen from "../screens/intelligence/AriaScreen";

export type CommunityStackParamList = {
  Feed: undefined;
  Post: { postId?: string } | undefined;
};

export type AcademyStackParamList = {
  Courses: undefined;
  Lesson: { lessonId?: string } | undefined;
};

export type MarketStackParamList = {
  MarketHome: undefined;
  Checkout: undefined;
};

export type TabParamList = {
  CommunityStack: undefined;
  AcademyStack: undefined;
  MarketStack: undefined;
  Work: undefined;
  Intelligence: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();
const AcademyStack = createNativeStackNavigator<AcademyStackParamList>();
const MarketStack = createNativeStackNavigator<MarketStackParamList>();

function CommunityNavigator() {
  return (
    <CommunityStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#162131" },
        headerTintColor: "#F5F7FA",
      }}
    >
      <CommunityStack.Screen name="Feed" component={FeedScreen} options={{ title: "Community" }} />
      <CommunityStack.Screen name="Post" component={PostScreen} options={{ title: "Post" }} />
    </CommunityStack.Navigator>
  );
}

function AcademyNavigator() {
  return (
    <AcademyStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#162131" },
        headerTintColor: "#F5F7FA",
      }}
    >
      <AcademyStack.Screen name="Courses" component={CoursesScreen} options={{ title: "Academy" }} />
      <AcademyStack.Screen name="Lesson" component={LessonScreen} options={{ title: "Lesson" }} />
    </AcademyStack.Navigator>
  );
}

function MarketNavigator() {
  return (
    <MarketStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#162131" },
        headerTintColor: "#F5F7FA",
      }}
    >
      <MarketStack.Screen name="MarketHome" component={MarketScreen} options={{ title: "Market" }} />
      <MarketStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </MarketStack.Navigator>
  );
}

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.5 }}>
      {glyph}
    </Text>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#101926",
          borderTopColor: "#223247",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#C9A84C",
        tabBarInactiveTintColor: "#93A4B8",
        tabBarIcon: ({ focused }) => {
          const glyphs: Record<keyof TabParamList, string> = {
            CommunityStack: "C",
            AcademyStack: "A",
            MarketStack: "M",
            Work: "W",
            Intelligence: "AI",
          };

          return <TabIcon glyph={glyphs[route.name as keyof TabParamList]} focused={focused} />;
        },
      })}
    >
      <Tab.Screen name="CommunityStack" component={CommunityNavigator} options={{ title: "Community" }} />
      <Tab.Screen name="AcademyStack" component={AcademyNavigator} options={{ title: "Academy" }} />
      <Tab.Screen name="MarketStack" component={MarketNavigator} options={{ title: "Market" }} />
      <Tab.Screen name="Work" component={JobsScreen} options={{ title: "Work" }} />
      <Tab.Screen name="Intelligence" component={AriaScreen} options={{ title: "Aria" }} />
    </Tab.Navigator>
  );
}
