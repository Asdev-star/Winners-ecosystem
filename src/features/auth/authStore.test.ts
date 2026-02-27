import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore, type AuthUser } from "./authStore";

const TOKEN_KEY = "we_token";
const USER_KEY = "we_user";

const demoUser: AuthUser = {
  id: "user_1",
  email: "owner@winnersempire.io",
  name: "Owner User",
  role: "owner",
  tenantId: "tenant_1",
  tenantName: "Winners Empire",
};

describe("authStore session flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    useAuthStore.setState({
      user: null,
      token: null,
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
  });

  it("logout clears in-memory and localStorage auth state", () => {
    localStorage.setItem(TOKEN_KEY, "token_abc");
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    useAuthStore.setState({ token: "token_abc", user: demoUser });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});
