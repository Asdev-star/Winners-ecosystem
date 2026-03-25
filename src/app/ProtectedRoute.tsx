import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/auth/authStore";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const user = useAuthStore((state) => state.user);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const location = useLocation();

  if (isRestoring) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
