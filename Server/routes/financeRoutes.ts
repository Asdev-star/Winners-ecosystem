// Phase 4B: Winners Finance - Internal Settlement Rail
// Wallet, Transactions, P2P Transfers, Withdrawals
import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requirePro } from "../middleware/marketPlanGate.js";
import db from "../db.js";

const router = Router();
router.use(authMiddleware);

// Helper: Get or create wallet
async function getOrCreateWallet(userId: string, tenantId: string) {
  let wallet = await db.userWallet.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
  if (!wallet) {
    wallet = await db.userWallet.create({
      data: { userId, tenantId, balance: 0, available: 0, pending: 0 }
    });
  }
  return wallet;
}

// GET /finance/balance - Get user's wallet balance
router.get("/balance", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const wallet = await getOrCreateWallet(userId, tenantId);
    res.json({ balance: wallet.balance, available: wallet.available, pending: wallet.pending, totalEarned: wallet.totalEarned, totalSpent: wallet.totalSpent, currency: wallet.currency });
  } catch (error) {
    console.error("[finance/balance]", error);
    res.status(500).json({ error: "Failed to get balance" });
  }
});

// GET /finance/transactions - Get transaction history
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { type, status, page = "1", limit = "20" } = req.query;
    const wallet = await db.userWallet.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
    if (!wallet) return res.json({ transactions: [], total: 0, page: 1, pages: 0 });
    const where: Record<string, unknown> = { walletId: wallet.id };
    if (type) where.type = String(type);
    if (status) where.status = String(status);
    const [transactions, total] = await Promise.all([
      db.walletTransaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
      db.walletTransaction.count({ where })
    ]);
    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error("[finance/transactions]", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

// POST /finance/transfer - P2P transfer
router.post("/transfer", requirePro("P2P Transfers"), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { recipientUserId, amount, description } = req.body;
    if (!recipientUserId || !amount || amount <= 0) return res.status(400).json({ error: "Invalid parameters" });
    if (recipientUserId === userId) return res.status(400).json({ error: "Cannot transfer to yourself" });
    const senderWallet = await db.userWallet.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
    if (!senderWallet || senderWallet.available < amount) return res.status(400).json({ error: "Insufficient balance" });
    const recipientWallet = await getOrCreateWallet(recipientUserId, tenantId);
    const TRANSFER_FEE = 0.02, fee = amount * TRANSFER_FEE, netAmount = amount - fee;
    await db.$transaction([
      db.userWallet.update({ where: { id: senderWallet.id }, data: { balance: { decrement: amount }, available: { decrement: amount } } }),
      db.userWallet.update({ where: { id: recipientWallet.id }, data: { balance: { increment: netAmount }, available: { increment: netAmount }, totalEarned: { increment: netAmount } } }),
      db.walletTransaction.create({ data: { walletId: senderWallet.id, type: "transfer", amount: -amount, fee, netAmount: -netAmount, status: "completed", description: description || "Transfer", relatedUserId: recipientUserId, completedAt: new Date() } }),
      db.walletTransaction.create({ data: { walletId: recipientWallet.id, type: "transfer", amount: netAmount, fee: 0, netAmount, status: "completed", description: description || "Transfer received", relatedUserId: userId, completedAt: new Date() } })
    ]);
    res.json({ success: true, amount, fee, netAmount });
  } catch (error) {
    console.error("[finance/transfer]", error);
    res.status(500).json({ error: "Transfer failed" });
  }
});

// POST /finance/withdraw - Request withdrawal
router.post("/withdraw", requirePro("Withdrawals"), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { amount, method, bankAccount, mPesaNumber } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
    const wallet = await db.userWallet.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
    if (!wallet || wallet.available < amount) return res.status(400).json({ error: "Insufficient balance" });
    const WITHDRAWAL_FEE = method === "mpesa" ? 1.50 : 2.00, netAmount = amount - WITHDRAWAL_FEE;
    const [withdrawal] = await db.$transaction([
      db.withdrawalRequest.create({ data: { userId, tenantId, walletId: wallet.id, amount, fee: WITHDRAWAL_FEE, netAmount, method: method || "stripe", status: "pending" } }),
      db.userWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount }, available: { decrement: amount }, pending: { increment: amount }, mPesaNumber: mPesaNumber || wallet.mPesaNumber, bankAccount: bankAccount || wallet.bankAccount } }),
      db.walletTransaction.create({ data: { walletId: wallet.id, type: "withdrawal", amount: -amount, fee: WITHDRAWAL_FEE, netAmount: -netAmount, status: "pending", description: `Withdrawal via ${method || "stripe"}`, completedAt: new Date() } })
    ]);
    res.json({ success: true, withdrawalId: withdrawal.id, amount, fee: WITHDRAWAL_FEE, netAmount, status: "pending" });
  } catch (error) {
    console.error("[finance/withdraw]", error);
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

// GET /finance/withdrawals - Get withdrawal history
router.get("/withdrawals", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, page = "1", limit = "20" } = req.query;
    const where: Record<string, unknown> = { userId };
    if (status) where.status = String(status);
    const [withdrawals, total] = await Promise.all([
      db.withdrawalRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
      db.withdrawalRequest.count({ where })
    ]);
    res.json({ withdrawals, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error("[finance/withdrawals]", error);
    res.status(500).json({ error: "Failed to get withdrawals" });
  }
});

// GET /finance/stats - Financial summary
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const wallet = await db.userWallet.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
    if (!wallet) return res.json({ balance: 0, available: 0, pending: 0, totalEarned: 0, totalSpent: 0, transactionCount: 0 });
    const transactionCount = await db.walletTransaction.count({ where: { walletId: wallet.id } });
    res.json({ balance: wallet.balance, available: wallet.available, pending: wallet.pending, totalEarned: wallet.totalEarned, totalSpent: wallet.totalSpent, transactionCount, hasStripeAccount: !!wallet.stripeAccountId, hasMPesa: !!wallet.mPesaNumber });
  } catch (error) {
    console.error("[finance/stats]", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// ========== DEPOSIT ENDPOINTS (Mobile Money & Bank Funding) ==========

// POST /finance/deposit/stripe - Stripe payment intent
router.post("/deposit/stripe", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { amount, currency = "usd" } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const wallet = await getOrCreateWallet(userId, tenantId);
    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET) return res.status(500).json({ error: "Stripe not configured" });

    const stripe = require("stripe")(STRIPE_SECRET);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { walletId: wallet.id, userId, tenantId, type: "deposit" }
    });

    await db.walletTransaction.create({
      data: { walletId: wallet.id, type: "deposit", amount, currency, status: "pending", description: "Stripe deposit", reference: paymentIntent.id }
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error("[deposit/stripe]", error);
    res.status(500).json({ error: "Deposit failed" });
  }
});

// POST /finance/deposit/mpesa - M-Pesa STK push
router.post("/deposit/mpesa", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { phoneNumber, amount } = req.body;
    if (!phoneNumber || !amount) return res.status(400).json({ error: "Phone and amount required" });

    const wallet = await getOrCreateWallet(userId, tenantId);
    const FLUTTERWAVE_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!FLUTTERWAVE_KEY) return res.status(500).json({ error: "Flutterwave not configured" });

    const phone = phoneNumber.replace(/^0/, "254");
    const ref = `WD_${wallet.id}_${Date.now()}`;

    const response = await fetch("https://api.flutterwave.com/v3/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${FLUTTERWAVE_KEY}` },
      body: JSON.stringify({ phone_number: phone, amount: String(amount), currency: "KES", network: "MPESA", email: req.user!.email || "user@winners.empire", "client-request-id": ref })
    });

    const data = await response.json();
    if (data.status !== "success") return res.status(400).json({ error: data.message });

    await db.walletTransaction.create({
      data: { walletId: wallet.id, type: "deposit", amount, currency: "KES", status: "pending", description: "M-Pesa deposit", reference: ref }
    });

    res.json({ success: true, reference: ref, message: "STK push sent" });
  } catch (error) {
    console.error("[deposit/mpesa]", error);
    res.status(500).json({ error: "M-Pesa deposit failed" });
  }
});

// POST /finance/deposit/bank - Bank transfer instruction
router.post("/deposit/bank", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { amount, bankName } = req.body;
    if (!amount || !bankName) return res.status(400).json({ error: "Amount and bank required" });

    const wallet = await getOrCreateWallet(userId, tenantId);
    const virtualAccountNumber = `W${wallet.id.slice(0, 10).toUpperCase()}`;

    await db.walletTransaction.create({
      data: { walletId: wallet.id, type: "deposit", amount, currency: "USD", status: "pending", description: `Bank transfer to ${bankName}`, reference: virtualAccountNumber }
    });

    res.json({ success: true, virtualAccountNumber, routingNumber: "110000000", amount, currency: "USD", reference: virtualAccountNumber, instructions: "Transfer funds. Credited in 1-3 days." });
  } catch (error) {
    console.error("[deposit/bank]", error);
    res.status(500).json({ error: "Bank deposit failed" });
  }
});

// POST /finance/deposit/flutterwave - Flutterwave card deposit
router.post("/deposit/flutterwave", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { amount, currency = "USD", paymentType = "card" } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount required" });

    const wallet = await getOrCreateWallet(userId, tenantId);
    const FLUTTERWAVE_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!FLUTTERWAVE_KEY) return res.status(500).json({ error: "Flutterwave not configured" });

    const txRef = `WF_${wallet.id}_${Date.now()}`;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${FLUTTERWAVE_KEY}` },
      body: JSON.stringify({ tx_ref: txRef, amount: String(amount), currency, redirect_url: `${process.env.FRONTEND_URL}/market/finance?deposit=success`, meta: { walletId: wallet.id }, customer: { email: req.user!.email || "user@winners.empire" }, payment_options: paymentType })
    });

    const data = await response.json();
    if (data.status !== "success") return res.status(400).json({ error: data.message });

    await db.walletTransaction.create({
      data: { walletId: wallet.id, type: "deposit", amount, currency, status: "pending", description: `Flutterwave ${paymentType} deposit`, reference: txRef }
    });

    res.json({ success: true, link: data.data.link, txRef });
  } catch (error) {
    console.error("[deposit/flutterwave]", error);
    res.status(500).json({ error: "Flutterwave deposit failed" });
  }
});

// POST /finance/webhook/confirm - Confirm deposit
router.post("/webhook/confirm", async (req: Request, res: Response) => {
  try {
    const { walletId, amount, currency, reference, status } = req.body;
    if (status !== "success") return res.json({ received: true });

    const wallet = await db.userWallet.findUnique({ where: { id: walletId } });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    const transaction = await db.walletTransaction.findFirst({ where: { walletId, reference, status: "pending", type: "deposit" } });
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    await db.$transaction([
      db.walletTransaction.update({ where: { id: transaction.id }, data: { status: "completed" } }),
      db.userWallet.update({ where: { id: walletId }, data: { balance: { increment: amount }, available: { increment: amount } } })
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("[webhook/confirm]", error);
    res.status(500).json({ error: "Confirmation failed" });
  }
});

// GET /finance/deposit/methods - Available deposit methods
router.get("/deposit/methods", async (req: Request, res: Response) => {
  res.json({
    methods: [
      { id: "stripe", name: "Credit/Debit Card", currencies: ["USD", "EUR", "GBP"], min: 1, max: 10000, fee: "2.9% + $0.30" },
      { id: "mpesa", name: "M-Pesa (Kenya)", currencies: ["KES"], min: 100, max: 150000, fee: "1.5%" },
      { id: "flutterwave_card", name: "Card (Africa)", currencies: ["USD", "EUR", "GBP", "NGN", "ZAR", "KES"], min: 1, max: 5000, fee: "3.5%" },
      { id: "flutterwave_ussd", name: "USSD (Nigeria)", currencies: ["NGN"], min: 100, max: 100000, fee: "1.5%" },
      { id: "bank", name: "Bank Transfer (USD)", currencies: ["USD"], min: 50, max: 50000, fee: "$5 flat" },
      { id: "mobile_money", name: "Mobile Money (Africa)", currencies: ["KES", "UGX", "TZS", "GHS", "XOF"], min: 1000, max: 500000, fee: "1-2%" }
    ]
  });
});

// ADMIN: Approve/reject withdrawals
router.post("/admin/withdrawal/:id/approve", async (req, res) => {
  try {
    if (req.user!.role !== "OWNER" && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }
    const { id } = req.params;
    const withdrawal = await db.withdrawalRequest.findUnique({ where: { id } });
    if (!withdrawal) return res.status(404).json({ error: "Not found" });
    if (withdrawal.status !== "pending") return res.status(400).json({ error: "Already processed" });

    const wallet = await db.userWallet.findUnique({ where: { id: withdrawal.walletId } });
    let payoutResult = { success: true, id: "manual-" + Date.now() };

    // Process payout based on method
    if (withdrawal.method === "stripe" && wallet?.stripeAccountId) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const transfer = await stripe.transfers.create({
          amount: Math.round(withdrawal.netAmount * 100),
          currency: "usd",
          destination: wallet.stripeAccountId,
          metadata: { withdrawalId: withdrawal.id }
        });
        payoutResult = { success: true, id: transfer.id };
      } catch (e) { payoutResult = { success: false, id: "" }; }
    } else if (withdrawal.method === "mpesa" && wallet?.mPesaNumber) {
      // M-Pesa via Flutterwave
      try {
        // Simplified - would integrate with Flutterwave API
        payoutResult = { success: true, id: "mpesa-" + Date.now() };
      } catch (e) { payoutResult = { success: false, id: "" }; }
    }

    // Complete the withdrawal
    await db.$transaction([
      db.withdrawalRequest.update({ 
        where: { id }, 
        data: { status: "completed", processedAt: new Date(), payoutId: payoutResult.id } 
      }),
      db.walletTransaction.updateMany({ 
        where: { walletId: withdrawal.walletId, status: "pending", type: "withdrawal" }, 
        data: { status: "completed" } 
      }),
      db.userWallet.update({ 
        where: { id: withdrawal.walletId }, 
        data: { pending: { decrement: withdrawal.amount } } 
      })
    ]);
    res.json({ success: true, status: "completed", payoutId: payoutResult.id });
  } catch (error) {
    console.error("[admin/withdrawal/approve]", error);
    res.status(500).json({ error: "Approval failed" });
  }
});

router.post("/admin/withdrawal/:id/reject", async (req, res) => {
  try {
    if (req.user!.role !== "OWNER" && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }
    const { id } = req.params;
    const { reason } = req.body;
    const withdrawal = await db.withdrawalRequest.findUnique({ where: { id } });
    if (!withdrawal) return res.status(404).json({ error: "Not found" });
    
    // Refund the amount back to available balance
    await db.$transaction([
      db.withdrawalRequest.update({ where: { id }, data: { status: "failed", failureReason: reason, processedAt: new Date() } }),
      db.walletTransaction.updateMany({ where: { walletId: withdrawal.walletId, status: "pending", type: "withdrawal" }, data: { status: "failed" } }),
      db.userWallet.update({ where: { id: withdrawal.walletId }, data: { balance: { increment: withdrawal.amount }, available: { increment: withdrawal.amount }, pending: { decrement: withdrawal.amount } } })
    ]);
    res.json({ success: true, status: "rejected" });
  } catch (error) {
    console.error("[admin/withdrawal/reject]", error);
    res.status(500).json({ error: "Rejection failed" });
  }
});

// ========== STEP 9: SAVINGS GROUPS / CHAMA TOOLS ==========

// POST /finance/chama/create - Create a savings group
router.post("/chama/create", requirePro("Savings Groups"), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { name, description, contributionAmount, frequency, maxMembers = 10, currency = "USD" } = req.body;
    if (!name || !contributionAmount || !frequency) return res.status(400).json({ error: "Name, contribution amount, and frequency required" });
    if (contributionAmount <= 0) return res.status(400).json({ error: "Contribution must be positive" });
    if (!["weekly", "biweekly", "monthly"].includes(frequency)) return res.status(400).json({ error: "Frequency must be weekly, biweekly, or monthly" });

    const group = await db.savingsGroup.create({
      data: {
        tenantId,
        name,
        description: description || "",
        contributionAmount,
        frequency,
        maxMembers: Math.min(maxMembers, 50),
        currency,
        status: "active",
        currentRound: 1,
        totalPool: 0,
        createdBy: userId
      }
    });

    // Add creator as first member
    await db.savingsGroupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: "admin",
        payoutOrder: 1,
        totalContributed: 0,
        hasReceivedPayout: false
      }
    });

    res.json({ success: true, group });
  } catch (error) {
    console.error("[chama/create]", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// POST /finance/chama/join - Join a savings group
router.post("/chama/join", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { groupId, inviteCode } = req.body;
    if (!groupId) return res.status(400).json({ error: "Group ID required" });

    const group = await db.savingsGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.status !== "active") return res.status(400).json({ error: "Group is not accepting members" });

    const memberCount = await db.savingsGroupMember.count({ where: { groupId } });
    if (memberCount >= group.maxMembers) return res.status(400).json({ error: "Group is full" });

    const existing = await db.savingsGroupMember.findFirst({ where: { groupId, userId } });
    if (existing) return res.status(400).json({ error: "Already a member" });

    const member = await db.savingsGroupMember.create({
      data: {
        groupId,
        userId,
        role: "member",
        payoutOrder: memberCount + 1,
        totalContributed: 0,
        hasReceivedPayout: false
      }
    });

    res.json({ success: true, member, payoutOrder: member.payoutOrder });
  } catch (error) {
    console.error("[chama/join]", error);
    res.status(500).json({ error: "Failed to join group" });
  }
});

// POST /finance/chama/contribute - Make a contribution
router.post("/chama/contribute", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ error: "Group ID required" });

    const group = await db.savingsGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.status !== "active") return res.status(400).json({ error: "Group is not active" });

    const member = await db.savingsGroupMember.findFirst({ where: { groupId, userId } });
    if (!member) return res.status(403).json({ error: "Not a member" });

    const wallet = await db.userWallet.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
    if (!wallet || wallet.available < group.contributionAmount) return res.status(400).json({ error: "Insufficient balance" });

    // Check if already contributed this round
    const existingContribution = await db.savingsGroupContribution.findFirst({
      where: { groupId, userId, round: group.currentRound }
    });
    if (existingContribution) return res.status(400).json({ error: "Already contributed this round" });

    // Process contribution
    await db.$transaction([
      db.userWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: group.contributionAmount }, available: { decrement: group.contributionAmount }, totalSpent: { increment: group.contributionAmount } } }),
      db.savingsGroupContribution.create({
        data: {
          groupId,
          userId,
          amount: group.contributionAmount,
          round: group.currentRound,
          status: "completed"
        }
      }),
      db.savingsGroupMember.update({ where: { id: member.id }, data: { totalContributed: { increment: group.contributionAmount } } }),
      db.savingsGroup.update({ where: { id: groupId }, data: { totalPool: { increment: group.contributionAmount } } }),
      db.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "chama_contribution",
          amount: -group.contributionAmount,
          status: "completed",
          description: `Contribution to ${group.name} (Round ${group.currentRound})`,
          reference: `CHAMA_${groupId}_${group.currentRound}`,
          completedAt: new Date()
        }
      })
    ]);

    // Check if all members have contributed - auto-rotate payout
    const totalMembers = await db.savingsGroupMember.count({ where: { groupId } });
    const contributionsThisRound = await db.savingsGroupContribution.count({ where: { groupId, round: group.currentRound } });
    
    if (contributionsThisRound >= totalMembers) {
      // Find next payout recipient
      const nextRecipient = await db.savingsGroupMember.findFirst({
        where: { groupId, hasReceivedPayout: false },
        orderBy: { payoutOrder: "asc" }
      });

      if (nextRecipient) {
        const payoutAmount = group.totalPool;
        const recipientWallet = await db.userWallet.findUnique({ where: { userId_tenantId: { userId: nextRecipient.userId, tenantId } } });
        if (recipientWallet) {
          await db.$transaction([
            db.savingsGroupMember.update({ where: { id: nextRecipient.id }, data: { hasReceivedPayout: true } }),
            db.savingsGroup.update({ where: { id: groupId }, data: { currentRound: { increment: 1 }, totalPool: 0 } }),
            db.userWallet.update({ where: { id: recipientWallet.id }, data: { balance: { increment: payoutAmount }, available: { increment: payoutAmount }, totalEarned: { increment: payoutAmount } } }),
            db.walletTransaction.create({
              data: {
                walletId: recipientWallet.id,
                type: "chama_payout",
                amount: payoutAmount,
                status: "completed",
                description: `Payout from ${group.name} (Round ${group.currentRound})`,
                reference: `CHAMA_PAYOUT_${groupId}_${group.currentRound}`,
                completedAt: new Date()
              }
            })
          ]);
        }
      }
    }

    res.json({ success: true, amount: group.contributionAmount, round: group.currentRound });
  } catch (error) {
    console.error("[chama/contribute]", error);
    res.status(500).json({ error: "Contribution failed" });
  }
});

// GET /finance/chama/list - List user's savings groups
router.get("/chama/list", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const memberships = await db.savingsGroupMember.findMany({
      where: { userId },
      include: { group: true }
    });
    const groups = memberships.map(m => ({
      ...m.group,
      myRole: m.role,
      myPayoutOrder: m.payoutOrder,
      myTotalContributed: m.totalContributed,
      hasReceivedPayout: m.hasReceivedPayout
    }));
    res.json({ groups });
  } catch (error) {
    console.error("[chama/list]", error);
    res.status(500).json({ error: "Failed to list groups" });
  }
});

// GET /finance/chama/:id - Get group details
router.get("/chama/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const group = await db.savingsGroup.findUnique({ where: { id }, include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) return res.status(403).json({ error: "Not a member" });

    const contributions = await db.savingsGroupContribution.findMany({ where: { groupId: id }, orderBy: { createdAt: "desc" }, take: 50 });
    const myMember = group.members.find(m => m.userId === userId);

    res.json({ group, contributions, myMember });
  } catch (error) {
    console.error("[chama/:id]", error);
    res.status(500).json({ error: "Failed to get group" });
  }
});

// POST /finance/chama/:id/leave - Leave a savings group
router.post("/chama/:id/leave", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const member = await db.savingsGroupMember.findFirst({ where: { groupId: id, userId } });
    if (!member) return res.status(404).json({ error: "Not a member" });
    if (member.role === "admin") return res.status(400).json({ error: "Admin cannot leave. Transfer admin first." });

    await db.savingsGroupMember.delete({ where: { id: member.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("[chama/leave]", error);
    res.status(500).json({ error: "Failed to leave group" });
  }
});

export default router;
