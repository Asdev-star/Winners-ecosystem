// Server/services/wsService.ts
// Phase 2 — Community Layer V1.1
// Real-time WebSocket service: notifications + online presence

import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";

interface Client {
  userId: string;
  tenantId: string;
  userName: string;
  ws: WebSocket;
  joinedAt: number;
}

// clientId → Client
const clients: Map<string, Client> = new Map();

export const WS_EVENTS = {
  NEW_LIKE:          "NEW_LIKE",
  NEW_COMMENT:       "NEW_COMMENT",
  NEW_FOLLOW:        "NEW_FOLLOW",
  NEW_POST:          "NEW_POST",
  PRESENCE_UPDATE:   "PRESENCE_UPDATE",
  SYSTEM:            "SYSTEM",
  CONNECTED:         "CONNECTED",
} as const;

export function initWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url   = new URL(req.url ?? "", `http://localhost`);
    const token = url.searchParams.get("token");

    if (!token) { ws.close(1008, "No token"); return; }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET ?? "secret");
    } catch {
      ws.close(1008, "Invalid token"); return;
    }

    const clientId = `${payload.userId}-${Date.now()}`;
    const client: Client = {
      userId:    payload.userId,
      tenantId:  payload.tenantId,
      userName:  payload.name ?? payload.email ?? "User",
      ws,
      joinedAt:  Date.now(),
    };
    clients.set(clientId, client);

    // Confirm connection
    safeSend(ws, { type: WS_EVENTS.CONNECTED, message: "Real-time connected" });

    // Broadcast updated presence list to entire tenant
    broadcastPresence(payload.tenantId);

    // Heartbeat keep-alive
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
      else { clearInterval(ping); clients.delete(clientId); }
    }, 25000);

    ws.on("pong", () => {}); // keep-alive acknowledged

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

  console.log("✅ WebSocket server initialized at /ws");
  return wss;
}

// ─── Presence ────────────────────────────────────────────────────────────────

export function getOnlineUsers(tenantId: string): Array<{ userId: string; userName: string; joinedAt: number }> {
  const seen = new Map<string, { userId: string; userName: string; joinedAt: number }>();
  for (const client of clients.values()) {
    if (client.tenantId === tenantId && !seen.has(client.userId)) {
      seen.set(client.userId, {
        userId:   client.userId,
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

// ─── Messaging helpers ────────────────────────────────────────────────────────

function safeSend(ws: WebSocket, payload: object) {
  if (ws.readyState === WebSocket.OPEN) {
    try { ws.send(JSON.stringify(payload)); } catch {}
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