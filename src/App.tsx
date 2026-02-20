import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";

import MainLayout        from "./components/layout/MainLayout";
import ProtectedRoute    from "./app/ProtectedRoute";

import LoginPage         from "./features/auth/LoginPage";
import LandingPage       from "./features/landing/LandingPage";
import AcceptInvitePage  from "./features/team/AcceptInvitePage";
import OnboardingPage    from "./features/team/OnboardingPage";
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
      </Route>

    </Routes>
  );
}

export default App;