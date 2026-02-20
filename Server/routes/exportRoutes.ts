// server/routes/exportRoutes.ts

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requirePermission, enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);
router.use(requirePermission("exportReports"));

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

async function getRevenueData(tenantId: string, days: number) {
  return db.revenueRecord.findMany({
    where:   { tenantId, date: { gte: dateFrom(days) } },
    orderBy: { date: "asc" },
  });
}

async function getActivityData(tenantId: string, days: number) {
  return db.analyticsEvent.findMany({
    where:   { tenantId, date: { gte: dateFrom(days) } },
    orderBy: { date: "asc" },
  });
}

async function getTeamData(tenantId: string) {
  return db.user.findMany({
    where:   { tenantId, deletedAt: null },
    select:  { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

async function getTenantData(tenantId: string) {
  return db.tenant.findFirst({
    where:   { id: tenantId },
    include: { _count: { select: { users: true } } },
  });
}

// ─── GET /export/json ─────────────────────────────────────────────────────────

router.get("/json", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = periodDays((req.query.period as string) ?? "30d");
  const dataset  = (req.query.dataset as string) ?? "all";

  try {
    const [revenue, activity, team, tenant] = await Promise.all([
      dataset === "all" || dataset === "revenue"  ? getRevenueData(tenantId, days)  : Promise.resolve([]),
      dataset === "all" || dataset === "activity" ? getActivityData(tenantId, days) : Promise.resolve([]),
      dataset === "all" || dataset === "team"     ? getTeamData(tenantId)           : Promise.resolve([]),
      dataset === "all" || dataset === "summary"  ? getTenantData(tenantId)         : Promise.resolve(null),
    ]);

    const payload: any = { tenantId, exportedAt: new Date().toISOString(), period: `${days}d` };

    if (dataset === "all" || dataset === "revenue")  payload.revenue  = revenue;
    if (dataset === "all" || dataset === "activity") payload.activity = activity;
    if (dataset === "all" || dataset === "team")     payload.team     = team.map((u) => ({ ...u, role: u.role.toLowerCase() }));
    if (dataset === "all" || dataset === "summary")  payload.summary  = tenant;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="winners-export-${Date.now()}.json"`);
    return res.json(payload);
  } catch (err) {
    console.error("JSON export error:", err);
    return res.status(500).json({ message: "Export failed" });
  }
});

// ─── GET /export/csv ──────────────────────────────────────────────────────────

router.get("/csv", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = periodDays((req.query.period as string) ?? "30d");
  const dataset  = (req.query.dataset as string) ?? "revenue";

  try {
    let csv = "";

    if (dataset === "revenue") {
      const data = await getRevenueData(tenantId, days);
      csv = toCSV(
        ["Date", "Amount", "Source"],
        data.map((r) => [r.date.toISOString().split("T")[0], r.amount, r.source ?? "organic"])
      );
    } else if (dataset === "activity") {
      const data = await getActivityData(tenantId, days);
      csv = toCSV(
        ["Date", "Event Type", "Count"],
        data.map((r) => [r.date.toISOString().split("T")[0], r.eventType, r.count])
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
    return res.status(500).json({ message: "Export failed" });
  }
});

// ─── GET /export/xlsx ─────────────────────────────────────────────────────────
// Uses exceljs — install with: npm install exceljs

router.get("/xlsx", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = periodDays((req.query.period as string) ?? "30d");

  try {
    const ExcelJS = await import("exceljs");
    const wb      = new ExcelJS.default.Workbook();

    wb.creator  = "Winners Ecosystem";
    wb.created  = new Date();

    // ── Revenue Sheet ────────────────────────────────────────────────────────
    const revSheet = wb.addWorksheet("Revenue");
    revSheet.columns = [
      { header: "Date",   key: "date",   width: 16 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Source", key: "source", width: 14 },
    ];
    revSheet.getRow(1).font = { bold: true, color: { argb: "FFF5C842" } };
    revSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D1117" } };

    const revenue = await getRevenueData(tenantId, days);
    revenue.forEach((r) => revSheet.addRow({ date: r.date.toISOString().split("T")[0], amount: r.amount, source: r.source ?? "organic" }));

    // ── Activity Sheet ───────────────────────────────────────────────────────
    const actSheet = wb.addWorksheet("Activity");
    actSheet.columns = [
      { header: "Date",       key: "date",      width: 16 },
      { header: "Event Type", key: "eventType", width: 16 },
      { header: "Count",      key: "count",     width: 12 },
    ];
    actSheet.getRow(1).font = { bold: true, color: { argb: "FFF5C842" } };
    actSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D1117" } };

    const activity = await getActivityData(tenantId, days);
    activity.forEach((a) => actSheet.addRow({ date: a.date.toISOString().split("T")[0], eventType: a.eventType, count: a.count }));

    // ── Team Sheet ───────────────────────────────────────────────────────────
    const teamSheet = wb.addWorksheet("Team");
    teamSheet.columns = [
      { header: "Name",   key: "name",      width: 20 },
      { header: "Email",  key: "email",     width: 26 },
      { header: "Role",   key: "role",      width: 12 },
      { header: "Joined", key: "createdAt", width: 16 },
    ];
    teamSheet.getRow(1).font = { bold: true, color: { argb: "FFF5C842" } };
    teamSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D1117" } };

    const team = await getTeamData(tenantId);
    team.forEach((u) => teamSheet.addRow({ name: u.name, email: u.email, role: u.role.toLowerCase(), createdAt: u.createdAt.toISOString().split("T")[0] }));

    // ── Summary Sheet ────────────────────────────────────────────────────────
    const tenant       = await getTenantData(tenantId);
    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
    const totalActivity = activity.reduce((s, a) => s + a.count, 0);

    const sumSheet = wb.addWorksheet("Summary");
    sumSheet.columns = [{ header: "Metric", key: "metric", width: 24 }, { header: "Value", key: "value", width: 20 }];
    sumSheet.getRow(1).font = { bold: true, color: { argb: "FFF5C842" } };
    sumSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D1117" } };
    sumSheet.addRows([
      { metric: "Workspace",      value: tenant?.name ?? "" },
      { metric: "Plan",           value: tenant?.plan ?? "" },
      { metric: "Period",         value: `Last ${days} days` },
      { metric: "Total Revenue",  value: `$${totalRevenue.toLocaleString()}` },
      { metric: "Total Activity", value: totalActivity.toLocaleString() },
      { metric: "Team Members",   value: tenant?._count.users ?? 0 },
      { metric: "Exported At",    value: new Date().toISOString() },
    ]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="winners-report-${Date.now()}.xlsx"`);

    await wb.xlsx.write(res);
    return res.end();
  } catch (err) {
    console.error("XLSX export error:", err);
    return res.status(500).json({ message: "Export failed" });
  }
});

// ─── GET /export/pdf ──────────────────────────────────────────────────────────
// Uses pdfkit — install with: npm install pdfkit @types/pdfkit

router.get("/pdf", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const days     = periodDays((req.query.period as string) ?? "30d");

  try {
    const PDFDocument = (await import("pdfkit")).default;
    const doc         = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="winners-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    const [revenue, activity, team, tenant] = await Promise.all([
      getRevenueData(tenantId, days),
      getActivityData(tenantId, days),
      getTeamData(tenantId),
      getTenantData(tenantId),
    ]);

    const totalRevenue  = revenue.reduce((s, r) => s + r.amount, 0);
    const totalActivity = activity.reduce((s, a) => s + a.count, 0);
    const gold          = "#F5C842";
    const dim           = "#5A6878";
    const dark          = "#0D1117";

    // ── Cover ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 180).fill(dark);
    doc.fill(gold).fontSize(28).font("Helvetica-Bold").text("Winners Ecosystem", 50, 60);
    doc.fill("#E8EDF2").fontSize(13).font("Helvetica").text(`${tenant?.name ?? "Workspace"} · Analytics Report`, 50, 100);
    doc.fill(dim).fontSize(10).text(`Period: Last ${days} days · Generated: ${new Date().toLocaleDateString()}`, 50, 124);
    doc.moveDown(5);

    // ── Summary KPIs ─────────────────────────────────────────────────────────
    doc.fill(gold).fontSize(14).font("Helvetica-Bold").text("Summary", 50, 200);
    doc.moveTo(50, 218).lineTo(545, 218).strokeColor(gold).lineWidth(1).stroke();

    const kpis = [
      { label: "Total Revenue",   value: `$${totalRevenue.toLocaleString()}` },
      { label: "Total Activity",  value: totalActivity.toLocaleString() },
      { label: "Team Members",    value: String(tenant?._count.users ?? 0) },
      { label: "Plan",            value: tenant?.plan ?? "FREE" },
    ];

    let kpiX = 50;
    kpis.forEach((kpi) => {
      doc.fill(gold).fontSize(20).font("Helvetica-Bold").text(kpi.value, kpiX, 230);
      doc.fill(dim).fontSize(9).font("Helvetica").text(kpi.label, kpiX, 255);
      kpiX += 125;
    });

    // ── Revenue Table ────────────────────────────────────────────────────────
    doc.addPage();
    doc.fill(gold).fontSize(14).font("Helvetica-Bold").text("Revenue Data", 50, 50);
    doc.moveTo(50, 68).lineTo(545, 68).strokeColor(gold).lineWidth(1).stroke();

    doc.fill(dark).rect(50, 74, 495, 20).fill();
    doc.fill(gold).fontSize(9).font("Helvetica-Bold")
      .text("Date", 55, 79).text("Amount", 200, 79).text("Source", 350, 79);

    let y = 100;
    revenue.slice(0, 40).forEach((r, i) => {
      if (i % 2 === 0) doc.fill("#141B24").rect(50, y - 3, 495, 18).fill();
      doc.fill("#E8EDF2").fontSize(9).font("Helvetica")
        .text(r.date.toISOString().split("T")[0], 55, y)
        .text(`$${r.amount.toLocaleString()}`, 200, y)
        .text(r.source ?? "organic", 350, y);
      y += 18;
      if (y > 750) { doc.addPage(); y = 50; }
    });

    // ── Team Table ───────────────────────────────────────────────────────────
    doc.addPage();
    doc.fill(gold).fontSize(14).font("Helvetica-Bold").text("Team Members", 50, 50);
    doc.moveTo(50, 68).lineTo(545, 68).strokeColor(gold).lineWidth(1).stroke();

    doc.fill(dark).rect(50, 74, 495, 20).fill();
    doc.fill(gold).fontSize(9).font("Helvetica-Bold")
      .text("Name", 55, 79).text("Email", 200, 79).text("Role", 400, 79);

    y = 100;
    team.forEach((u, i) => {
      if (i % 2 === 0) doc.fill("#141B24").rect(50, y - 3, 495, 18).fill();
      doc.fill("#E8EDF2").fontSize(9).font("Helvetica")
        .text(u.name, 55, y)
        .text(u.email, 200, y)
        .text(u.role.toLowerCase(), 400, y);
      y += 18;
    });

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    return res.status(500).json({ message: "Export failed" });
  }
});

export default router;