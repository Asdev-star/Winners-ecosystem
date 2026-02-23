// sdk/WinnersSDK.ts
// ─── Core Infrastructure: Developer SDK Foundation ────────────────────────────
// Provides a typed, versioned client library for developers building on the
// Winners Ecosystem API. This is Phase 1 of the SDK — authentication and
// basic resource access. Will expand as each platform phase goes live.
// Roadmap requirement: "Developer SDK foundation" (Block 1, Item 3)

export interface SDKConfig {
  apiKey: string; // API key issued via developer dashboard
  tenantId: string; // The tenant context for all requests
  baseUrl?: string; // Override for self-hosted instances
  version?: "v1"; // API version (default: "v1")
  timeout?: number; // Request timeout in ms (default: 30000)
  debug?: boolean; // Enable request/response logging
}

export interface SDKResponse<T> {
  data: T | null;
  error: string | null;
  statusCode: number;
  requestId: string | null;
}

export class WinnersSDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public requestId: string | null = null,
  ) {
    super(message);
    this.name = "WinnersSDKError";
  }
}

// ─── HTTP Client ───────────────────────────────────────────────────────────────

class HTTPClient {
  constructor(private config: Required<SDKConfig>) {}

  private buildUrl(path: string): string {
    return `${this.config.baseUrl}/api/${this.config.version}${path}`;
  }

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      "X-Tenant-ID": this.config.tenantId,
      "X-SDK-Version": "1.0.0",
    };
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<SDKResponse<T>> {
    const url = this.buildUrl(path);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    if (this.config.debug) {
      console.log(`[WinnersSDK] ${method} ${url}`, body ?? "");
    }

    try {
      const res = await fetch(url, {
        method,
        headers: this.buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const requestId = res.headers.get("X-Request-ID");
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new WinnersSDKError(
          (json as any).message ?? (json as any).error ?? `HTTP ${res.status}`,
          (json as any).code ?? "API_ERROR",
          res.status,
          requestId,
        );
      }

      return { data: json as T, error: null, statusCode: res.status, requestId };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err instanceof WinnersSDKError) throw err;
      if (err.name === "AbortError") {
        throw new WinnersSDKError("Request timed out", "TIMEOUT", 408);
      }
      throw new WinnersSDKError(err.message, "NETWORK_ERROR", 0);
    }
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>("POST", path, body);
  }
  patch<T>(path: string, body: unknown) {
    return this.request<T>("PATCH", path, body);
  }
  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

// ─── Resource Modules ─────────────────────────────────────────────────────────

class AnalyticsResource {
  constructor(private http: HTTPClient) {}

  /** Get analytics overview for the tenant */
  getOverview(period: "7d" | "30d" | "90d" = "30d") {
    return this.http.get<{ revenue: unknown; events: unknown; growth: number }>(`/analytics?period=${period}`);
  }

  /** Log a custom analytics event */
  trackEvent(event: { type: string; metadata?: Record<string, unknown> }) {
    return this.http.post<{ id: string }>("/analytics/events", event);
  }
}

class CommunityResource {
  constructor(private http: HTTPClient) {}

  /** Get community feed */
  getFeed(page = 0, limit = 10) {
    return this.http.get<{ posts: unknown[]; total: number; hasMore: boolean }>(`/posts?page=${page}&limit=${limit}`);
  }

  /** Create a post */
  createPost(data: { content: string; tags?: string[] }) {
    return this.http.post<{ id: string; content: string }>("/posts", data);
  }

  /** Like or unlike a post */
  toggleLike(postId: string) {
    return this.http.post<{ liked: boolean; count: number }>(`/posts/${postId}/like`, {});
  }

  /** Get a user's profile */
  getProfile(userId: string) {
    return this.http.get<{ id: string; name: string; _count: unknown }>(`/posts/users/${userId}/profile`);
  }
}

class UsersResource {
  constructor(private http: HTTPClient) {}

  /** List tenant users */
  list() {
    return this.http.get<{ users: unknown[] }>("/users");
  }

  /** Invite a user to the tenant */
  invite(email: string, role: "admin" | "member" | "viewer") {
    return this.http.post<{ message: string }>("/users/invite", { email, role });
  }
}

class BillingResource {
  constructor(private http: HTTPClient) {}

  /** Get current subscription details */
  getSubscription() {
    return this.http.get<{ plan: string; status: string; seats: number }>("/billing/subscription");
  }

  /** Get revenue records */
  getRevenue(period: "7d" | "30d" | "90d" = "30d") {
    return this.http.get<{ records: unknown[] }>(`/billing/revenue?period=${period}`);
  }
}

class GDPRResource {
  constructor(private http: HTTPClient) {}

  /** Export all personal data for the authenticated user */
  exportMyData() {
    return this.http.get<Record<string, unknown>>("/gdpr/my-data");
  }

  /** Acknowledge privacy policy */
  acknowledgePrivacy(version = "1.0") {
    return this.http.post<{ message: string; acknowledgedAt: string }>("/gdpr/privacy-ack", { version });
  }

  /** Permanently delete account (irreversible) */
  deleteAccount() {
    return this.http.delete<{ message: string }>("/gdpr/me");
  }
}

// ─── Main SDK Class ────────────────────────────────────────────────────────────

export class WinnersSDK {
  public readonly analytics: AnalyticsResource;
  public readonly community: CommunityResource;
  public readonly users: UsersResource;
  public readonly billing: BillingResource;
  public readonly gdpr: GDPRResource;

  private readonly http: HTTPClient;

  constructor(config: SDKConfig) {
    const resolved: Required<SDKConfig> = {
      baseUrl: config.baseUrl ?? "https://winners-empire-eco.up.railway.app",
      version: config.version ?? "v1",
      timeout: config.timeout ?? 30_000,
      debug: config.debug ?? false,
      apiKey: config.apiKey,
      tenantId: config.tenantId,
    };

    this.http = new HTTPClient(resolved);
    this.analytics = new AnalyticsResource(this.http);
    this.community = new CommunityResource(this.http);
    this.users = new UsersResource(this.http);
    this.billing = new BillingResource(this.http);
    this.gdpr = new GDPRResource(this.http);
  }

  /** Get API health status */
  health() {
    return this.http.get<{ status: string; version: string; services: unknown }>("/health/ready");
  }

  /** Get the ecosystem registry — all registered platform modules */
  registry() {
    return this.http.get<{ totalApps: number; liveApps: number; apps: unknown[] }>("/registry");
  }
}

// ─── Convenience Factory ──────────────────────────────────────────────────────

export function createWinnersClient(config: SDKConfig): WinnersSDK {
  return new WinnersSDK(config);
}

export default WinnersSDK;

/*
 * ─── SDK Usage Example ────────────────────────────────────────────────────────
 *
 * import { createWinnersClient } from "@winners/sdk";
 *
 * const winners = createWinnersClient({
 *   apiKey:   "wsk_live_...",
 *   tenantId: "t_your_tenant_id",
 * });
 *
 * // Get feed
 * const { data: feed } = await winners.community.getFeed();
 *
 * // Track event
 * await winners.analytics.trackEvent({ type: "page_view", metadata: { page: "/dashboard" } });
 *
 * // Export data (GDPR)
 * const { data: myData } = await winners.gdpr.exportMyData();
 */
