import { getStateFromPath as getNavigationStateFromPath, LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./types";

export const deepLinkRoutes = {
  Community: "community",
  PostDetail: "community/posts/:postId",
  Academy: "academy",
  Course: "academy/courses/:slug",
  Market: "market",
  Product: "market/products/:productId",
  Work: "work",
  Job: "work/jobs/:jobId",
  AIHub: "intelligence",
  ARIAChat: "intelligence/aria",
  Profile: "profile/:userId?",
  Certificate: "academy/certificates/:certId",
} as const;

const config: LinkingOptions<RootStackParamList>["config"] = {
  screens: {
    Login: "login",
    Register: "register",
    ForgotPassword: "forgot-password",
    Onboarding: "onboarding",
    Main: {
      screens: {
        Community: {
          screens: {
            Feed: deepLinkRoutes.Community,
            PostDetail: deepLinkRoutes.PostDetail,
            CreatePost: "community/create",
            Groups: "community/groups",
            GroupDetail: "community/groups/:groupId",
            UserProfile: "community/profile/:userId",
          },
        },
        Academy: {
          screens: {
            Home: deepLinkRoutes.Academy,
            CourseDetail: deepLinkRoutes.Course,
            CoursePlayer: "academy/courses/:courseId/lessons/:lessonId",
            MyLearning: "academy/my-learning",
            Certificate: deepLinkRoutes.Certificate,
          },
        },
        Market: {
          screens: {
            Home: deepLinkRoutes.Market,
            ProductDetail: deepLinkRoutes.Product,
            Cart: "market/cart",
            Checkout: "market/checkout/:planId?",
            OrderDetail: "market/orders/:orderId",
            VendorDashboard: "market/vendor-dashboard",
            DropshippingHub: "market/dropshipping",
          },
        },
        Work: {
          screens: {
            Home: deepLinkRoutes.Work,
            JobDetail: deepLinkRoutes.Job,
            Apply: "work/jobs/:jobId/apply",
            ContractDetail: "work/contracts/:contractId",
            FreelancerProfile: "work/freelancers/:userId",
          },
        },
        AI: {
          screens: {
            Hub: deepLinkRoutes.AIHub,
            ARIAChat: deepLinkRoutes.ARIAChat,
            NOVAChat: "intelligence/nova",
            SAGEChat: "intelligence/sage",
            ATLASChat: "intelligence/atlas",
            OMEGABriefing: "intelligence/omega",
          },
        },
      },
    },
    Profile: deepLinkRoutes.Profile,
    Settings: "settings",
    Notifications: "notifications",
    Messages: "messages",
  },
};

function normalizePath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, "");

  if (!trimmed) return "";
  if (trimmed === "work/jobs") return "work";
  if (trimmed === "market/vendor") return "market/vendor-dashboard";

  return trimmed;
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["winners://", "https://winners-empire.up.railway.app"],
  config,
  getStateFromPath(path, options) {
    return getNavigationStateFromPath(normalizePath(path), options);
  },
};
