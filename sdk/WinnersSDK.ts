// sdk/WinnersSDK.ts
// ─── Core Infrastructure: Developer SDK Foundation ────────────────────────────
// Provides a typed, versioned client library for developers building on the
// Winners Ecosystem API. This is Phase 1 of the SDK — authentication and
// basic resource access. Will expand as each platform phase goes live.
// Roadmap requirement: "Developer SDK foundation" (Block 1, Item 3)
// Cloud API Products: AI Assistant API, Certificate Verification, Academy, Market

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
  constructor(private http: HTTPClient) {}

  /** Chat with any AI assistant */
  chat(request: AIChatRequest) {
    return this.http.post<AIChatResponse>("/ai/chat", request);
  }

  /** Get AI recommendation based on user context */
  getRecommendation(context: { type: string; userId?: string }) {
    return this.http.post<{ recommendation: string; confidence: number }>("/ai/recommend", context);
  }

  /** Stream AI response (SSE) - returns SSE stream response */
  streamChat(request: AIChatRequest): Promise<SDKResponse<AIChatResponse>> {
    return this.http.post<AIChatResponse>("/ai/chat/stream", request);
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
  constructor(private http: HTTPClient) {}

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
  constructor(private http: HTTPClient) {}

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
  constructor(private http: HTTPClient) {}

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

// ─── Main SDK Class ────────────────────────────────────────────────────────────

export class WinnersSDK {
  public readonly analytics: AnalyticsResource;
  public readonly community: CommunityResource;
  public readonly users: UsersResource;
  public readonly billing: BillingResource;
  public readonly gdpr: GDPRResource;
  public readonly ai: AIResource;
  public readonly academy: AcademyResource;
  public readonly market: MarketResource;
  public readonly certificates: CertificateResource;

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
    this.ai = new AIResource(this.http);
    this.academy = new AcademyResource(this.http);
    this.market = new MarketResource(this.http);
    this.certificates = new CertificateResource(this.http);
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
 * 
 * Full documentation: https://docs.winnersempire.io
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
 */
