import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";
import "./App.css";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./app/ProtectedRoute";
import LayerThemeBridge from "./app/LayerThemeBridge";
import AIBackdrop from "./components/ui/AIBackdrop";

import LoginPage from "./features/auth/LoginPage";
import LandingPage from "./features/landing/LandingPage";
import AcceptInvitePage from "./features/team/AcceptInvitePage";
import ArchitectureDiagram from "./components/docs/ArchitectureDiagram";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import SsoExchangePage from "./features/auth/SsoExchangePage";
import OnboardingPage from "./features/onboarding/OnboardingPage";

import DashboardPage from "./features/dashboard/DashboardPage";
import ProfilePage from "./features/profile/ProfilePage";
import SettingsPage from "./features/settings/SettingsPage";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import TeamPage from "./features/team/TeamPage";
import ExportPage from "./features/export/ExportPage";
import BillingPage from "./features/billing/BillingPage";
import EmailReportsPage from "./features/email/EmailReportsPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import StripeDashboard from "./features/stripe/StripeDashboard";
import SlackSettingsPage from "./features/slack/SlackSettingsPage";
import SearchPage from "./features/search/SearchPage";
import ActivityPage from "./features/activity/ActivityPage";
import ReferralPage from "./features/referral/ReferralPage";
import AdminPage from "./features/admin/AdminPage";
import ChangelogPage from "./features/changelog/ChangelogPage";
import TwoFactorPage from "./features/security/TwoFactorPage";
import CommunityPage from "./features/community/CommunityPage";
import GroupsPage from "./features/community/GroupsPage";
import LiveSpacesPage from "./features/community/LiveSpacesPage";
import DiasporaDirectoryPage from "./features/community/DiasporaDirectoryPage";
import OpportunityBoardPage from "./features/community/OpportunityBoardPage";
import CreatorAnalyticsPage from "./features/community/CreatorAnalyticsPage";
import CreatorEconomyPage from "./features/community/CreatorEconomyPage";
import MessagesPage from "./features/community/MessagesPage";
import SocialAccountsPage from "./features/community/SocialAccountsPage";
import SocialIntelligenceDashboard from "./features/community/SocialIntelligenceDashboard";
import StudioHomePage from "./features/community/StudioHomePage";
import VideoRoomPage from "./features/community/VideoRoomPage";
import BroadcastViewerPage from "./features/community/BroadcastViewerPage";
import AcademyPage from "./features/academy/AcademyPage";
import ExternalCoursesPage from "./features/academy/ExternalCoursesPage";
import CoursePage from "./features/academy/CoursePage";
import StudentDashboardPage from "./features/academy/StudentDashboardPage";
import CoreOpsPage from "./features/ops/CoreOpsPage";
import WinnersChat from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage from "./features/intelligence/ai-platform/AIPlatformPage";
import OmegaDashboard from "./features/intelligence/OmegaDashboard";
import InstructorDashboard from "./features/academy/InstructorDashboard";
import CourseCreatePage from "./features/academy/CourseCreatePage";
import LearningPathsPage from "./features/academy/LearningPathsPage";
import StudyGroupPage from "./features/academy/StudyGroupPage";
import QuizEngine from "./features/academy/QuizEngine";
import WinnersUIArchitectureLevels from "./features/engineering/WinnersUIArchitectureLevels";
import MarketPage from "./features/market/MarketPage";
import ProductPage from "./features/market/ProductPage";
import VendorDashboard from "./features/market/VendorDashboard";
import WinnersMarketExpanded from "./features/market/WinnersMarketExpanded";
import WinnersDropshipping from "./features/market/dropshipping/WinnersDropshipping";
import CartPage from "./features/market/CartPage";
import OrdersPage from "./features/market/OrdersPage";
import CheckoutPage from "./features/market/CheckoutPage";
import WorkPage from "./features/work/WorkPage";
import CreatorProfilePage from "./features/community/CreatorProfilePage";

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <div className="app-shell">
      <LayerThemeBridge />
      <AIBackdrop />
      <div className="app-route-layer">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/accept" element={<AcceptInvitePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/architecture" element={<ArchitectureDiagram />} />
          <Route path="/ui-quality" element={<WinnersUIArchitectureLevels />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/sso/exchange" element={<SsoExchangePage />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="2fa" element={<TwoFactorPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="email" element={<EmailReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="slack" element={<SlackSettingsPage />} />
            <Route path="stripe" element={<StripeDashboard />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="referral" element={<ReferralPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="ops" element={<CoreOpsPage />} />
            <Route path="changelog" element={<ChangelogPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="community/groups" element={<GroupsPage />} />
            <Route path="community/spaces" element={<LiveSpacesPage />} />
            <Route
              path="community/directory"
              element={<DiasporaDirectoryPage />}
            />
            <Route
              path="community/opportunities"
              element={<OpportunityBoardPage />}
            />
            <Route
              path="community/analytics"
              element={<CreatorAnalyticsPage />}
            />
            <Route path="community/creator" element={<CreatorEconomyPage />} />
            <Route
              path="community/social-accounts"
              element={<SocialAccountsPage />}
            />
            <Route
              path="community/social-intelligence"
              element={<SocialIntelligenceDashboard />}
            />
            <Route
              path="community/discover"
              element={<SocialIntelligenceDashboard />}
            />
            <Route
              path="community/saved"
              element={<SocialIntelligenceDashboard />}
            />
            <Route
              path="community/studio"
              element={<StudioHomePage />}
            />
            <Route
              path="community/studio/room/:roomId"
              element={<VideoRoomPage />}
            />
            <Route
              path="community/studio/stream/:streamId"
              element={<BroadcastViewerPage />}
            />
            <Route
              path="community/profile/:id"
              element={<CreatorProfilePage />}
            />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:conversationId" element={<MessagesPage />} />
            <Route path="academy" element={<AcademyPage />} />
            <Route path="academy/external" element={<ExternalCoursesPage />} />
            <Route path="academy/explore" element={<ExternalCoursesPage />} />
            <Route
              path="academy/my-learning"
              element={<StudentDashboardPage />}
            />
            <Route path="academy/courses/:slug" element={<CoursePage />} />
            <Route path="intelligence" element={<WinnersIntelligencePage />} />
            <Route path="intelligence/aria" element={<WinnersChat />} />
            <Route path="intelligence/omega" element={<OmegaDashboard />} />
            <Route path="intelligence/platform" element={<AIPlatformPage />} />
            <Route
              path="academy/instructor"
              element={<InstructorDashboard />}
            />
            <Route
              path="academy/instructor/create"
              element={<CourseCreatePage />}
            />
            <Route
              path="academy/instructor/edit/:id"
              element={<CourseCreatePage />}
            />
            <Route path="academy/paths" element={<LearningPathsPage />} />
            <Route
              path="academy/paths/:pathId"
              element={<LearningPathsPage />}
            />
            <Route path="academy/study-groups" element={<StudyGroupPage />} />
            <Route
              path="academy/study-groups/:groupId"
              element={<StudyGroupPage />}
            />
            <Route path="academy/quiz/:quizId" element={<QuizEngine />} />
            <Route path="market" element={<WinnersMarketExpanded />} />
            <Route path="market/dropshipping" element={<WinnersDropshipping />} />
            <Route path="market/product/:productId" element={<ProductPage />} />
            <Route path="market/vendor" element={<VendorDashboard />} />
            <Route path="market/cart" element={<CartPage />} />
            <Route path="market/orders" element={<OrdersPage />} />
            <Route path="market/checkout" element={<CheckoutPage />} />
            <Route path="work" element={<WorkPage />} />
            <Route path="work/freelancers" element={<WorkPage />} />
            <Route path="work/contracts" element={<WorkPage />} />
            <Route path="market/:vertical" element={<MarketPage />} />
          </Route>

          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/landing"} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
