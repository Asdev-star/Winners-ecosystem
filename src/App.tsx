import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./features/auth/authStore";
import { useSuperAdminAccess } from "./app/useSuperAdminAccess";
import "./App.css";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./app/ProtectedRoute";
import SuperAdminRoute from "./app/SuperAdminRoute";
import LayerRouteGate from "./app/LayerRouteGate";
import LayerThemeBridge from "./app/LayerThemeBridge";
import HiddenNotFoundPage from "./app/HiddenNotFoundPage";
import EcosystemLocaleBridge from "./components/analytics/EcosystemLocaleBridge";
import EcosystemTelemetryBridge from "./components/analytics/EcosystemTelemetryBridge";
import AIBackdrop from "./components/ui/AIBackdrop";
import RealtimeNotifications from "./components/ui/RealtimeNotifications";
import InstallPrompt from "./features/mobile/InstallPrompt";

import LoginPage from "./features/auth/LoginPage";
import LandingPage from "./features/landing/LandingPage";
import AcceptInvitePage from "./features/team/AcceptInvitePage";
import ArchitectureDiagram from "./components/docs/ArchitectureDiagram";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import SsoExchangePage from "./features/auth/SsoExchangePage";
import OnboardingPage from "./features/onboarding/OnboardingPage";

import DashboardPage from "./features/dashboard/DashboardPage";
import UserHomePage from "./features/home/UserHomePage";
import ProfilePage from "./features/profile/ProfilePage";
import SettingsPage from "./features/settings/SettingsPage";
import { CoreSettingsPage } from "./features/settings/CoreSettingsPage";
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
import SavedPostsPage from "./features/community/SavedPostsPage";
import StudioHomePage from "./features/community/StudioHomePage";
import VideoRoomPage from "./features/community/VideoRoomPage";
import BroadcastViewerPage from "./features/community/BroadcastViewerPage";
import AcademyPage from "./features/academy/AcademyPage";
import ExternalCoursesPage from "./features/academy/ExternalCoursesPage";
import CoursePage from "./features/academy/CoursePage";
import StudentDashboardPage from "./features/academy/StudentDashboardPage";
import WinnersChat from "./features/intelligence/WinnersChat";
import WinnersIntelligencePage from "./features/intelligence/WinnersIntelligencePage";
import AIPlatformPage from "./features/intelligence/ai-platform/AIPlatformPage";
import OmegaDashboard from "./features/intelligence/OmegaDashboard";
import SupervisorPage from "./features/intelligence/SupervisorPage";
import LoopTrackerPage from "./features/intelligence/LoopTrackerPage";
import MemoryManagerPage from "./features/intelligence/MemoryManagerPage";
import CreditsPage from "./features/intelligence/CreditsPage";
import ReportsPage from "./features/intelligence/ReportsPage";
import IntelligenceAnalytics from "./features/intelligence/IntelligenceAnalytics";
import InstructorDashboard from "./features/academy/InstructorDashboard";
import CourseCreatePage from "./features/academy/CourseCreatePage";
import LearningPathsPage from "./features/academy/LearningPathsPage";
import StudyGroupPage from "./features/academy/StudyGroupPage";
import QuizEngine from "./features/academy/QuizEngine";
import LiveSessionsPage from "./features/academy/LiveSessionsPage";
import CertificateVerificationPage from "./features/academy/CertificateVerificationPage";
import WinnersUIArchitectureLevels from "./features/engineering/WinnersUIArchitectureLevels";
import MarketPage from "./features/market/MarketPage";
import ProductPage from "./features/market/ProductPage";
import VendorDashboard from "./features/market/VendorDashboard";
import WinnersMarketExpanded from "./features/market/WinnersMarketExpanded";
import WinnersDropshipping from "./features/market/dropshipping/WinnersDropshipping";
import CartPage from "./features/market/CartPage";
import OrdersPage from "./features/market/OrdersPage";
import CheckoutPage from "./features/market/CheckoutPage";
import FinancePage from "./features/market/finance/FinancePage";
import BusinessLauncherPage from "./features/market/BusinessLauncherPage";
import CVToolsPage from "./features/market/CVToolsPage";
import DigitalMarketingPage from "./features/market/DigitalMarketingPage";
import WinnersStreamPage from "./features/market/WinnersStreamPage";
import StreamViewerPage from "./features/market/StreamViewerPage";
import WinnersTradingPage from "./features/market/WinnersTradingPage";
import WinnersEventsPage from "./features/market/WinnersEventsPage";
import WinnersPropertyPage from "./features/market/WinnersPropertyPage";
import WinnersHealthPage from "./features/market/WinnersHealthPage";
import WorkPage from "./features/work/WorkPage";
import JobDetailPage from "./features/work/JobDetailPage";
import FreelancerProfilePage from "./features/work/FreelancerProfilePage";
import EscrowPage from "./features/work/EscrowPage";
import CreatorProfilePage from "./features/community/CreatorProfilePage";
import CloudPage from "./features/cloud/CloudPage";
import CloudConnectorsPage from "./features/cloud/CloudConnectorsPage";
import CloudAutomationsPage from "./features/cloud/CloudAutomationsPage";
import CloudAgentsPage from "./features/cloud/CloudAgentsPage";
import CloudAPIKeysPage from "./features/cloud/CloudAPIKeysPage";
import CloudWebhooksPage from "./features/cloud/CloudWebhooksPage";
import CloudUsagePage from "./features/cloud/CloudUsagePage";
import APIMarketplacePage from "./features/cloud/APIMarketplacePage";
import AIRevenueProductsPage from "./features/intelligence/AIRevenueProductsPage";
import AdminLayout from "./features/admin/AdminLayout";
import PlatformLaunchPage from "./features/admin/PlatformLaunchPage";
import TenantListPage from "./features/admin/TenantListPage";
import TenantDetailPage from "./features/admin/TenantDetailPage";
import UserListPage from "./features/admin/UserListPage";
import UserDetailPage from "./features/admin/UserDetailPage";
import RevenuePage from "./features/admin/RevenuePage";
import ForgeIntelligencePage from "./features/admin/ForgeIntelligencePage";
import SystemHealthPage from "./features/admin/SystemHealthPage";
import BroadcastPage from "./features/admin/BroadcastPage";
import SecurityPage from "./features/admin/SecurityPage";
import AdminSettingsPage from "./features/admin/settings/AdminSettingsPage";
import { AdminPlatformLayerPage } from "./features/admin/AdminRoutePages";

function DashboardRealmRoute() {
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const { hasAccess, isChecking } = useSuperAdminAccess();

  if (isRestoring || isChecking) return null;
  if (!hasAccess) return <HiddenNotFoundPage />;

  return <DashboardPage />;
}

function AuthenticatedDefaultRoute() {
  const user = useAuthStore((state) => state.user);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const { hasAccess, isChecking } = useSuperAdminAccess();

  if (isRestoring) return null;
  if (!user) return <Navigate to="/landing" replace />;
  if (isChecking) return null;
  if (user.onboardingCompleted === false)
    return <Navigate to="/onboarding" replace />;

  return <Navigate to={hasAccess ? "/dashboard" : "/home"} replace />;
}

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <div className="app-shell">
      <LayerThemeBridge />
      <EcosystemLocaleBridge />
      <EcosystemTelemetryBridge />
      <AIBackdrop />
      <RealtimeNotifications />
      <Toaster position="top-center" toastOptions={{ duration: 4500 }} />
      <InstallPrompt />
      <div className="app-route-layer">
        <Routes>
          <Route path="/" element={<AuthenticatedDefaultRoute />} />
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
            path="/verify/:token"
            element={<CertificateVerificationPage />}
          />

          <Route
            path="admin"
            element={
              <SuperAdminRoute>
                <AdminLayout />
              </SuperAdminRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="overview"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="platform" element={<PlatformLaunchPage />} />
            <Route
              path="platform/:layerId"
              element={<AdminPlatformLayerPage />}
            />
            <Route path="tenants" element={<TenantListPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="forge" element={<ForgeIntelligencePage />} />
            <Route path="health" element={<SystemHealthPage />} />
            <Route path="broadcast" element={<BroadcastPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route
              path="platform-launch"
              element={<Navigate to="/admin/platform" replace />}
            />
            <Route
              path="forge-intelligence"
              element={<Navigate to="/admin/forge" replace />}
            />
            <Route
              path="omega-broadcast"
              element={<Navigate to="/admin/broadcast" replace />}
            />
            <Route
              path="system-health"
              element={<Navigate to="/admin/health" replace />}
            />
          </Route>

          <Route
            path="ops"
            element={
              <SuperAdminRoute>
                <Navigate to="/admin/health" replace />
              </SuperAdminRoute>
            }
          />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardRealmRoute />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="2fa" element={<TwoFactorPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="email" element={<EmailReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="home" element={<UserHomePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/community" element={<SettingsPage />} />
            <Route path="settings/academy" element={<SettingsPage />} />
            <Route path="settings/market" element={<SettingsPage />} />
            <Route path="settings/work" element={<SettingsPage />} />
            <Route path="settings/intelligence" element={<SettingsPage />} />
            <Route path="settings/account" element={<SettingsPage />} />
            <Route
              path="settings/core"
              element={
                <SuperAdminRoute>
                  <CoreSettingsPage />
                </SuperAdminRoute>
              }
            />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="slack" element={<SlackSettingsPage />} />
            <Route path="stripe" element={<StripeDashboard />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="referral" element={<ReferralPage />} />
            <Route path="changelog" element={<ChangelogPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="community/feed" element={<CommunityPage />} />
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
              element={<DiasporaDirectoryPage />}
            />
            <Route path="community/saved" element={<SavedPostsPage />} />
            <Route path="community/messages" element={<MessagesPage />} />
            <Route path="community/create" element={<CommunityPage />} />
            <Route path="community/studio" element={<StudioHomePage />} />
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
            <Route path="academy/create" element={<CourseCreatePage />} />
            <Route path="academy" element={<AcademyPage />} />
            <Route path="academy/external" element={<ExternalCoursesPage />} />
            <Route path="academy/explore" element={<ExternalCoursesPage />} />
            <Route
              path="academy/my-learning"
              element={<StudentDashboardPage />}
            />
            <Route
              path="academy/certificates"
              element={<StudentDashboardPage />}
            />
            <Route path="academy/courses/:slug" element={<CoursePage />} />
            <Route path="intelligence" element={<WinnersIntelligencePage />} />
            <Route path="intelligence/aria" element={<WinnersChat />} />
            <Route path="intelligence/omega" element={<OmegaDashboard />} />
            <Route path="intelligence/platform" element={<AIPlatformPage />} />
            <Route
              path="intelligence/agents/:name"
              element={<SupervisorPage />}
            />
            <Route path="intelligence/loop" element={<LoopTrackerPage />} />
            <Route path="intelligence/memory" element={<MemoryManagerPage />} />
            <Route path="intelligence/credits" element={<CreditsPage />} />
            <Route path="intelligence/reports" element={<ReportsPage />} />
            <Route
              path="intelligence/analytics"
              element={<IntelligenceAnalytics />}
            />
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
            <Route path="academy/cohorts" element={<StudyGroupPage />} />
            <Route path="academy/quiz/:quizId" element={<QuizEngine />} />
            <Route
              path="academy/live-sessions"
              element={<LiveSessionsPage />}
            />
            <Route
              path="market"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersMarketExpanded />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/dropshipping"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersDropshipping />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/product/:productId"
              element={
                <LayerRouteGate layerId="market">
                  <ProductPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/products/:productId"
              element={
                <LayerRouteGate layerId="market">
                  <ProductPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/vendor"
              element={
                <LayerRouteGate layerId="market">
                  <VendorDashboard />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/store"
              element={
                <LayerRouteGate layerId="market">
                  <VendorDashboard />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/products"
              element={
                <LayerRouteGate layerId="market">
                  <VendorDashboard />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/analytics"
              element={
                <LayerRouteGate layerId="market">
                  <VendorDashboard />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/tools"
              element={
                <LayerRouteGate layerId="market">
                  <VendorDashboard />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/cart"
              element={
                <LayerRouteGate layerId="market">
                  <CartPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/orders"
              element={
                <LayerRouteGate layerId="market">
                  <OrdersPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/checkout"
              element={
                <LayerRouteGate layerId="market">
                  <CheckoutPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/finance"
              element={
                <LayerRouteGate layerId="market">
                  <FinancePage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/business-launcher"
              element={
                <LayerRouteGate layerId="market">
                  <BusinessLauncherPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/cv-tools"
              element={
                <LayerRouteGate layerId="market">
                  <CVToolsPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/digital-marketing"
              element={
                <LayerRouteGate layerId="market">
                  <DigitalMarketingPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/stream"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersStreamPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/stream/:streamId"
              element={
                <LayerRouteGate layerId="market">
                  <StreamViewerPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/trading"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersTradingPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/events"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersEventsPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/property"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersPropertyPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/health"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersHealthPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/marketing"
              element={
                <LayerRouteGate layerId="market">
                  <DigitalMarketingPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/trending"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersMarketExpanded />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/services"
              element={
                <LayerRouteGate layerId="market">
                  <WinnersMarketExpanded />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/career"
              element={
                <LayerRouteGate layerId="market">
                  <CVToolsPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/business"
              element={
                <LayerRouteGate layerId="market">
                  <BusinessLauncherPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/vendor/products/new"
              element={
                <LayerRouteGate layerId="market">
                  <VendorDashboard />
                </LayerRouteGate>
              }
            />
            <Route
              path="work"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/jobs"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/jobs/:jobId"
              element={
                <LayerRouteGate layerId="work">
                  <JobDetailPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/freelancers"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/contracts"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/escrow"
              element={
                <LayerRouteGate layerId="work">
                  <EscrowPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/profile"
              element={
                <LayerRouteGate layerId="work">
                  <FreelancerProfilePage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/applications"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/portfolio"
              element={
                <LayerRouteGate layerId="work">
                  <FreelancerProfilePage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/earnings"
              element={
                <LayerRouteGate layerId="work">
                  <EscrowPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/post"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/listings"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/applicants"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/payments"
              element={
                <LayerRouteGate layerId="work">
                  <EscrowPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="work/talent"
              element={
                <LayerRouteGate layerId="work">
                  <WorkPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="market/:vertical"
              element={
                <LayerRouteGate layerId="market">
                  <MarketPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud"
              element={
                <LayerRouteGate layerId="cloud">
                  <CloudPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud/connectors"
              element={
                <LayerRouteGate layerId="cloud">
                  <CloudConnectorsPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud/automations"
              element={
                <LayerRouteGate layerId="cloud">
                  <CloudAutomationsPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud/agents"
              element={
                <LayerRouteGate layerId="cloud">
                  <CloudAgentsPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud/keys"
              element={
                <LayerRouteGate layerId="cloud">
                  <CloudAPIKeysPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud/webhooks"
              element={
                <LayerRouteGate layerId="cloud">
                  <CloudWebhooksPage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud/usage"
              element={
                <LayerRouteGate layerId="cloud">
                  <CloudUsagePage />
                </LayerRouteGate>
              }
            />
            <Route
              path="cloud/marketplace"
              element={
                <LayerRouteGate layerId="cloud">
                  <APIMarketplacePage />
                </LayerRouteGate>
              }
            />
            <Route
              path="intelligence/revenue"
              element={<AIRevenueProductsPage />}
            />
            <Route
              path="intelligence/agents"
              element={<Navigate to="/intelligence/agents/omega" replace />}
            />
            <Route
              path="intelligence/skills"
              element={<Navigate to="/intelligence/analytics" replace />}
            />
            <Route
              path="intelligence/api"
              element={<Navigate to="/intelligence/platform" replace />}
            />
            <Route path="settings/integrations" element={<SettingsPage />} />
            <Route path="settings/security" element={<SettingsPage />} />
            <Route
              path="cart"
              element={<Navigate to="/market/cart" replace />}
            />
            <Route
              path="checkout"
              element={<Navigate to="/market/checkout" replace />}
            />
            <Route
              path="orders"
              element={<Navigate to="/market/orders" replace />}
            />
          </Route>

          <Route path="*" element={<AuthenticatedDefaultRoute />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
