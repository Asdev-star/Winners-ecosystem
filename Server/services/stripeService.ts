// Server/services/stripeService.ts

import Stripe from "stripe";
import db from "../db.js";
import { notifyNewRevenue, notifyPlanUpgraded } from "./slackService.js";
import { sendOrderConfirmationEmail } from "./emailService.js";
import { emitAdminEvent } from "./adminEventService.js";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function dayStart(dateString: string): Date {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  return date;
}

function dayEnd(dateString: string): Date {
  const start = dayStart(dateString);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

function customerIdFromChargeCustomer(
  customer: Stripe.Charge["customer"],
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.id;
}

function customerIdFromInvoiceCustomer(
  customer: Stripe.Invoice["customer"],
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.id;
}

function customerIdFromSessionCustomer(
  customer: Stripe.Checkout.Session["customer"],
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.id;
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString("en-US")}`;
  }
}

export async function syncStripeRevenue(
  tenantId: string,
): Promise<{ synced: number; total: number }> {
  const stripe = getStripe();

  const charges = await stripe.charges.list({
    limit: 100,
    created: { gte: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60 },
  });

  const successfulCharges = charges.data.filter(
    (charge) => charge.paid && !charge.refunded,
  );
  const byDate: Record<string, number> = {};

  for (const charge of successfulCharges) {
    const date = new Date(charge.created * 1000).toISOString().split("T")[0];
    byDate[date] = (byDate[date] ?? 0) + charge.amount / 100;
  }

  for (const [dateString, amount] of Object.entries(byDate)) {
    const existing = await db.revenueRecord.findFirst({
      where: {
        tenantId,
        source: "stripe",
        recordedAt: {
          gte: dayStart(dateString),
          lt: dayEnd(dateString),
        },
      },
    });

    if (existing) {
      await db.revenueRecord.update({
        where: { id: existing.id },
        data: { amount, source: "stripe" },
      });
    } else {
      await db.revenueRecord.create({
        data: {
          tenantId,
          amount,
          source: "stripe",
          recordedAt: dayStart(dateString),
        },
      });
    }
  }

  return {
    synced: Object.keys(byDate).length,
    total: successfulCharges.length,
  };
}

export async function getStripeStats() {
  const stripe = getStripe();
  const now = Math.floor(Date.now() / 1000);
  const day30 = now - 30 * 24 * 60 * 60;

  const [charges, customers, subscriptions, balance] = await Promise.all([
    stripe.charges.list({ limit: 100, created: { gte: day30 } }),
    stripe.customers.list({ limit: 100, created: { gte: day30 } }),
    stripe.subscriptions.list({ limit: 100, status: "active" }),
    stripe.balance.retrieve(),
  ]);

  const successfulCharges = charges.data.filter(
    (charge) => charge.paid && !charge.refunded,
  );
  const mrr = subscriptions.data.reduce((sum, subscription) => {
    const firstItem = subscription.items.data[0];
    const unitAmount = firstItem?.price?.unit_amount;
    if (!unitAmount) return sum;
    const monthly =
      firstItem?.price?.recurring?.interval === "year"
        ? unitAmount / 12
        : unitAmount;
    return sum + monthly / 100;
  }, 0);

  return {
    last30Days: {
      revenue: successfulCharges.reduce(
        (sum, charge) => sum + charge.amount / 100,
        0,
      ),
      transactions: successfulCharges.length,
      newCustomers: customers.data.length,
      refunds: charges.data.filter((charge) => charge.refunded).length,
    },
    subscriptions: {
      active: subscriptions.data.length,
      mrr: Math.round(mrr),
    },
    balance: {
      available:
        balance.available.reduce((sum, entry) => sum + entry.amount, 0) / 100,
      pending:
        balance.pending.reduce((sum, entry) => sum + entry.amount, 0) / 100,
    },
    recentCharges: successfulCharges.slice(0, 10).map((charge) => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency,
      description:
        charge.description ?? charge.statement_descriptor ?? "Payment",
      customer: customerIdFromChargeCustomer(charge.customer),
      date: new Date(charge.created * 1000).toISOString(),
      status: charge.status,
    })),
  };
}

export async function createCheckoutSession(params: {
  plan: "PRO" | "ENTERPRISE";
  tenantId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();

  const priceId =
    params.plan === "PRO"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_ENTERPRISE_PRICE_ID;

  if (!priceId) {
    throw new Error(
      `Price ID for ${params.plan} not set. Add STRIPE_PRO_PRICE_ID or STRIPE_ENTERPRISE_PRICE_ID.`,
    );
  }

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      tenantId: params.tenantId,
      userId: params.userId,
      plan: params.plan,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string,
) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function createCourseCheckoutSession(params: {
  courseId: string;
  courseTitle: string;
  price: number;
  currency?: string;
  userId: string;
  tenantId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const currency = params.currency ?? "usd";

  const dynamicPrice = await stripe.prices.create({
    unit_amount: Math.round(params.price * 100),
    currency,
    product_data: {
      name: params.courseTitle,
      metadata: {
        courseId: params.courseId,
      },
    },
  });

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.email,
    line_items: [{ price: dynamicPrice.id, quantity: 1 }],
    metadata: {
      courseId: params.courseId,
      userId: params.userId,
      tenantId: params.tenantId,
      type: "course_purchase",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function handleWebhookEvent(payload: Buffer, signature: string) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret,
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      const plan = session.metadata?.plan as "PRO" | "ENTERPRISE" | undefined;

      if (tenantId && plan) {
        const customerId = customerIdFromSessionCustomer(session.customer);
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : null;

        const tenant = await db.tenant.update({
          where: { id: tenantId },
          data: {
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          },
        });

        await notifyPlanUpgraded({
          fromPlan: "FREE",
          toPlan: plan,
          upgradedBy: session.customer_email ?? "Customer",
          tenantName: tenant.name,
        }).catch(() => {});

        emitAdminEvent({
          type: "plan_upgraded",
          urgency: plan === "ENTERPRISE" ? "critical" : "info",
          message: `${tenant.name} upgraded to ${plan}.`,
          link: `/admin/tenants/${tenant.id}`,
        });
      }

      if (session.metadata?.type === "course_purchase") {
        const courseId = session.metadata.courseId;
        const userId = session.metadata.userId;
        const courseTenantId = session.metadata.tenantId;

        if (courseId && userId && courseTenantId) {
          const existingEnrollment = await db.enrollment.findFirst({
            where: { courseId, userId, tenantId: courseTenantId },
          });

          if (!existingEnrollment) {
            await db.enrollment.create({
              data: { tenantId: courseTenantId, courseId, userId },
            });
          }
        }
      }

      // Handle market order purchase
      const orderId = session.metadata?.orderId;
      const orderTenantId = session.metadata?.tenantId;
      if (orderId && orderTenantId) {
        try {
          const order = await db.order.update({
            where: {
              id_tenantId: { id: orderId, tenantId: orderTenantId },
            },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              stripePaymentIntentId:
                (session.payment_intent as string) ?? undefined,
            },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      allowBackorder: true,
                      fulfillmentType: true,
                    },
                  },
                },
              },
              user: true,
            },
          });

          // Handle Inventory Management on purchase
          for (const item of order.items) {
            if (!item.product.allowBackorder) {
              await db.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } },
              });
            }
          }

          if (order.user?.email) {
            await sendOrderConfirmationEmail(orderTenantId, order.user.email, {
              id: order.id,
              orderNumber: order.orderNumber,
              total: order.total,
              currency: order.currency,
              items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
            }).catch((err) =>
              console.error(
                "[stripeService] error sending order confirmation email:",
                err,
              ),
            );
          }

          // Auto-fulfill dropshipping orders
          const hasDropProducts = order.items.some(
            (item) => item.product.fulfillmentType === "dropship",
          );
          if (hasDropProducts) {
            // Fire-and-forget — never block payment confirmation
            setImmediate(async () => {
              try {
                const { autoFulfillDropOrder } =
                  await import("../services/dropshipping/fulfillmentEngine.js");
                await autoFulfillDropOrder(orderId);
              } catch (fulfillError) {
                console.error(
                  "[stripeService] Dropship auto-fulfillment error:",
                  fulfillError,
                );
              }
            });
          }
        } catch (e) {
          console.error("[stripeService] market order update error:", e);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const tenant = await db.tenant.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (tenant) {
        await db.tenant.update({
          where: { id: tenant.id },
          data: { plan: "FREE" },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdFromInvoiceCustomer(invoice.customer);
      if (!customerId) break;

      const tenant = await db.tenant.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (tenant && invoice.amount_paid > 0) {
        const amountPaid = invoice.amount_paid / 100;
        await db.revenueRecord.create({
          data: {
            tenantId: tenant.id,
            recordedAt: new Date(),
            amount: amountPaid,
            source: "stripe_subscription",
          },
        });

        await notifyNewRevenue({
          amount: amountPaid,
          currency: invoice.currency?.toUpperCase() ?? "USD",
          customer: invoice.customer_email ?? undefined,
          source: "Stripe",
          tenantName: tenant.name,
        }).catch(() => {});

        if (amountPaid >= 250) {
          emitAdminEvent({
            type: "revenue_spike",
            urgency: amountPaid >= 1000 ? "critical" : "warning",
            message: `${tenant.name} just booked ${formatCurrency(amountPaid, invoice.currency ?? "USD")} in Stripe revenue.`,
            link: "/admin/revenue",
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return { received: true, type: event.type };
}
