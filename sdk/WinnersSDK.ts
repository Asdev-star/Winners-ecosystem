// sdk/WinnersSDK.ts
// ─── Core Infrastructure: Developer SDK Foundation ────────────────────────────
// Provides a typed, versioned client library for developers building on the
// Winners Ecosystem API. This is Phase 1 of the SDK — authentication and
// basic resource access. Will expand as each platform phase goes live.
// Roadmap requirement: "Developer SDK foundation" (Block 1, Item 3)
// Cloud API Products: AI Assistant API, Certificate Verification, Academy, Market

export interface SDKConfig {
  apiKey?: string; // API key or JWT token
  token?: string; // Explicit JWT token (optional)
  tenantId?: string; // The tenant context (optional)
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
  public readonly code: string;
  public readonly status: number;
  public readonly requestId: string | null;

  constructor(
    message: string,
    code: string,
    status: number,
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "WinnersSDKError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

// ─── HTTP Client ───────────────────────────────────────────────────────────────

class HTTPClient {
  private readonly config: Required<SDKConfig>;

  constructor(config: Required<SDKConfig>) {
    this.config = config;
  }

  private buildUrl(path: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    const version = this.config.version;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    
    // If the path already includes /api/v1, don't double it
    if (cleanPath.startsWith(`/api/${version}`)) {
      return `${base}${cleanPath}`;
    }
    
    return `${base}/api/${version}${cleanPath}`;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-SDK-Version": "1.0.0",
    };

    const auth = this.config.token || this.config.apiKey;
    if (auth) {
      headers["Authorization"] = `Bearer ${auth}`;
    }

    if (this.config.tenantId) {
      headers["X-Tenant-ID"] = this.config.tenantId;
    }

    return headers;
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

  async stream(method: string, path: string, body?: unknown, onChunk?: (chunk: string) => void): Promise<void> {
    const url = this.buildUrl(path);
    const controller = new AbortController();

    if (this.config.debug) {
      console.log(`[WinnersSDK] STREAM ${method} ${url}`, body ?? "");
    }

    try {
      const res = await fetch(url, {
        method,
        headers: this.buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new WinnersSDKError(
          (json as any).message ?? (json as any).error ?? `HTTP ${res.status}`,
          (json as any).code ?? "API_ERROR",
          res.status,
          res.headers.get("X-Request-ID"),
        );
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onChunk?.(decoder.decode(value));
      }
    } catch (err: any) {
      if (err instanceof WinnersSDKError) throw err;
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
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

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
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

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
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

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
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

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
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

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

// ─── Cloud API: AI Assistant Resource ─────────────────────────────────────────────

export type AssistantName = "omega" | "aria" | "nova" | "sage" | "atlas" | "forge" | "circuit" | "nexus" | "herald";

export interface AIChatRequest {
  message: string;
  assistant?: AssistantName;
  model?: "claude" | "gpt-4o" | "gemini" | "ollama";
  files?: string[]; // Base64 encoded or URLs
  context?: Record<string, unknown>;
}

export interface AIChatResponse {
  message: string;
  assistant: AssistantName;
  provider: string;
  tokensUsed: number;
  latencyMs: number;
}

class AIResource {
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /** Chat with any AI assistant */
  chat(request: AIChatRequest) {
    return this.http.post<AIChatResponse>("/ai/chat", request);
  }

  /** Get AI recommendation based on user context */
  getRecommendation(context: { type: string; userId?: string }) {
    return this.http.post<{ recommendation: string; confidence: number }>("/ai/recommend", context);
  }

  /** Stream AI response (SSE) - returns SSE stream response */
  streamChat(request: AIChatRequest, onChunk: (chunk: string) => void) {
    return this.http.stream("POST", "/ai/chat/stream", request, onChunk);
  }

  /** Get assistant memory for a user */
  getMemory(userId: string, assistant: AssistantName) {
    return this.http.get<{ memories: unknown[] }>(`/ai/memory/${assistant}?userId=${userId}`);
  }

  /** Log AI interaction for analytics */
  logInteraction(interaction: { type: string; input: string; output: string; tokens: number }) {
    return this.http.post<{ id: string }>("/ai/interactions", interaction);
  }
}

// ─── Cloud API: Academy Resource ───────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  instructor: { id: string; name: string; avatar?: string };
  price: number;
  currency: string;
  duration: number; // minutes
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  level: "beginner" | "intermediate" | "advanced";
  tags: string[];
  createdAt: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  issuedAt: string;
  verificationUrl: string;
}

class AcademyResource {
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /** List all courses */
  listCourses(params?: { page?: number; limit?: number; level?: string; tag?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.http.get<{ courses: Course[]; total: number; hasMore: boolean }>(`/academy/courses?${query}`);
  }

  /** Get a specific course */
  getCourse(slug: string) {
    return this.http.get<Course>(`/academy/courses/${slug}`);
  }

  /** Enroll in a course */
  enroll(courseId: string) {
    return this.http.post<{ enrollmentId: string }>("/academy/enrollments", { courseId });
  }

  /** Get user enrollments */
  getEnrollments() {
    return this.http.get<{ enrollments: unknown[] }>("/academy/enrollments");
  }

  /** Get lesson progress */
  getProgress(enrollmentId: string) {
    return this.http.get<{ progress: number; completedLessons: string[] }>(`/academy/enrollments/${enrollmentId}/progress`);
  }

  /** Complete a lesson */
  completeLesson(enrollmentId: string, lessonId: string) {
    return this.http.post<{ progress: number }>(`/academy/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {});
  }

  /** Get user's certificates */
  getCertificates() {
    return this.http.get<{ certificates: Certificate[] }>("/academy/certificates");
  }

  /** Verify a certificate (public endpoint) */
  verifyCertificate(certificateId: string) {
    return this.http.get<{ valid: boolean; certificate: Certificate }>(`/academy/certificates/verify/${certificateId}`);
  }
}

// ─── Cloud API: Market Resource ─────────────────────────────────────────────────

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  vendor: { id: string; name: string; verified: boolean };
  category: string;
  tags: string[];
  stock: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  items: { product: Product; quantity: number; price: number }[];
  total: number;
  currency: string;
  createdAt: string;
}

class MarketResource {
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /** List products */
  listProducts(params?: { page?: number; limit?: number; category?: string; vendorId?: string; search?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.http.get<{ products: Product[]; total: number; hasMore: boolean }>(`/products?${query}`);
  }

  /** Get a specific product */
  getProduct(productId: string) {
    return this.http.get<Product>(`/products/${productId}`);
  }

  /** Get user's cart */
  getCart() {
    return this.http.get<{ items: CartItem[]; total: number }>("/cart");
  }

  /** Add item to cart */
  addToCart(item: CartItem) {
    return this.http.post<{ items: CartItem[]; total: number }>("/cart/items", item);
  }

  /** Update cart item quantity */
  updateCartItem(productId: string, quantity: number) {
    return this.http.patch<{ items: CartItem[]; total: number }>(`/cart/items/${productId}`, { quantity });
  }

  /** Remove item from cart */
  removeFromCart(productId: string) {
    return this.http.delete<{ items: CartItem[]; total: number }>(`/cart/items/${productId}`);
  }

  /** Create order from cart */
  checkout() {
    return this.http.post<{ order: Order; checkoutUrl: string }>("/orders", {});
  }

  /** Get order details */
  getOrder(orderId: string) {
    return this.http.get<Order>(`/orders/${orderId}`);
  }

  /** Get user's orders */
  listOrders(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.http.get<{ orders: Order[]; total: number; hasMore: boolean }>(`/orders?${query}`);
  }
}

// ─── Cloud API: Certificate Verification Resource ───────────────────────────────

class CertificateResource {
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /** Verify an Academy certificate */
  verify(certificateId: string) {
    return this.http.get<{
      valid: boolean;
      certificate: {
        id: string;
        recipientName: string;
        courseTitle: string;
        issuedAt: string;
        verificationUrl: string;
      };
    }>(`/api/v1/certificates/verify/${certificateId}`);
  }

  /** Get certificate details */
  get(certificateId: string) {
    return this.http.get<{
      id: string;
      recipientName: string;
      courseTitle: string;
      issuedAt: string;
      verificationUrl: string;
    }>(`/certificates/${certificateId}`);
  }
}

// ─── Cloud API: Webhook Helper Resource ─────────────────────────────────────────

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  tenantId: string;
  signature?: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
}

class WebhookResource {
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /** List webhook subscriptions */
  list() {
    return this.http.get<{ webhooks: WebhookSubscription[] }>("/cloud/webhooks");
  }

  /** Create webhook subscription */
  create(data: { url: string; events: string[] }) {
    return this.http.post<{ webhook: WebhookSubscription }>("/cloud/webhooks", data);
  }

  /** Delete webhook subscription */
  delete(webhookId: string) {
    return this.http.delete<{ success: boolean }>(`/cloud/webhooks/${webhookId}`);
  }

  /** Get webhook delivery history */
  getDeliveries(webhookId: string) {
    return this.http.get<{ deliveries: unknown[] }>(`/cloud/webhooks/${webhookId}/deliveries`);
  }

  /** Verify webhook signature (HMAC-SHA256) */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return `sha256=${expected}` === signature;
  }

  /** Parse webhook event from request body */
  parseEvent(body: unknown): WebhookEvent | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    if (!b.event || !b.timestamp || !b.data) return null;
    return b as unknown as WebhookEvent;
  }
}

// ─── Cloud API: Plugin Marketplace Resource ──────────────────────────────────────

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  price: number;
  revenueShare: number;
  installCount: number;
  reviewCount: number;
  published: boolean;
  verified: boolean;
  manifest: Record<string, unknown>;
}

export interface PluginInstall {
  id: string;
  pluginId: string;
  tenantId: string;
  active: boolean;
  config: Record<string, unknown>;
  installedAt: string;
}

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

class PluginResource {
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /** List published plugins */
  list(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.http.get<{ plugins: Plugin[] }>(`/plugins?${query}`);
  }

  /** Get plugin details */
  get(pluginId: string) {
    return this.http.get<Plugin>(`/plugins/${pluginId}`);
  }

  /** Install a plugin */
  install(pluginId: string, config?: Record<string, unknown>) {
    return this.http.post<{ install: PluginInstall }>(`/plugins/${pluginId}/install`, { config });
  }

  /** List installed plugins */
  listInstalled() {
    return this.http.get<{ installs: (PluginInstall & { plugin: Plugin })[] }>("/plugins/installed");
  }

  /** Uninstall a plugin */
  uninstall(installId: string) {
    return this.http.delete<{ success: boolean }>(`/plugins/installed/${installId}`);
  }

  /** Submit a plugin for review */
  submit(data: {
    name: string;
    description: string;
    version: string;
    category: string;
    price: number;
    manifest: Record<string, unknown>;
  }) {
    return this.http.post<{ plugin: Plugin }>("/plugins/submit", data);
  }

  /** Get plugin reviews */
  getReviews(pluginId: string) {
    return this.http.get<{ reviews: PluginReview[] }>(`/plugins/${pluginId}/reviews`);
  }

  /** Add plugin review */
  addReview(pluginId: string, rating: number, comment: string) {
    return this.http.post<{ review: PluginReview }>(`/plugins/${pluginId}/review`, { rating, comment });
  }
}

// ─── Cloud API: White-label Licensing Resource ───────────────────────────────────

export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    faviconUrl?: string;
  };
  features: string[];
  active: boolean;
  createdAt: string;
}

class WhiteLabelResource {
  private readonly http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /** Get tenant configuration */
  getConfig() {
    return this.http.get<TenantConfig>("/whitelabel/config");
  }

  /** Update tenant branding */
  updateBranding(branding: TenantConfig["branding"]) {
    return this.http.patch<{ config: TenantConfig }>("/whitelabel/branding", { branding });
  }

  /** Enable/disable features */
  updateFeatures(features: string[]) {
    return this.http.patch<{ config: TenantConfig }>("/whitelabel/features", { features });
  }

  /** Provision new sub-tenant */
  provisionSubtenant(data: { name: string; domain: string; plan: string }) {
    return this.http.post<{ tenant: TenantConfig }>("/whitelabel/provision", data);
  }
}

// ─── Main SDK Class ────────────────────────────────────────────────────────────

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName?: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: AuthSessionUser;
}

export interface TenantSummary {
  id: string;
  name: string;
  plan: string;
  createdAt?: string;
  memberCount?: number;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  skills?: string[];
  industry?: string | null;
  isPublicProfile?: boolean;
  metadata?: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  username?: string;
  displayName?: string;
  createdAt?: string;
}

export interface JobListing {
  id: string;
  title: string;
  description?: string;
  category?: string;
  currency?: string;
}

export interface ContractData {
  id: string;
  title?: string;
  status?: string;
  createdAt?: string;
}

export interface CloudOverviewData {
  apiKeys?: number;
  connectors?: number;
  activeAutomations?: number;
  activeAgents?: number;
  creditsUsed30d?: number;
  apiCalls30d?: number;
}

class AuthResource {
  private readonly http: HTTPClient;
  constructor(http: HTTPClient) {
    this.http = http;
  }
  register(data: { email: string; password: string; name: string; refCode?: string }) { return this.http.post<AuthSession>("/auth/register", data); }
  login(data: { email: string; password: string }) { return this.http.post<AuthSession>("/auth/login", data); }
  refresh(data: { refreshToken: string }) { return this.http.post<AuthSession>("/auth/refresh", data); }
  me() { return this.http.get<{ user: AuthSessionUser }>("/auth/me"); }
  acceptInvite(data: { token: string; name: string; password: string }) { return this.http.post<{ message: string; user?: AuthSessionUser }>("/auth/accept-invite", data); }
  googleExchange(data: { code: string; redirectUri?: string }) { return this.http.post<AuthSession>("/auth/google/exchange", data); }
  facebookExchange(data: { code: string; redirectUri?: string }) { return this.http.post<AuthSession>("/auth/facebook/exchange", data); }
}

class TenantsResource {
  private readonly http: HTTPClient;
  constructor(http: HTTPClient) {
    this.http = http;
  }
  getCurrent() { return this.http.get<TenantSummary>("/tenants/me"); }
  updateCurrent(data: { name?: string; settings?: { timezone?: string; currency?: string; fiscalMonth?: number } }) { return this.http.patch<{ message: string; tenant: TenantSummary }>("/tenants/me", data); }
  listMembers() { return this.http.get<{ tenantId: string; members: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>; total: number }>("/tenants/me/members"); }
  getBilling() { return this.http.get<{ tenantId: string; plan: string; status: string; nextBillingDate: string; seats: { used: number; limit: number }; monthlyCost: number }>("/tenants/me/billing"); }
  deleteCurrent() { return this.http.delete<{ message: string; tenantId: string; deletedAt: string }>("/tenants/me"); }
}

class ProfileResource {
  private readonly http: HTTPClient;
  constructor(http: HTTPClient) {
    this.http = http;
  }
  get() { return this.http.get<{ profile: UserProfileData }>("/profile"); }
  saveOnboarding(data: Record<string, unknown>) { return this.http.post<{ message: string; route: string; supervisor: string; welcomeMessage?: string }>("/profile/onboarding", data); }
  update(data: Partial<UserProfileData>) { return this.http.patch<{ message: string; profile: UserProfileData }>("/profile", data); }
  updatePassword(data: { currentPassword: string; newPassword: string }) { return this.http.patch<{ message: string }>("/profile/password", data); }
  delete() { return this.http.delete<{ message: string }>("/profile"); }
}

class NotificationsResource {
  private readonly http: HTTPClient;
  constructor(http: HTTPClient) {
    this.http = http;
  }
  list() { return this.http.get<{ notifications: NotificationItem[]; total: number; unread: number }>("/notifications"); }
  registerDeviceToken(data: { token: string; platform?: string; userAgent?: string }) { return this.http.post<{ success: boolean }>("/notifications/device-token", data); }
  unregisterDeviceToken(token: string) { return this.http.request<{ success: boolean }>("DELETE", "/notifications/device-token", { token }); }
  markRead(notificationId: string) { return this.http.patch<{ message: string }>(`/notifications/${notificationId}/read`, {}); }
  markAllRead() { return this.http.patch<{ message: string }>("/notifications/read-all", {}); }
  delete(notificationId: string) { return this.http.delete<{ message: string }>(`/notifications/${notificationId}`); }
  clearAll() { return this.http.delete<{ message: string }>("/notifications"); }
  create(data: Record<string, unknown>) { return this.http.post<{ notification: NotificationItem }>("/notifications", data); }
  getPreferences() { return this.http.get<Record<string, unknown>>("/notifications/preferences"); }
  updatePreferences(patch: Record<string, boolean | undefined>) { return this.http.patch<Record<string, unknown>>("/notifications/preferences", patch); }
  testPush(data: { title: string; body: string; userId?: string; type?: string }) { return this.http.post<{ success: boolean }>("/notifications/push/test", data); }
}

class SocialResource {
  private readonly http: HTTPClient;
  constructor(http: HTTPClient) {
    this.http = http;
  }
  listAccounts() { return this.http.get<SocialAccount[]>("/social/accounts"); }
  connectAccount(data: { platform: string }) { return this.http.post<{ authUrl: string; platform: string; message: string }>("/social/accounts/connect", data); }
  connectDemoAccount(data: { platform: string; username: string }) { return this.http.post<{ id: string; platform: string; username: string; displayName: string; message: string }>("/social/accounts/connect/demo", data); }
  disconnectAccount(accountId: string) { return this.http.delete<{ message: string }>(`/social/accounts/${accountId}`); }
  syncAccount(accountId: string) { return this.http.post<{ message: string; lastSynced: string }>(`/social/accounts/${accountId}/sync`, {}); }
  publish(data: { content: string; mediaUrls?: string[]; communityPostId?: string; platforms: string[] }) { return this.http.post<{ results: Array<{ platform: string; status: string; message?: string; error?: string }> }>("/social/publish", data); }
  schedule(data: { content: string; mediaUrls?: string[]; communityPostId?: string; platform: string; scheduledFor: string }) { return this.http.post<{ id: string; platform: string; scheduledFor: string; message: string }>("/social/schedule", data); }
  listScheduled() { return this.http.get<{ scheduled: Array<{ id: string; platform: string; scheduledFor: string }> }>("/social/scheduled"); }
  deleteScheduled(scheduleId: string) { return this.http.delete<{ success: boolean }>(`/social/scheduled/${scheduleId}`); }
  getAnalyticsOverview() { return this.http.get<Record<string, unknown>>("/social/analytics/overview"); }
  getAnalyticsByPlatform(platform: string) { return this.http.get<Record<string, unknown>>(`/social/analytics/platform/${platform}`); }
  getAnalyticsPosts() { return this.http.get<Record<string, unknown>>("/social/analytics/posts"); }
  getAnalyticsGrowth() { return this.http.get<Record<string, unknown>>("/social/analytics/growth"); }
  getAnalyticsBestTimes() { return this.http.get<Record<string, unknown>>("/social/analytics/best-times"); }
  getNovaInsights() { return this.http.get<Record<string, unknown>>("/social/nova/insights"); }
  createNovaPrediction(data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>("/social/nova/prediction", data); }
  getNovaRoiReport() { return this.http.get<Record<string, unknown>>("/social/nova/roi-report"); }
  getNovaWeeklyBriefing() { return this.http.get<Record<string, unknown>>("/social/nova/weekly-briefing"); }
  listConnections() { return this.http.get<Record<string, unknown>>("/social/connections"); }
  deleteConnection(connectionId: string) { return this.http.delete<{ success: boolean }>(`/social/connections/${connectionId}`); }
  connect(data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>("/social/connect", data); }
  getSuggestions() { return this.http.get<Record<string, unknown>>("/social/suggestions"); }
  updateCollab(collabId: string, data: Record<string, unknown>) { return this.http.patch<Record<string, unknown>>(`/social/collab/${collabId}`, data); }
}

class WorkResource {
  private readonly http: HTTPClient;
  constructor(http: HTTPClient) {
    this.http = http;
  }
  listJobs(params?: { page?: number; limit?: number; category?: string; jobType?: string; search?: string; status?: string }) {
    const query = new URLSearchParams(Object.entries(params ?? {}).reduce<Record<string, string>>((acc, [key, value]) => { if (value !== undefined && value !== null) acc[key] = String(value); return acc; }, {})).toString();
    return this.http.get<{ jobs: JobListing[]; total: number; page?: number; pages?: number }>(`/work/jobs${query ? `?${query}` : ""}`);
  }
  getJob(jobId: string) { return this.http.get<JobListing>(`/work/jobs/${jobId}`); }
  createJob(data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>("/work/jobs", data); }
  updateJob(jobId: string, data: Record<string, unknown>) { return this.http.patch<Record<string, unknown>>(`/work/jobs/${jobId}`, data); }
  deleteJob(jobId: string) { return this.http.delete<{ success: boolean }>(`/work/jobs/${jobId}`); }
  listFreelancers(params?: { page?: number; limit?: number; search?: string; skill?: string }) {
    const query = new URLSearchParams(Object.entries(params ?? {}).reduce<Record<string, string>>((acc, [key, value]) => { if (value !== undefined && value !== null) acc[key] = String(value); return acc; }, {})).toString();
    return this.http.get<{ freelancers: Array<Record<string, unknown>>; total?: number }>(`/work/freelancers${query ? `?${query}` : ""}`);
  }
  getMyFreelancerProfile() { return this.http.get<{ freelancer: Record<string, unknown> }>("/work/freelancers/me"); }
  createFreelancerProfile(data: Record<string, unknown>) { return this.http.post<{ freelancer: Record<string, unknown> }>("/work/freelancers", data); }
  getFreelancer(freelancerId: string) { return this.http.get<Record<string, unknown>>(`/work/freelancers/${freelancerId}`); }
  createPortfolio(data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>("/work/freelancers/portfolio", data); }
  applyToJob(jobId: string, data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>(`/work/jobs/${jobId}/apply`, data); }
  listJobApplications(jobId: string) { return this.http.get<Record<string, unknown>>(`/work/jobs/${jobId}/applications`); }
  listMyApplications() { return this.http.get<Record<string, unknown>>("/work/applications/mine"); }
  updateApplicationStatus(applicationId: string, data: Record<string, unknown>) { return this.http.patch<Record<string, unknown>>(`/work/applications/${applicationId}/status`, data); }
  listContracts(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(Object.entries(params ?? {}).reduce<Record<string, string>>((acc, [key, value]) => { if (value !== undefined && value !== null) acc[key] = String(value); return acc; }, {})).toString();
    return this.http.get<{ contracts: ContractData[] }>(`/work/contracts${query ? `?${query}` : ""}`);
  }
  getContract(contractId: string) { return this.http.get<ContractData>(`/work/contracts/${contractId}`); }
  getCircuitRecommendations() { return this.http.get<Record<string, unknown>>("/work/circuit/recommendations"); }
  createCircuitProposal(jobId: string, data?: Record<string, unknown>) { return this.http.post<Record<string, unknown>>(`/work/circuit/proposal/${jobId}`, data ?? {}); }
  reviewContract(contractId: string, data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>(`/work/contracts/${contractId}/review`, data); }
  getContractReviews(contractId: string) { return this.http.get<Record<string, unknown>>(`/work/contracts/${contractId}/reviews`); }
  getStats() { return this.http.get<Record<string, unknown>>("/work/stats"); }
}

class CloudResource {
  private readonly http: HTTPClient;
  constructor(http: HTTPClient) {
    this.http = http;
  }
  getOverview() { return this.http.get<CloudOverviewData>("/cloud/overview"); }
  listApiKeys() { return this.http.get<{ keys: Array<Record<string, unknown>> }>("/cloud/keys"); }
  createApiKey(data: { name: string; scopes?: string[]; rateLimitRpm?: number; expiresAt?: string }) { return this.http.post<{ key: Record<string, unknown>; message: string }>("/cloud/keys", data); }
  revokeApiKey(keyId: string) { return this.http.delete<{ success: boolean }>(`/cloud/keys/${keyId}`); }
  listConnectors(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams(Object.entries(params ?? {}).reduce<Record<string, string>>((acc, [key, value]) => { if (value !== undefined && value !== null) acc[key] = String(value); return acc; }, {})).toString();
    return this.http.get<{ connectors: Array<Record<string, unknown>> }>(`/cloud/connectors${query ? `?${query}` : ""}`);
  }
  listInstalledConnectors() { return this.http.get<{ installs: Array<Record<string, unknown>> }>("/cloud/connectors/installed"); }
  installConnector(connectorId: string) { return this.http.post<{ install: Record<string, unknown> }>(`/cloud/connectors/${connectorId}/install`, {}); }
  uninstallConnector(installId: string) { return this.http.delete<{ success: boolean }>(`/cloud/connectors/installed/${installId}`); }
  listWebhooks() { return this.http.get<{ webhooks: Array<Record<string, unknown>> }>("/cloud/webhooks"); }
  createWebhook(data: { url: string; events: string[] }) { return this.http.post<{ webhook: Record<string, unknown> }>("/cloud/webhooks", data); }
  deleteWebhook(webhookId: string) { return this.http.delete<{ success: boolean }>(`/cloud/webhooks/${webhookId}`); }
  getWebhookDeliveries(webhookId: string) { return this.http.get<{ deliveries: Array<Record<string, unknown>> }>(`/cloud/webhooks/${webhookId}/deliveries`); }
  listAutomations() { return this.http.get<{ automations: Array<Record<string, unknown>> }>("/cloud/automations"); }
  createAutomation(data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>("/cloud/automations", data); }
  updateAutomation(automationId: string, data: Record<string, unknown>) { return this.http.patch<Record<string, unknown>>(`/cloud/automations/${automationId}`, data); }
  deleteAutomation(automationId: string) { return this.http.delete<{ success: boolean }>(`/cloud/automations/${automationId}`); }
  getAutomationRuns(automationId: string) { return this.http.get<Record<string, unknown>>(`/cloud/automations/${automationId}/runs`); }
  listAgents() { return this.http.get<{ agents: Array<Record<string, unknown>> }>("/cloud/agents"); }
  createAgent(data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>("/cloud/agents", data); }
  updateAgent(agentId: string, data: Record<string, unknown>) { return this.http.patch<Record<string, unknown>>(`/cloud/agents/${agentId}`, data); }
  deleteAgent(agentId: string) { return this.http.delete<{ success: boolean }>(`/cloud/agents/${agentId}`); }
  getAgentRuns(agentId: string) { return this.http.get<Record<string, unknown>>(`/cloud/agents/${agentId}/runs`); }
  getUsage() { return this.http.get<Record<string, unknown>>("/cloud/usage"); }
  getSites() { return this.http.get<Record<string, unknown>>("/cloud/sites"); }
  listDnsZones() { return this.http.get<Record<string, unknown>>("/cloud/dns"); }
  createDnsZone(data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>("/cloud/dns", data); }
  createDnsRecord(zoneId: string, data: Record<string, unknown>) { return this.http.post<Record<string, unknown>>(`/cloud/dns/${zoneId}/records`, data); }
}

export class WinnersSDK {
  public readonly auth: AuthResource;
  public readonly tenants: TenantsResource;
  public readonly profile: ProfileResource;
  public readonly notifications: NotificationsResource;
  public readonly social: SocialResource;
  public readonly work: WorkResource;
  public readonly cloud: CloudResource;
  public readonly analytics: AnalyticsResource;
  public readonly community: CommunityResource;
  public readonly users: UsersResource;
  public readonly billing: BillingResource;
  public readonly gdpr: GDPRResource;
  public readonly ai: AIResource;
  public readonly academy: AcademyResource;
  public readonly market: MarketResource;
  public readonly certificates: CertificateResource;
  public readonly webhooks: WebhookResource;
  public readonly plugins: PluginResource;
  public readonly whitelabel: WhiteLabelResource;

  private readonly http: HTTPClient;

  constructor(config: SDKConfig) {
    const resolved: Required<SDKConfig> = {
      baseUrl: config.baseUrl ?? "https://winners-empire-eco.up.railway.app",
      version: config.version ?? "v1",
      timeout: config.timeout ?? 30_000,
      debug: config.debug ?? false,
      apiKey: config.apiKey ?? "",
      token: config.token ?? "",
      tenantId: config.tenantId ?? "",
    };

    this.http = new HTTPClient(resolved);
    this.auth = new AuthResource(this.http);
    this.tenants = new TenantsResource(this.http);
    this.profile = new ProfileResource(this.http);
    this.notifications = new NotificationsResource(this.http);
    this.social = new SocialResource(this.http);
    this.work = new WorkResource(this.http);
    this.cloud = new CloudResource(this.http);
    this.analytics = new AnalyticsResource(this.http);
    this.community = new CommunityResource(this.http);
    this.users = new UsersResource(this.http);
    this.billing = new BillingResource(this.http);
    this.gdpr = new GDPRResource(this.http);
    this.ai = new AIResource(this.http);
    this.academy = new AcademyResource(this.http);
    this.market = new MarketResource(this.http);
    this.certificates = new CertificateResource(this.http);
    this.webhooks = new WebhookResource(this.http);
    this.plugins = new PluginResource(this.http);
    this.whitelabel = new WhiteLabelResource(this.http);
  }

  /** Escape hatch for any route exposed by the API gateway. */
  request<T>(method: string, path: string, body?: unknown) {
    return this.http.request<T>(method, path, body);
  }

  /** Stream any route that supports chunked or SSE-style responses. */
  stream(method: string, path: string, body?: unknown, onChunk?: (chunk: string) => void) {
    return this.http.stream(method, path, body, onChunk);
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
 * ─── Winners Cloud API SDK ─────────────────────────────────────────────────────
 * 
 * Cloud API Products:
 * - AI Assistant API: Call any of 9 assistants (OMEGA, ARIA, NOVA, SAGE, ATLAS, etc.)
 * - Academy API: Courses, enrollments, certificates
 * - Market API: Products, cart, orders
 * - Certificate Verification API: Verify Academy certificates
 * - Webhooks API: Subscribe to ecosystem events with HMAC-signed payloads
 * - Plugin Marketplace: Install, publish, and monetize plugins
 * - White-label Licensing: Enterprise branding and sub-tenant provisioning
 * 
 * Full documentation: https://docs.winnersempire.io/cloud-api
 * 
 * ─── SDK Usage Example ────────────────────────────────────────────────────────
 *
 * import { createWinnersClient } from "@winners/sdk";
 *
 * const winners = createWinnersClient({
 *   apiKey:   "wsk_live_...",
 *   tenantId: "t_your_tenant_id",
 * });
 *
 * // Get community feed
 * const { data: feed } = await winners.community.getFeed();
 *
 * // Chat with AI assistant
 * const { data: response } = await winners.ai.chat({
 *   message: "Help me with my business plan",
 *   assistant: "sage",
 *   model: "claude"
 * });
 *
 * // List courses
 * const { data: courses } = await winners.academy.listCourses({ level: "beginner" });
 *
 * // Enroll in a course
 * const { data: enrollment } = await winners.academy.enroll("course_id_here");
 *
 * // Verify a certificate
 * const { data: verification } = await winners.certificates.verify("cert_id_here");
 *
 * // Browse products
 * const { data: products } = await winners.market.listProducts({ category: "electronics" });
 *
 * // Add to cart
 * await winners.market.addToCart({ productId: "prod_123", quantity: 1 });
 *
 * // Track event
 * await winners.analytics.trackEvent({ type: "page_view", metadata: { page: "/dashboard" } });
 *
 * // Export data (GDPR)
 * const { data: myData } = await winners.gdpr.exportMyData();
 *
 * // Webhooks: Subscribe to events
 * const { data: webhook } = await winners.webhooks.create({
 *   url: "https://yourapp.com/webhook",
 *   events: ["user.trust_score_changed", "market.sale_completed"]
 * });
 *
 * // Verify webhook signature
 * const isValid = winners.webhooks.verifySignature(payload, signature, secret);
 *
 * // Plugins: Browse marketplace
 * const { data: plugins } = await winners.plugins.list({ category: "analytics" });
 *
 * // Install a plugin
 * await winners.plugins.install("plugin_id", { apiKey: "..." });
 *
 * // Submit your own plugin
 * await winners.plugins.submit({
 *   name: "My Analytics Plugin",
 *   description: "Advanced analytics dashboard",
 *   version: "1.0.0",
 *   category: "analytics",
 *   price: 9.99,
 *   manifest: { /* plugin manifest * / }
 * });
 *
 * // White-label: Get tenant config
 * const { data: config } = await winners.whitelabel.getConfig();
 *
 * // Update branding
 * await winners.whitelabel.updateBranding({
 *   logoUrl: "https://cdn.example.com/logo.png",
 *   primaryColor: "#C9A84C"
 * });
 */
