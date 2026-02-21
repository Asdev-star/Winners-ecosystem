// Server/services/referralService.ts

import db from "../db.js";
import { Resend } from "resend";
import crypto from "crypto";

const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL ?? "https://winners-empire-eco.up.railway.app";
const CREDIT_AMOUNT = 25; // $25 credit per successful referral

// Generate unique referral code
export function generateReferralCode(userId: string): string {
  return crypto.createHash("sha256").update(userId + Date.now()).digest("hex").slice(0, 8).toUpperCase();
}

// Get or create referral code for a user
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await db.referral.findFirst({
    where: { referrerId: userId, status: "PENDING", referredId: null },
  });
  if (existing) return existing.code;

  const code = generateReferralCode(userId);
  await db.referral.create({
    data: { referrerId: userId, code, status: "PENDING" },
  });
  return code;
}

// Get referral stats for a user
export async function getReferralStats(userId: string, tenantId: string) {
  const [referrals, credits, leaderboard] = await Promise.all([
    db.referral.findMany({
      where: { referrerId: userId },
      include: { referred: { select: { name: true, email: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.referralCredit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    // Top 10 referrers in tenant
    db.referral.groupBy({
      by: ["referrerId"],
      where: { status: "CONVERTED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  const converted  = referrals.filter((r) => r.status === "CONVERTED").length;
  const pending    = referrals.filter((r) => r.status === "PENDING" && r.referredId).length;
  const totalCredit = credits.reduce((s, c) => s + c.amount, 0);

  // Enrich leaderboard with user names
  const leaderboardWithNames = await Promise.all(
    leaderboard.map(async (entry, i) => {
      const user = await db.user.findUnique({
        where: { id: entry.referrerId },
        select: { name: true, email: true },
      });
      return {
        rank:       i + 1,
        name:       user?.name ?? "Unknown",
        email:      user?.email ?? "",
        referrals:  entry._count.id,
        isCurrentUser: entry.referrerId === userId,
      };
    })
  );

  return {
    code:        referrals.find((r) => !r.referredId)?.code ?? await getOrCreateReferralCode(userId),
    referralUrl: `${APP_URL}/signup?ref=${referrals.find((r) => !r.referredId)?.code ?? ""}`,
    stats: { converted, pending, totalCredit, creditAmount: CREDIT_AMOUNT },
    referrals:   referrals.filter((r) => r.referredId),
    leaderboard: leaderboardWithNames,
  };
}

// Process referral when a new user signs up with a referral code
export async function processReferral(code: string, newUserId: string, newUserEmail: string, newUserName: string) {
  const referral = await db.referral.findUnique({ where: { code } });
  if (!referral || referral.referredId) return; // Invalid or already used

  const referrer = await db.user.findUnique({ where: { id: referral.referrerId } });
  if (!referrer) return;

  // Mark referral as converted
  await db.referral.update({
    where: { id: referral.id },
    data:  { referredId: newUserId, status: "CONVERTED", convertedAt: new Date(), creditAwarded: true },
  });

  // Award credit to referrer
  await db.referralCredit.create({
    data: {
      tenantId: referrer.tenantId,
      userId:   referrer.id,
      amount:   CREDIT_AMOUNT,
      reason:   `Referral bonus — ${newUserName} signed up`,
    },
  });

  // Create new referral code for the referrer (for next referral)
  await db.referral.create({
    data: { referrerId: referrer.id, code: generateReferralCode(referrer.id + Date.now()), status: "PENDING" },
  });

  // Send email notification to referrer
  await resend.emails.send({
    from:    process.env.EMAIL_FROM ?? "Winners Ecosystem <onboarding@resend.dev>",
    to:      referrer.email,
    subject: `🎉 You earned $${CREDIT_AMOUNT} — ${newUserName} joined via your referral!`,
    html: `
      <div style="font-family: 'Syne', sans-serif; background: #080B10; color: #E8EDF2; padding: 40px; max-width: 520px; margin: 0 auto; border-radius: 8px;">
        <div style="font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #F5C842; margin-bottom: 24px;">● WINNERS ECOSYSTEM</div>
        <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">You earned <span style="color: #F5C842;">$${CREDIT_AMOUNT} credit!</span></h2>
        <p style="color: #5A6878; font-size: 13px; margin-bottom: 24px;">
          <strong style="color: #E8EDF2;">${newUserName}</strong> (${newUserEmail}) just signed up using your referral link.
          We've added <strong style="color: #F5C842;">$${CREDIT_AMOUNT}</strong> to your account credit.
        </p>
        <a href="${APP_URL}/referral" style="display: inline-block; background: #F5C842; color: #080B10; padding: 13px 28px; border-radius: 4px; font-weight: 700; font-size: 14px; text-decoration: none;">
          View Your Credits →
        </a>
        <p style="color: #5A6878; font-size: 11px; font-family: monospace; margin-top: 24px;">Keep sharing your referral link to earn more credits.</p>
      </div>
    `,
  }).catch(() => {});
}