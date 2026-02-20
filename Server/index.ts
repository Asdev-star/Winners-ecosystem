// server/index.ts — production-ready version
// Serves both the API and the built React frontend

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes         from "./routes/authRoutes.js";
import tenantsRoutes       from "./routes/tenantsRoutes.js";
import usersRoutes         from "./routes/usersRoutes.js";
import analyticsRoutes    from "./routes/analyticsRoutes.js";
import exportRoutes       from "./routes/exportRoutes.js";
import billingRoutes      from "./routes/billingRoutes.js";
import aiRoutes           from "./routes/aiRoutes.js";
import profileRoutes      from "./routes/profileRoutes.js";
import emailRoutes        from "./routes/emailRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Scheduler
import { startEmailScheduler } from "./services/emailScheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {   // ← add '0.0.0.0' to bind all interfaces
  console.log(`✅ Winners API running on port ${PORT}`);
});

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: isProd
    ? [process.env.APP_URL ?? "", /\.railway\.app$/]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────

app.use("/auth",          authRoutes);
app.use("/tenants",       tenantsRoutes);
app.use("/users",         usersRoutes);
app.use("/analytics",     analyticsRoutes);
app.use("/export",        exportRoutes);
app.use("/billing",       billingRoutes);
app.use("/ai",            aiRoutes);
app.use("/profile",       profileRoutes);
app.use("/email",         emailRoutes);
app.use("/notifications", notificationRoutes);

// ── Serve React frontend in production ───────────────────────────────────────

if (isProd) {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));

  // All non-API routes → React app
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/auth") ||
        req.path.startsWith("/analytics") || req.path.startsWith("/export") ||
        req.path.startsWith("/billing") || req.path.startsWith("/ai") ||
        req.path.startsWith("/profile") || req.path.startsWith("/email") ||
        req.path.startsWith("/notifications") || req.path.startsWith("/tenants") ||
        req.path.startsWith("/users")) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Winners API running on port ${PORT} [${process.env.NODE_ENV ?? "development"}]`);
  if (isProd) startEmailScheduler();
});
console.log(`Server bound to: ${app.address()?.address}:${app.address()?.port}`);
console.log('Environment:', process.env.NODE_ENV);
console.log('PORT from env:', process.env.PORT);

export default app;