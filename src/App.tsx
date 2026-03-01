import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";
import "./App.css";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./app/ProtectedRoute";
import LayerThemeBridge from "./app/LayerThemeBridge";
import AIBackdrop from "./components/ui/AIBackdrop";
import AIPageAssistant from "./components/ui/AIPageAssistant";

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
import AcademyPage from "./features/academy/AcademyPage";
import CoursePage from "./features/academy/CoursePage";
import StudentDashboardPage from "./features/academy/StudentDashboardPage";
import CoreOpsPage from "./features/ops/CoreOpsPage";
import WinnersChat from "./features/intelligence/WinnersChat";
import InstructorDashboard from "./features/academy/InstructorDashboard";
import CourseCreatePage from "./features/academy/CourseCreatePage";

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
      <AIPageAssistant />
      <div className="app-route-layer">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/accept" element={<AcceptInvitePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/architecture" element={<ArchitectureDiagram />} />
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
            <Route path="community/directory" element={<DiasporaDirectoryPage />} />
            <Route path="community/opportunities" element={<OpportunityBoardPage />} />
            <Route path="community/analytics" element={<CreatorAnalyticsPage />} />
            <Route path="community/creator" element={<CreatorEconomyPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:conversationId" element={<MessagesPage />} />
            <Route path="academy" element={<AcademyPage />} />
            <Route path="academy/my-learning" element={<StudentDashboardPage />} />
            <Route path="academy/courses/:slug" element={<CoursePage />} />
            <Route path="intelligence" element={<WinnersChat />} />
            <Route path="academy/instructor" element={<InstructorDashboard />} />
            <Route path="academy/instructor/create" element={<CourseCreatePage />} />
            <Route path="academy/instructor/edit/:id" element={<CourseCreatePage />} />
          </Route>

          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/landing"} replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
