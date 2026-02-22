// Server/index.ts — production-ready version

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import searchRoutes from "./routes/searchRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import twoFactorRoutes from "./routes/twoFactorRoutes.js";

// Routes
import authRoutes         from "./routes/authRoutes.js";
import tenantsRoutes      from "./routes/tenantsRoutes.js";
import usersRoutes        from "./routes/usersRoutes.js";
import analyticsRoutes    from "./routes/analyticsRoutes.js";
import exportRoutes       from "./routes/exportRoutes.js";
import billingRoutes      from "./routes/billingRoutes.js";
import aiRoutes           from "./routes/aiRoutes.js";
import profileRoutes      from "./routes/profileRoutes.js";
import emailRoutes        from "./routes/emailRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";;
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
// Scheduler
import { startEmailScheduler } from "./services/emailScheduler.js";
import slackRoutes from "./routes/slackRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import changelogRoutes from "./routes/changelogRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const PORT   = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === "production";

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: isProd
    ? [process.env.APP_URL ?? "", /\.railway\.app$/]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// ── Health check ───────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────────

app.use("/auth",          authRoutes);
app.use("/auth", passwordResetRoutes);
app.use("/tenants",       tenantsRoutes);
app.use("/users",         usersRoutes);
app.use("/analytics",     analyticsRoutes);
app.use("/export",        exportRoutes);
app.use("/billing",       billingRoutes);
app.use("/ai",            aiRoutes);
app.use("/profile",       profileRoutes);
app.use("/slack", slackRoutes);
app.use("/email",         emailRoutes);
app.use("/notifications", notificationRoutes);
app.use("/stripe", stripeRoutes);
app.use("/search", searchRoutes);
app.use("/activity", activityRoutes);
app.use("/referral", referralRoutes);
app.use("/admin", adminRoutes);
app.use("/changelog", changelogRoutes);
app.use("/2fa", twoFactorRoutes);
// ── Serve React frontend in production ────────────────────────────────────────

if (isProd) {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));

  // Express v5 compatible wildcard
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`✅ Winners API running on port ${PORT} [${process.env.NODE_ENV ?? "development"}]`);
  if (isProd) startEmailScheduler();
});

export default app;