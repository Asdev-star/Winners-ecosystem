import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";

import MainLayout        from "./components/layout/MainLayout";
import ProtectedRoute    from "./app/ProtectedRoute";

import LoginPage         from "./features/auth/LoginPage";
import LandingPage       from "./features/landing/LandingPage";
import AcceptInvitePage  from "./features/team/AcceptInvitePage";
import ArchitectureDiagram from "./components/docs/ArchitectureDiagram";

import DashboardPage     from "./features/dashboard/DashboardPage";
import ProfilePage       from "./features/profile/ProfilePage";
import SettingsPage      from "./features/settings/SettingsPage";
import AnalyticsPage     from "./features/analytics/AnalyticsPage";
import TeamPage          from "./features/team/TeamPage";
import ExportPage        from "./features/export/ExportPage";
import BillingPage       from "./features/billing/BillingPage";
import EmailReportsPage  from "./features/email/EmailReportsPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import StripeDashboard from "./features/stripe/StripeDashboard";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage  from "./features/auth/ResetPasswordPage";
import OnboardingPage from "./features/onboarding/OnboardingPage";
import SlackSettingsPage from "./features/slack/SlackSettingsPage";


// Outside ProtectedRoute:
function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <Routes>

      {/* ── Public routes ── */}
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/landing"      element={<LandingPage />} />
      <Route path="/invite/accept" element={<AcceptInvitePage />} />
      <Route path="/onboarding"   element={<OnboardingPage />} />
      <Route path="/architecture" element={<ArchitectureDiagram />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password"  element={<ResetPasswordPage />} />
      

      {/* ── Protected routes (inside MainLayout) ── */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index             element={<DashboardPage />} />
        <Route path="analytics"     element={<AnalyticsPage />} />
        <Route path="team"          element={<TeamPage />} />
        <Route path="export"        element={<ExportPage />} />
        <Route path="billing"       element={<BillingPage />} />
        <Route path="email"         element={<EmailReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings"      element={<SettingsPage />} />
        <Route path="profile"       element={<ProfilePage />} />
        <Route path="slack" element={<SlackSettingsPage />} />
        <Route path="stripe" element={<StripeDashboard />} />
      </Route>

    </Routes>
  );
}

export default App;