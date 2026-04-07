import type { Request } from "express";

export interface APIResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

interface AuthUser {
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  plan?: "FREE" | "PRO" | "ENTERPRISE";
  isImpersonation?: boolean;
  adminId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  rawBody?: Buffer;
  imageLimit?: number;
}
