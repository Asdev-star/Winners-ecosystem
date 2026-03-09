// server/routes/exportRoutes.ts

import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requirePermission, enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);
router.use(requirePermission("exportReports"));

type ExportDataset = "all" | "revenue" | "activity" | "team" | "summary";

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Export failed";
}

function periodDays(period: string) {
  return period === "7d" ? 7 : period === "90d" ? 90 : 30;
}

function dateFrom(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

function parseDataset(value: unknown, fallback: ExportDataset): ExportDataset {
  if (typeof value !== "string") return fallback;
  if (["all", "revenue", "activity", "team", "summary"].includes(value)) {
    return value as ExportDataset;
  }
  return fallback;
}

async function getRevenueData(tenantId: string, days: number) {
  return db.revenueRecord.findMany({
    where: { tenantId, recordedAt: { gte: dateFrom(days) } },
    orderBy: { recordedAt: "asc" },
  });
}

async function getActivityData(tenantId: string, days: number) {
  return db.analyticsEvent.findMany({
    where: { tenantId, createdAt: { gte: dateFrom(days) } },
    orderBy: { createdAt: "asc" },
  });
}

async function getTeamData(tenantId: string) {
  return db.user.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

async function getTenantData(tenantId: string) {
  return db.tenant.findFirst({
    where: { id: tenantId },
    include: { _count: { select: { users: true } } },
  });
}

// GET /export/json
router.get("/json", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days = periodDays((req.query.period as string) ?? "30d");
  const dataset = parseDataset(req.query.dataset, "all");

  try {
    const [revenue, activity, team, tenant] = await Promise.all([
      dataset === "all" || dataset === "revenue" ? getRevenueData(tenantId, days) : Promise.resolve([]),
      dataset === "all" || dataset === "activity" ? getActivityData(tenantId, days) : Promise.resolve([]),
      dataset === "all" || dataset === "team" ? getTeamData(tenantId) : Promise.resolve([]),
      dataset === "all" || dataset === "summary" ? getTenantData(tenantId) : Promise.resolve(null),
    ]);

    const payload: Record<string, unknown> = {
      tenantId,
      exportedAt: new Date().toISOString(),
      period: `${days}d`,
    };

    if (dataset === "all" || dataset === "revenue") payload.revenue = revenue;
    if (dataset === "all" || dataset === "activity") payload.activity = activity;
    if (dataset === "all" || dataset === "team") payload.team = team.map((u) => ({ ...u, role: u.role.toLowerCase() }));
    if (dataset === "all" || dataset === "summary") payload.summary = tenant;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="winners-export-${Date.now()}.json"`);
    return res.json(payload);
  } catch (err) {
    console.error("JSON export error:", err);
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// GET /export/csv
router.get("/csv", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days = periodDays((req.query.period as string) ?? "30d");
  const dataset = parseDataset(req.query.dataset, "revenue");

  try {
    let csv = "";

    if (dataset === "revenue") {
      const data = await getRevenueData(tenantId, days);
      csv = toCSV(
        ["Date", "Amount", "Source"],
        data.map((r) => [r.recordedAt.toISOString().split("T")[0], r.amount, r.source ?? "organic"])
      );
    } else if (dataset === "activity") {
      const data = await getActivityData(tenantId, days);
      csv = toCSV(
        ["Date", "Event", "Count"],
        data.map((r) => [r.createdAt.toISOString().split("T")[0], r.event, 1])
      );
    } else if (dataset === "team") {
      const data = await getTeamData(tenantId);
      csv = toCSV(
        ["ID", "Name", "Email", "Role", "Joined"],
        data.map((u) => [u.id, u.name, u.email, u.role.toLowerCase(), u.createdAt.toISOString().split("T")[0]])
      );
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="winners-${dataset}-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// GET /export/xlsx
router.get("/xlsx", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days = periodDays((req.query.period as string) ?? "30d");

  try {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.default.Workbook();

    wb.creator = "Winners Ecosystem";
    wb.created = new Date();

    const revSheet = wb.addWorksheet("Revenue");
    revSheet.columns = [
      { header: "Date", key: "date", width: 16 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Source", key: "source", width: 14 },
    ];

    const revenue = await getRevenueData(tenantId, days);
    revenue.forEach((r) =>
      revSheet.addRow({ date: r.recordedAt.toISOString().split("T")[0], amount: r.amount, source: r.source ?? "organic" })
    );

    const actSheet = wb.addWorksheet("Activity");
    actSheet.columns = [
      { header: "Date", key: "date", width: 16 },
      { header: "Event", key: "event", width: 16 },
      { header: "Count", key: "count", width: 12 },
    ];

    const activity = await getActivityData(tenantId, days);
    activity.forEach((a) =>
      actSheet.addRow({ date: a.createdAt.toISOString().split("T")[0], event: a.event, count: 1 })
    );

    const teamSheet = wb.addWorksheet("Team");
    teamSheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 26 },
      { header: "Role", key: "role", width: 12 },
      { header: "Joined", key: "createdAt", width: 16 },
    ];

    const team = await getTeamData(tenantId);
    team.forEach((u) =>
      teamSheet.addRow({
        name: u.name,
        email: u.email,
        role: u.role.toLowerCase(),
        createdAt: u.createdAt.toISOString().split("T")[0],
      })
    );

    const tenant = await getTenantData(tenantId);
    const totalRevenue = revenue.reduce((sum, row) => sum + row.amount, 0);
    const totalActivity = activity.length;

    const sumSheet = wb.addWorksheet("Summary");
    sumSheet.columns = [
      { header: "Metric", key: "metric", width: 24 },
      { header: "Value", key: "value", width: 20 },
    ];
    sumSheet.addRows([
      { metric: "Workspace", value: tenant?.name ?? "" },
      { metric: "Plan", value: tenant?.plan ?? "" },
      { metric: "Period", value: `Last ${days} days` },
      { metric: "Total Revenue", value: `$${totalRevenue.toLocaleString()}` },
      { metric: "Total Activity", value: totalActivity.toLocaleString() },
      { metric: "Team Members", value: tenant?._count.users ?? 0 },
      { metric: "Exported At", value: new Date().toISOString() },
    ]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="winners-report-${Date.now()}.xlsx"`);

    await wb.xlsx.write(res);
    return res.end();
  } catch (err) {
    console.error("XLSX export error:", err);
    return res.status(500).json({ message: errorMessage(err) });
  }
});

// GET /export/pdf
router.get("/pdf", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days = periodDays((req.query.period as string) ?? "30d");

  try {
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="winners-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    const [revenue, activity, team, tenant] = await Promise.all([
      getRevenueData(tenantId, days),
      getActivityData(tenantId, days),
      getTeamData(tenantId),
      getTenantData(tenantId),
    ]);

    const totalRevenue = revenue.reduce((sum, row) => sum + row.amount, 0);
    const totalActivity = activity.length;

    doc.fontSize(20).text("Winners Ecosystem Report");
    doc.moveDown();
    doc.fontSize(12).text(`Workspace: ${tenant?.name ?? ""}`);
    doc.text(`Plan: ${tenant?.plan ?? ""}`);
    doc.text(`Period: Last ${days} days`);
    doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`);
    doc.text(`Total Activity: ${totalActivity.toLocaleString()}`);
    doc.text(`Team Members: ${tenant?._count.users ?? 0}`);

    doc.addPage();
    doc.fontSize(14).text("Revenue Entries");
    revenue.slice(0, 60).forEach((row) => {
      doc.fontSize(10).text(`${row.recordedAt.toISOString().split("T")[0]}  |  $${row.amount.toLocaleString()}  |  ${row.source ?? "organic"}`);
    });

    doc.addPage();
    doc.fontSize(14).text("Activity Entries");
    activity.slice(0, 60).forEach((row) => {
      doc.fontSize(10).text(`${row.createdAt.toISOString().split("T")[0]}  |  ${row.event}`);
    });

    doc.addPage();
    doc.fontSize(14).text("Team Members");
    team.forEach((member) => {
      doc.fontSize(10).text(`${member.name}  |  ${member.email}  |  ${member.role.toLowerCase()}`);
    });

    doc.end();
    return undefined;
  } catch (err) {
    console.error("PDF export error:", err);
    return res.status(500).json({ message: errorMessage(err) });
  }
});

export default router;
