import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FeedScreen from "../screens/community/FeedScreen";
import PostScreen from "../screens/community/PostScreen";
import CreatePostScreen from "../screens/community/CreatePostScreen";
import GroupsScreen from "../screens/community/GroupsScreen";
import GroupDetailScreen from "../screens/community/GroupDetailScreen";
import UserProfileScreen from "../screens/community/UserProfileScreen";
import CoursesScreen from "../screens/academy/CoursesScreen";
import CourseDetailScreen from "../screens/academy/CourseDetailScreen";
import LessonScreen from "../screens/academy/LessonScreen";
import MyLearningScreen from "../screens/academy/MyLearningScreen";
import MarketScreen from "../screens/market/MarketScreen";
import ProductDetailScreen from "../screens/market/ProductDetailScreen";
import CartScreen from "../screens/market/CartScreen";
import CheckoutScreen from "../screens/market/CheckoutScreen";
import JobsScreen from "../screens/work/JobsScreen";
import JobDetailScreen from "../screens/work/JobDetailScreen";
import ApplyScreen from "../screens/work/ApplyScreen";
import ContractDetailScreen from "../screens/work/ContractDetailScreen";
import FreelancerProfileScreen from "../screens/work/FreelancerProfileScreen";
import AIHubScreen from "../screens/intelligence/AIHubScreen";
import AriaScreen from "../screens/intelligence/AriaScreen";
import NovaChatScreen from "../screens/intelligence/NovaChatScreen";
import SageChatScreen from "../screens/intelligence/SageChatScreen";
import AtlasChatScreen from "../screens/intelligence/AtlasChatScreen";
import OmegaBriefingScreen from "../screens/intelligence/OmegaBriefingScreen";
import PlaceholderScreen from "../screens/system/PlaceholderScreen";
import {
  AcademyStackParamList,
  AIStackParamList,
  CommunityStackParamList,
  MarketStackParamList,
  RootStackParamList,
  TabParamList,
  WorkStackParamList,
} from "./types";
import { useEcosystemStore } from "../stores/ecosystemStore";
import MobileHeader from "../components/navigation/MobileHeader";
import MobileTabBar from "../components/navigation/MobileTabBar";
import { colors } from "../theme/tokens";

const Tab = createBottomTabNavigator<TabParamList>();
const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();
const AcademyStack = createNativeStackNavigator<AcademyStackParamList>();
const MarketStack = createNativeStackNavigator<MarketStackParamList>();
const WorkStack = createNativeStackNavigator<WorkStackParamList>();
const AIStack = createNativeStackNavigator<AIStackParamList>();

type HeaderNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
  getParent: () =>
    | {
        getParent?: () =>
          | {
              navigate: (screen: keyof Pick<RootStackParamList, "Profile" | "Notifications">) => void;
            }
          | undefined;
      }
    | undefined;
};

function openRootScreen(navigation: HeaderNavigation, screen: keyof Pick<RootStackParamList, "Profile" | "Notifications">) {
  const rootNavigation = navigation.getParent()?.getParent?.();
  rootNavigation?.navigate(screen);
}

function renderHeader(navigation: HeaderNavigation, title: string) {
  return (
    <MobileHeader
      title={title}
      canGoBack={navigation.canGoBack()}
      onBackPress={() => navigation.goBack()}
      onNotificationsPress={() => openRootScreen(navigation, "Notifications")}
      onAvatarPress={() => openRootScreen(navigation, "Profile")}
    />
  );
}

function CommunityNavigator() {
  return (
    <CommunityStack.Navigator
      screenOptions={({ navigation, route }) => ({
        contentStyle: { backgroundColor: colors.bg },
        headerShown: route.name === "CreatePost" ? false : undefined,
        header: route.name === "CreatePost" ? undefined : () => renderHeader(navigation, COMMUNITY_TITLES[route.name]),
      })}
    >
      <CommunityStack.Screen name="Feed" component={FeedScreen} />
      <CommunityStack.Screen name="PostDetail" component={PostScreen} />
      <CommunityStack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <CommunityStack.Screen name="Groups" component={GroupsScreen} />
      <CommunityStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <CommunityStack.Screen name="UserProfile" component={UserProfileScreen} />
    </CommunityStack.Navigator>
  );
}

function AcademyNavigator() {
  return (
    <AcademyStack.Navigator
      screenOptions={({ navigation, route }) => ({
        contentStyle: { backgroundColor: colors.bg },
        headerShown: route.name === "CoursePlayer" ? false : undefined,
        header: route.name === "CoursePlayer" ? undefined : () => renderHeader(navigation, ACADEMY_TITLES[route.name]),
      })}
    >
      <AcademyStack.Screen name="Home" component={CoursesScreen} />
      <AcademyStack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <AcademyStack.Screen name="CoursePlayer" component={LessonScreen} />
      <AcademyStack.Screen name="MyLearning" component={MyLearningScreen} />
      <AcademyStack.Screen
        name="Certificate"
        children={() => (
          <PlaceholderScreen
            accent="ice"
            eyebrow="Academy"
            title="Certificate"
            body="Certificate deep links are now mapped and ready for the visual certificate and share flow."
          />
        )}
      />
    </AcademyStack.Navigator>
  );
}

function MarketNavigator() {
  return (
    <MarketStack.Navigator
      screenOptions={({ navigation, route }) => ({
        contentStyle: { backgroundColor: colors.bg },
        headerShown: MARKET_LOCAL_HEADER_ROUTES.has(route.name),
        header: MARKET_LOCAL_HEADER_ROUTES.has(route.name) ? undefined : () => renderHeader(navigation, MARKET_TITLES[route.name]),
      })}
    >
      <MarketStack.Screen name="Home" component={MarketScreen} />
      <MarketStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <MarketStack.Screen name="Cart" component={CartScreen} />
      <MarketStack.Screen name="Checkout" component={CheckoutScreen} />
      <MarketStack.Screen
        name="OrderDetail"
        children={() => (
          <PlaceholderScreen
            accent="gold"
            eyebrow="Market"
            title="Order Detail"
            body="Order tracking, shipment state, and fulfillment status can be implemented here without changing the checkout flow."
          />
        )}
      />
      <MarketStack.Screen
        name="VendorDashboard"
        children={() => (
          <PlaceholderScreen
            accent="gold"
            eyebrow="Market"
            title="Vendor Dashboard"
            body="Vendor controls and performance analytics now have a registered market route and deep-link target."
          />
        )}
      />
      <MarketStack.Screen
        name="DropshippingHub"
        children={() => (
          <PlaceholderScreen
            accent="gold"
            eyebrow="Market"
            title="Dropshipping Hub"
            body="The dropshipping workflow is now routed and ready for inventory, supplier, and automation surfaces."
          />
        )}
      />
    </MarketStack.Navigator>
  );
}

function WorkNavigator() {
  return (
    <WorkStack.Navigator
      screenOptions={({ navigation, route }) => ({
        contentStyle: { backgroundColor: colors.bg },
        headerShown: route.name === "ContractDetail" ? false : undefined,
        header: route.name === "ContractDetail" ? undefined : () => renderHeader(navigation, WORK_TITLES[route.name]),
      })}
    >
      <WorkStack.Screen name="Home" component={JobsScreen} />
      <WorkStack.Screen name="JobDetail" component={JobDetailScreen} />
      <WorkStack.Screen name="Apply" component={ApplyScreen} />
      <WorkStack.Screen name="ContractDetail" component={ContractDetailScreen} />
      <WorkStack.Screen name="FreelancerProfile" component={FreelancerProfileScreen} />
    </WorkStack.Navigator>
  );
}

function AINavigator() {
  return (
    <AIStack.Navigator
      screenOptions={({ navigation, route }) => ({
        contentStyle: { backgroundColor: colors.bg },
        header: () => renderHeader(navigation, AI_TITLES[route.name]),
      })}
    >
      <AIStack.Screen name="Hub" component={AIHubScreen} />
      <AIStack.Screen name="ARIAChat" component={AriaScreen} />
      <AIStack.Screen name="NOVAChat" component={NovaChatScreen} />
      <AIStack.Screen name="SAGEChat" component={SageChatScreen} />
      <AIStack.Screen name="ATLASChat" component={AtlasChatScreen} />
      <AIStack.Screen name="OMEGABriefing" component={OmegaBriefingScreen} />
    </AIStack.Navigator>
  );
}

const COMMUNITY_TITLES: Record<keyof CommunityStackParamList, string> = {
  Feed: "Community",
  PostDetail: "Post",
  CreatePost: "Create Post",
  Groups: "Groups",
  GroupDetail: "Group Detail",
  UserProfile: "Profile",
};

const ACADEMY_TITLES: Record<keyof AcademyStackParamList, string> = {
  Home: "Academy",
  CourseDetail: "Course",
  CoursePlayer: "Course Player",
  MyLearning: "My Learning",
  Certificate: "Certificate",
};

const MARKET_TITLES: Record<keyof MarketStackParamList, string> = {
  Home: "Market",
  ProductDetail: "Product",
  Cart: "Cart",
  Checkout: "Checkout",
  OrderDetail: "Order",
  VendorDashboard: "Vendor",
  DropshippingHub: "Dropshipping",
};

const WORK_TITLES: Record<keyof WorkStackParamList, string> = {
  Home: "Work",
  JobDetail: "Job",
  Apply: "Apply",
  ContractDetail: "Contract",
  FreelancerProfile: "Freelancer",
};

const AI_TITLES: Record<keyof AIStackParamList, string> = {
  Hub: "AI",
  ARIAChat: "ARIA",
  NOVAChat: "NOVA",
  SAGEChat: "SAGE",
  ATLASChat: "ATLAS",
  OMEGABriefing: "OMEGA",
};

const MARKET_LOCAL_HEADER_ROUTES = new Set<keyof MarketStackParamList>(["ProductDetail", "Cart", "Checkout"]);

export const TabNavigator = () => {
  const platformStatus = useEcosystemStore((state) => state.platformStatus);

  return (
    <Tab.Navigator
      tabBar={(props) => <MobileTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {platformStatus.community === "live" ? <Tab.Screen name="Community" component={CommunityNavigator} /> : null}
      {platformStatus.academy === "live" ? <Tab.Screen name="Academy" component={AcademyNavigator} /> : null}
      {platformStatus.market === "live" ? <Tab.Screen name="Market" component={MarketNavigator} /> : null}
      {platformStatus.work === "live" ? <Tab.Screen name="Work" component={WorkNavigator} /> : null}
      {platformStatus.ai === "live" ? <Tab.Screen name="AI" component={AINavigator} /> : null}
    </Tab.Navigator>
  );
};
