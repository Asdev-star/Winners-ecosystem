// @vitest-environment node

import type { AddressInfo } from "node:net";
import express from "express";
import { describe, expect, it } from "vitest";
import registryRoutes from "./registryRoutes.js";

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use("/", registryRoutes);

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server address");
  }

  const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

describe("registryRoutes", () => {
  it("returns ecosystem summary at GET /", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/`);
      const body = (await res.json()) as {
        totalApps: number;
        liveApps: number;
        apps: Array<{ id: string }>;
      };

      expect(res.status).toBe(200);
      expect(body.totalApps).toBeGreaterThan(0);
      expect(body.liveApps).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(body.apps)).toBe(true);
    });
  });

  it("returns 404 for unknown app ids", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/not-registered`);
      const body = (await res.json()) as { error: string };

      expect(res.status).toBe(404);
      expect(body.error).toContain("not registered");
    });
  });

  it("returns dependency readiness for an app", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/academy/dependencies`);
      const body = (await res.json()) as {
        appId: string;
        ready: boolean;
        missing: string[];
      };

      expect(res.status).toBe(200);
      expect(body.appId).toBe("academy");
      expect(Array.isArray(body.missing)).toBe(true);
      expect(body.ready).toBe(body.missing.length === 0);
    });
  });
});
