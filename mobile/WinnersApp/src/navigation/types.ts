import { NavigatorScreenParams } from "@react-navigation/native";

export type CommunityStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  CreatePost: { groupId?: string } | undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  UserProfile: { userId: string };
};

export type AcademyStackParamList = {
  Home: { courseId?: string } | undefined;
  CourseDetail: { slug: string };
  CoursePlayer: { lessonId: string; courseId?: string };
  MyLearning: undefined;
  Certificate: { certId: string };
};

export type MarketStackParamList = {
  Home: { section?: string } | undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: { planId?: string; source?: string; cartId?: string };
  OrderDetail: { orderId: string };
  VendorDashboard: undefined;
  DropshippingHub: undefined;
  Wallet: undefined;
};

export type WorkStackParamList = {
  Home: { jobId?: string } | undefined;
  JobDetail: { jobId: string };
  Apply: { jobId: string };
  ContractDetail: { contractId: string };
  FreelancerProfile: { userId: string };
};

export type AIStackParamList = {
  Hub: undefined;
  ARIAChat: undefined;
  NOVAChat: undefined;
  SAGEChat: undefined;
  ATLASChat: undefined;
  OMEGABriefing: undefined;
};

export type TabParamList = {
  Community: NavigatorScreenParams<CommunityStackParamList> | undefined;
  Academy: NavigatorScreenParams<AcademyStackParamList> | undefined;
  Market: NavigatorScreenParams<MarketStackParamList> | undefined;
  Work: NavigatorScreenParams<WorkStackParamList> | undefined;
  AI: NavigatorScreenParams<AIStackParamList> | undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Profile: { userId?: string } | undefined;
  Settings: undefined;
  Notifications: undefined;
  Messages: undefined;
};

export type MobilePlatformStatus = "live" | "planned" | "building";
