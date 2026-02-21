// Server/services/stripeService.ts

import Stripe from "stripe";
import db from "../db.js";
import { notifyNewRevenue, notifyPlanUpgraded } from "./slackService.js";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// ─── Sync Stripe charges to revenueRecord table ───────────────────────────────

export async function syncStripeRevenue(tenantId: string) {
  const stripe = getStripe();

  const charges = await stripe.charges.list({
    limit: 100,
    created: { gte: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60 },
  });

  const successfulCharges = charges.data.filter((c) => c.paid && !c.refunded);

  const byDate: Record<string, number> = {};
  for (const charge of successfulCharges) {
    const date = new Date(charge.created * 1000).toISOString().split("T")[0];
    byDate[date] = (byDate[date] ?? 0) + charge.amount / 100;
  }

  for (const [dateStr, amount] of Object.entries(byDate)) {
    const date = new Date(dateStr);
    const existing = await db.revenueRecord.findFirst({ where: { tenantId, date } });
    if (existing) {
      await db.revenueRecord.update({ where: { id: existing.id }, data: { amount, source: "stripe" } });
    } else {
      await db.revenueRecord.create({ data: { tenantId, date, amount, source: "stripe" } });
    }
  }

  return { synced: Object.keys(byDate).length, total: successfulCharges.length };
}

// ─── Get Stripe dashboard stats ───────────────────────────────────────────────

export async function getStripeStats() {
  const stripe = getStripe();
  const now    = Math.floor(Date.now() / 1000);
  const day30  = now - 30 * 24 * 60 * 60;

  const [charges, customers, subscriptions, balance] = await Promise.all([
    stripe.charges.list({ limit: 100, created: { gte: day30 } }),
    stripe.customers.list({ limit: 100, created: { gte: day30 } }),
    stripe.subscriptions.list({ limit: 100, status: "active" }),
    stripe.balance.retrieve(),
  ]);

  const successfulCharges = charges.data.filter((c) => c.paid && !c.refunded);
  const mrr = subscriptions.data.reduce((sum, sub) => {
    const item  = sub.items.data[0];
    const price = item?.price;
    if (!price?.unit_amount) return sum;
    const monthly = price.recurring?.interval === "year" ? price.unit_amount / 12 : price.unit_amount;
    return sum + monthly / 100;
  }, 0);

  return {
    last30Days: {
      revenue:      successfulCharges.reduce((s, c) => s + c.amount / 100, 0),
      transactions: successfulCharges.length,
      newCustomers: customers.data.length,
      refunds:      charges.data.filter((c) => c.refunded).length,
    },
    subscriptions: { active: subscriptions.data.length, mrr: Math.round(mrr) },
    balance: {
      available: balance.available.reduce((s, b) => s + b.amount, 0) / 100,
      pending:   balance.pending.reduce((s, b) => s + b.amount, 0) / 100,
    },
    recentCharges: successfulCharges.slice(0, 10).map((c) => ({
      id:          c.id,
      amount:      c.amount / 100,
      currency:    c.currency,
      description: c.description ?? c.statement_descriptor ?? "Payment",
      customer:    typeof c.customer === "string" ? c.customer : (c.customer as any)?.id,
      date:        new Date(c.created * 1000).toISOString(),
      status:      c.status,
    })),
  };
}

// ─── Create Stripe checkout session ──────────────────────────────────────────

export async function createCheckoutSession(params: {
  plan:       "PRO" | "ENTERPRISE";
  tenantId:   string;
  userId:     string;
  email:      string;
  successUrl: string;
  cancelUrl:  string;
}) {
  const stripe = getStripe();

  const priceId = params.plan === "PRO"
    ? process.env.STRIPE_PRO_PRICE_ID
    : process.env.STRIPE_ENTERPRISE_PRICE_ID;

  if (!priceId) {
    throw new Error(`Price ID for ${params.plan} not set. Add STRIPE_PRO_PRICE_ID or STRIPE_ENTERPRISE_PRICE_ID to environment variables.`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode:                 "subscription",
    customer_email:       params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      tenantId: params.tenantId,
      userId:   params.userId,
      plan:     params.plan,
    },
    success_url: params.successUrl,
    cancel_url:  params.cancelUrl,
  });

  return session;
}

// ─── Create billing portal session ───────────────────────────────────────────

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}

// ─── Handle Stripe webhook events ─────────────────────────────────────────────

export async function handleWebhookEvent(payload: Buffer, signature: string) {
  const stripe        = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

  switch (event.type) {

    case "checkout.session.completed": {
      const session  = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      const plan     = session.metadata?.plan as "PRO" | "ENTERPRISE";

      if (tenantId && plan) {
        const tenant = await db.tenant.update({
          where: { id: tenantId },
          data: {
            plan,
            stripeCustomerId:     session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        });

        // Notify Slack — plan upgraded
        await notifyPlanUpgraded({
          fromPlan:   "FREE",
          toPlan:     plan,
          upgradedBy: session.customer_email ?? "Customer",
          tenantName: tenant.name,
        }).catch(() => {});
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub    = event.data.object as Stripe.Subscription;
      const tenant = await db.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (tenant) await db.tenant.update({ where: { id: tenant.id }, data: { plan: "FREE" } });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const tenant  = await db.tenant.findFirst({ where: { stripeCustomerId: invoice.customer as string } });

      if (tenant && invoice.amount_paid > 0) {
        await db.revenueRecord.create({
          data: {
            tenantId: tenant.id,
            date:     new Date(),
            amount:   invoice.amount_paid / 100,
            source:   "stripe_subscription",
          },
        });

        // Notify Slack — new revenue
        await notifyNewRevenue({
          amount:     invoice.amount_paid / 100,
          currency:   invoice.currency.toUpperCase(),
          customer:   invoice.customer_email ?? undefined,
          source:     "Stripe",
          tenantName: tenant.name,
        }).catch(() => {});
      }
      break;
    }
  }

  return { received: true, type: event.type };
}