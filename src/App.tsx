import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";

import MainLayout        from "./components/layout/MainLayout";
import ProtectedRoute    from "./app/ProtectedRoute";

import LoginPage         from "./features/auth/LoginPage";
import LandingPage       from "./features/landing/LandingPage";
import AcceptInvitePage  from "./features/team/AcceptInvitePage";
import ArchitectureDiagram from "./components/docs/ArchitectureDiagram";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage  from "./features/auth/ResetPasswordPage";
import OnboardingPage    from "./features/onboarding/OnboardingPage";

import DashboardPage     from "./features/dashboard/DashboardPage";
import ProfilePage       from "./features/profile/ProfilePage";
import SettingsPage      from "./features/settings/SettingsPage";
import AnalyticsPage     from "./features/analytics/AnalyticsPage";
import TeamPage          from "./features/team/TeamPage";
import ExportPage        from "./features/export/ExportPage";
import BillingPage       from "./features/billing/BillingPage";
import EmailReportsPage  from "./features/email/EmailReportsPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import StripeDashboard   from "./features/stripe/StripeDashboard";
import SlackSettingsPage from "./features/slack/SlackSettingsPage";
import SearchPage        from "./features/search/SearchPage";
import ActivityPage      from "./features/activity/ActivityPage";
import ReferralPage      from "./features/referral/ReferralPage";
import AdminPage         from "./features/admin/AdminPage";
import ChangelogPage from "./features/changelog/ChangelogPage";
import TwoFactorPage from "./features/security/TwoFactorPage";
import CommunityPage from "./features/community/CommunityPage";
import GroupsPage from "./features/community/GroupsPage";

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route path="/"                element={<LandingPage />} />
      <Route path="/landing"         element={<LandingPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/invite/accept"   element={<AcceptInvitePage />} />
      <Route path="/onboarding"      element={<OnboardingPage />} />
      <Route path="/architecture"    element={<ArchitectureDiagram />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* ── Protected routes (inside MainLayout) ── */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      > 
        <Route path="2fa" element={<TwoFactorPage />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="search"        element={<SearchPage />} />
        <Route path="analytics"     element={<AnalyticsPage />} />
        <Route path="team"          element={<TeamPage />} />
        <Route path="export"        element={<ExportPage />} />
        <Route path="billing"       element={<BillingPage />} />
        <Route path="email"         element={<EmailReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings"      element={<SettingsPage />} />
        <Route path="profile"       element={<ProfilePage />} />
        <Route path="slack"         element={<SlackSettingsPage />} />
        <Route path="stripe"        element={<StripeDashboard />} />
        <Route path="activity"      element={<ActivityPage />} />
        <Route path="referral"      element={<ReferralPage />} />
        <Route path="admin"         element={<AdminPage />} />
        <Route path="changelog" element={<ChangelogPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="community/groups" element={<GroupsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
