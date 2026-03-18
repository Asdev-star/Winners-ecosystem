import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore, type AuthUser } from "./authStore";

const TOKEN_KEY = "we_token";
const USER_KEY = "we_user";
const IMPERSONATION_KEY = "we_impersonation";

const demoUser: AuthUser = {
  id: "user_1",
  email: "owner@winnersempire.io",
  name: "Owner User",
  role: "owner",
  tenantId: "tenant_1",
  tenantName: "Winners Empire",
};

const impersonatedUser: AuthUser = {
  id: "user_2",
  email: "owner@techhub.co.ke",
  name: "TechHub Owner",
  role: "owner",
  tenantId: "tenant_2",
  tenantName: "TechHub Ltd",
};

describe("authStore session flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    useAuthStore.setState({
      user: null,
      token: null,
      impersonation: null,
      isLoading: false,
      isRestoring: false,
      pendingTwoFactor: null,
    });
  });

  it("restores a valid persisted session", async () => {
    localStorage.setItem(TOKEN_KEY, "token_123");
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: demoUser }),
    } as Response);

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.token).toBe("token_123");
    expect(state.user).toEqual(demoUser);
    expect(state.isRestoring).toBe(false);
    expect(localStorage.getItem(USER_KEY)).toBeTruthy();
  });

  it("restores impersonation metadata when an impersonation session is persisted", async () => {
    localStorage.setItem(TOKEN_KEY, "impersonation_token");
    localStorage.setItem(
      IMPERSONATION_KEY,
      JSON.stringify({
        originalToken: "admin_token",
        originalUser: demoUser,
        adminId: "admin_1",
        targetTenantId: "tenant_2",
        targetUserId: "user_2",
        startedAt: "2026-03-18T08:00:00.000Z",
        returnToPath: "/admin/tenants/tenant_2",
      }),
    );

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: impersonatedUser }),
    } as Response);

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.user?.isImpersonation).toBe(true);
    expect(state.user?.impersonatedByAdminId).toBe("admin_1");
    expect(state.impersonation?.returnToPath).toBe("/admin/tenants/tenant_2");
  });

  it("clears persisted data when token validation fails", async () => {
    localStorage.setItem(TOKEN_KEY, "expired_token");
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Token expired" }),
    } as Response);

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(localStorage.getItem(IMPERSONATION_KEY)).toBeNull();
  });

  it("can begin and end impersonation without losing the original admin session", () => {
    useAuthStore.setState({
      token: "admin_token",
      user: demoUser,
      impersonation: null,
    });

    useAuthStore.getState().beginImpersonation("impersonation_token", impersonatedUser, {
      adminId: "admin_1",
      targetTenantId: "tenant_2",
      targetUserId: "user_2",
      returnToPath: "/admin/tenants/tenant_2",
    });

    let state = useAuthStore.getState();
    expect(state.token).toBe("impersonation_token");
    expect(state.user?.tenantName).toBe("TechHub Ltd");
    expect(state.user?.isImpersonation).toBe(true);
    expect(state.impersonation?.originalUser.email).toBe(demoUser.email);

    useAuthStore.getState().endImpersonation();

    state = useAuthStore.getState();
    expect(state.token).toBe("admin_token");
    expect(state.user).toEqual(demoUser);
    expect(state.impersonation).toBeNull();
    expect(localStorage.getItem(IMPERSONATION_KEY)).toBeNull();
  });

  it("logout clears in-memory and localStorage auth state", () => {
    localStorage.setItem(TOKEN_KEY, "token_abc");
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    localStorage.setItem(
      IMPERSONATION_KEY,
      JSON.stringify({
        originalToken: "admin_token",
        originalUser: demoUser,
        adminId: "admin_1",
        targetTenantId: "tenant_2",
        targetUserId: "user_2",
        startedAt: "2026-03-18T08:00:00.000Z",
      }),
    );

    useAuthStore.setState({
      token: "token_abc",
      user: demoUser,
      impersonation: {
        originalToken: "admin_token",
        originalUser: demoUser,
        adminId: "admin_1",
        targetTenantId: "tenant_2",
        targetUserId: "user_2",
        startedAt: "2026-03-18T08:00:00.000Z",
      },
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.impersonation).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(localStorage.getItem(IMPERSONATION_KEY)).toBeNull();
  });
});
