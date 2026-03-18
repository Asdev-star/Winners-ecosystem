// Server/services/wsService.ts
// Phase 2 - Community Layer V1.1
// Real-time WebSocket service: notifications + online presence

import type { IncomingMessage, Server as HttpServer } from "http";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";

interface Client {
  userId: string;
  tenantId: string;
  userName: string;
  email?: string;
  isSuperAdmin: boolean;
  ws: WebSocket;
  joinedAt: number;
}

interface WsTokenPayload {
  userId: string;
  tenantId: string;
  name?: string;
  email?: string;
}

const clients: Map<string, Client> = new Map();
const SUPER_ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const WS_EVENTS = {
  NEW_LIKE: "NEW_LIKE",
  NEW_COMMENT: "NEW_COMMENT",
  NEW_FOLLOW: "NEW_FOLLOW",
  NEW_POST: "NEW_POST",
  PRESENCE_UPDATE: "PRESENCE_UPDATE",
  SYSTEM: "SYSTEM",
  CONNECTED: "CONNECTED",
} as const;

function parseTokenPayload(decoded: string | JwtPayload): WsTokenPayload | null {
  if (!decoded || typeof decoded === "string") return null;

  const userId = typeof decoded.userId === "string" ? decoded.userId : "";
  const tenantId = typeof decoded.tenantId === "string" ? decoded.tenantId : "";
  if (!userId || !tenantId) return null;

  return {
    userId,
    tenantId,
    name: typeof decoded.name === "string" ? decoded.name : undefined,
    email: typeof decoded.email === "string" ? decoded.email : undefined,
  };
}

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "No token");
      return;
    }

    let payload: WsTokenPayload | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "secret");
      payload = parseTokenPayload(decoded);
    } catch {
      payload = null;
    }

    if (!payload) {
      ws.close(1008, "Invalid token");
      return;
    }

    const clientId = `${payload.userId}-${Date.now()}`;
    const client: Client = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      userName: payload.name ?? payload.email ?? "User",
      email: payload.email,
      isSuperAdmin: payload.email ? SUPER_ADMIN_EMAILS.includes(payload.email.toLowerCase()) : false,
      ws,
      joinedAt: Date.now(),
    };
    clients.set(clientId, client);

    safeSend(ws, { type: WS_EVENTS.CONNECTED, message: "Real-time connected" });
    broadcastPresence(payload.tenantId);

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
      else {
        clearInterval(ping);
        clients.delete(clientId);
      }
    }, 25000);

    ws.on("pong", () => {});

    ws.on("close", () => {
      clearInterval(ping);
      clients.delete(clientId);
      broadcastPresence(payload.tenantId);
    });

    ws.on("error", () => {
      clearInterval(ping);
      clients.delete(clientId);
    });
  });

  console.log("WebSocket server initialized at /ws");
  return wss;
}

export function getOnlineUsers(
  tenantId: string
): Array<{ userId: string; userName: string; joinedAt: number }> {
  const seen = new Map<string, { userId: string; userName: string; joinedAt: number }>();
  for (const client of clients.values()) {
    if (client.tenantId === tenantId && !seen.has(client.userId)) {
      seen.set(client.userId, {
        userId: client.userId,
        userName: client.userName,
        joinedAt: client.joinedAt,
      });
    }
  }
  return Array.from(seen.values());
}

function broadcastPresence(tenantId: string) {
  const onlineUsers = getOnlineUsers(tenantId);
  broadcastToTenant(tenantId, {
    type: WS_EVENTS.PRESENCE_UPDATE,
    onlineUsers,
    onlineCount: onlineUsers.length,
  });
}

function safeSend(ws: WebSocket, payload: object) {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    // Ignore socket serialization/send errors.
  }
}

export function notifyUser(userId: string, payload: object) {
  for (const client of clients.values()) {
    if (client.userId === userId) safeSend(client.ws, payload);
  }
}

export function broadcastToTenant(tenantId: string, payload: object) {
  for (const client of clients.values()) {
    if (client.tenantId === tenantId) safeSend(client.ws, payload);
  }
}

export function broadcastToAdmins(payload: object) {
  for (const client of clients.values()) {
    if (client.isSuperAdmin) safeSend(client.ws, payload);
  }
}
