// src/app/SuperAdminRoute.tsx
// Sovereign admin boundary for the hidden Core Engine realm.

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/authStore";
import type { ReactNode } from "react";
import { useSuperAdminAccess } from "./useSuperAdminAccess";
import HiddenNotFoundPage from "./HiddenNotFoundPage";

interface Props {
  children: ReactNode;
}

export default function SuperAdminRoute({ children }: Props) {
  const user = useAuthStore((s) => s.user);
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const { hasAccess, isChecking } = useSuperAdminAccess();

  if (isRestoring) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (isChecking) return null;

  // Non-admin identities should never see the sovereign command surface.
  if (!hasAccess) {
    return <HiddenNotFoundPage />;
  }

  return <>{children}</>;
}
