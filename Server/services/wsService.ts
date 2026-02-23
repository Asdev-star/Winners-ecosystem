// Server/services/wsService.ts
// Real-time WebSocket notification service

import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";

interface Client {
  userId: string;
  tenantId: string;
  ws: WebSocket;
}

const clients: Map<string, Client> = new Map();

export function initWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Extract token from query string: ws://...?token=xxx
    const url    = new URL(req.url ?? "", `http://localhost`);
    const token  = url.searchParams.get("token");

    if (!token) { ws.close(1008, "No token"); return; }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET ?? "secret");
    } catch {
      ws.close(1008, "Invalid token"); return;
    }

    const clientId = `${payload.userId}-${Date.now()}`;
    clients.set(clientId, { userId: payload.userId, tenantId: payload.tenantId, ws });

    // Heartbeat
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.on("close", () => {
      clearInterval(ping);
      clients.delete(clientId);
    });

    ws.on("error", () => {
      clearInterval(ping);
      clients.delete(clientId);
    });

    // Send connected confirmation
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "connected", message: "Real-time connected" }));
    }
  });

  console.log("✅ WebSocket server initialized at /ws");
  return wss;
}

// Send notification to a specific user
export function notifyUser(userId: string, payload: object) {
  for (const client of clients.values()) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload));
    }
  }
}

// Broadcast to entire tenant
export function broadcastToTenant(tenantId: string, payload: object) {
  for (const client of clients.values()) {
    if (client.tenantId === tenantId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload));
    }
  }
}

// Notification event helpers
export const WS_EVENTS = {
  NEW_LIKE:     "NEW_LIKE",
  NEW_COMMENT:  "NEW_COMMENT",
  NEW_FOLLOW:   "NEW_FOLLOW",
  NEW_POST:     "NEW_POST",
  SYSTEM:       "SYSTEM",
} as const;