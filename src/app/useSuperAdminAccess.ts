import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { useAuthStore } from "../features/auth/authStore";

interface SuperAdminAccessState {
  hasAccess: boolean;
  isChecking: boolean;
}

export function useSuperAdminAccess(): SuperAdminAccessState {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const isConfiguredSuperAdmin = !!user?.email && adminEmails.includes(user.email.toLowerCase());

    async function checkAccess() {
      if (isRestoring) return;

      if (!user || !token || !isConfiguredSuperAdmin) {
        if (!cancelled) {
          setHasAccess(false);
          setIsChecking(false);
        }
        return;
      }

      setIsChecking(true);

      try {
        const res = await fetch(`${API_BASE}/admin/access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) return;

        setHasAccess(res.ok);
      } catch {
        if (cancelled) return;
        setHasAccess(false);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [user, token, isRestoring]);

  return { hasAccess, isChecking };
}
