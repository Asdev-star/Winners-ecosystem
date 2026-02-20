import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./app/ProtectedRoute";

import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import ProfilePage from "./features/profile/ProfilePage";
import CoursesPage from "./features/courses/CoursesPage";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import ArchitectureDiagram from "./components/docs/ArchitectureDiagram";
import TeamPage          from "./features/team/TeamPage";
import AcceptInvitePage  from "./features/team/AcceptInvitePage";
import OnboardingPage    from "./features/team/OnboardingPage";
import ExportPage from "./features/export/ExportPage";
import BillingPage from "./features/billing/BillingPage";
import SettingsPage from "./features/settings/SettingsPage";
import EmailReportsPage from "./features/email/EmailReportsPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import LandingPage from "./features/landing/LandingPage";


function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="settings" element={<SettingsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/architecture" element={<ArchitectureDiagram />} />
      <Route path="/invite/accept" element={<AcceptInvitePage />} />
<Route path="/onboarding"    element={<OnboardingPage />} />
<Route path="/billing" element={<BillingPage />} />
<Route path="/email" element={<EmailReportsPage />} />
<Route path="/landing" element={<LandingPage />} />
      {/* Protected Layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="export" element={<ExportPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}

export default App;