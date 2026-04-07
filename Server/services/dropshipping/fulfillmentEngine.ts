import { Resend } from "resend";
import db from "../../db.js";
import { printfulService } from "./printfulService.js";
import type {
  PrintfulOrderItem,
  ShippingAddress as PrintfulShippingAddress,
} from "./printfulService.js";
import { gelatoService } from "./gelatoService.js";
import type { ShippingAddress as GelatoShippingAddress } from "./gelatoService.js";
import { cjService } from "./cjService.js";
import type { CJOrderProduct } from "./cjService.js";
import { triggerAgenticLoop } from "../agenticLoopService.js";

interface FulfillmentResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

type DropItem = {
  id: string;
  quantity: number;
  product: {
    fulfillmentType: string;
    supplierProduct?: {
      tags: string[];
      supplier?: {
        id: string;
        tenantId: string;
        createdAt: Date;
        name: string;
        origin: string;
        website: string | null;
        contactEmail: string | null;
        rating: number;
        isVerified: boolean;
      } | null;
    } | null;
  };
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function normalizeSupplierName(
  name: string | undefined,
): "printful" | "gelato" | "cj" | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.includes("printful")) return "printful";
  if (lower.includes("gelato")) return "gelato";
  if (lower.includes("cj")) return "cj";
  return null;
}

function extractTagValue(tags: string[], prefix: string): string | null {
  return (
    tags.find((tag) => tag.startsWith(prefix))?.slice(prefix.length) ?? null
  );
}

function buildPrintfulItems(items: DropItem[]): PrintfulOrderItem[] {
  return items.map((item) => {
    const variantId = extractTagValue(
      item.product.supplierProduct?.tags ?? [],
      "printful:variant:",
    );
    if (!variantId)
      throw new Error(
        "Missing Printful variant reference on supplier product tags",
      );
    return { external_variant_id: variantId, quantity: item.quantity };
  });
}

function buildGelatoItems(
  items: DropItem[],
): Array<{ itemReferenceId: string; quantity: number }> {
  return items.map((item) => {
    const variantId = extractTagValue(
      item.product.supplierProduct?.tags ?? [],
      "gelato:variant:",
    );
    if (!variantId)
      throw new Error(
        "Missing Gelato variant reference on supplier product tags",
      );
    return { itemReferenceId: variantId, quantity: item.quantity };
  });
}

function buildCJItems(items: DropItem[]): CJOrderProduct[] {
  return items.map((item) => {
    const productId = extractTagValue(
      item.product.supplierProduct?.tags ?? [],
      "cj:product:",
    );
    if (!productId)
      throw new Error("Missing CJ product reference on supplier product tags");
    return { pid: productId, quantity: item.quantity };
  });
}

function buildPrintfulAddress(order: any) {
  return {
    name: order.shippingName || `${order.user?.name ?? "Customer"}`,
    address1: order.shippingAddress || "",
    city: order.shippingCity || "",
    state_code: order.shippingState || "",
    country_code: order.shippingCountry || "",
    zip: order.shippingZip || "",
    phone: order.shippingPhone || "",
  };
}

function buildGelatoAddress(order: any): GelatoShippingAddress {
  return {
    firstName: order.shippingName || order.user?.name || "Customer",
    address1: order.shippingAddress || "",
    addressLine1: order.shippingAddress || "",
    city: order.shippingCity || "",
    state: order.shippingState || "",
    postCode: order.shippingZip || "",
    country: order.shippingCountry || "",
    email: order.user?.email || "",
    phone: order.shippingPhone || "",
  };
}

function buildCJAddress(order: any) {
  return {
    name: order.shippingName || order.user?.name || "Customer",
    line1: order.shippingAddress || "",
    city: order.shippingCity || "",
    countryCode: order.shippingCountry || "",
    zip: order.shippingZip || "",
    phone: order.shippingPhone || "",
  };
}

function fulfillmentEmailHtml(
  order: any,
  fulfillmentResults: Record<string, FulfillmentResult>,
) {
  const lines = Object.entries(fulfillmentResults).map(([supplier, result]) => {
    if (result.success) {
      return `<li><strong>${supplier}</strong>: Fulfillment request sent successfully.</li>`;
    }
    return `<li><strong>${supplier}</strong>: Failed — ${result.error}</li>`;
  });

  return `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
  <h1>Your order is being fulfilled</h1>
  <p>Order <strong>#${order.orderNumber}</strong> is now being sent to suppliers.</p>
  <p>Delivery status by supplier:</p>
  <ul>${lines.join("")}</ul>
  <p>If you have any questions, reply to this email and we will help.</p>
</body>
</html>`;
}

export async function autoFulfillDropOrder(winnersOrderId: string) {
  const order = await db.order.findUnique({
    where: { id: winnersOrderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              supplierProduct: {
                include: {
                  supplier: true,
                },
              },
            },
          },
        },
      },
      user: true,
      vendor: true,
    },
  });

  if (!order) throw new Error(`Order ${winnersOrderId} not found`);

  const dropshipItems = order.items.filter(
    (item: any): item is DropItem =>
      item?.product?.fulfillmentType === "dropship",
  );
  if (!dropshipItems.length) {
    return {
      message: "No dropshipping items to fulfill",
      orderId: winnersOrderId,
    };
  }

  const grouped = dropshipItems.reduce<Record<string, DropItem[]>>(
    (acc: Record<string, DropItem[]>, item: DropItem) => {
      const supplier = normalizeSupplierName(
        item.product.supplierProduct?.supplier?.name,
      );
      if (!supplier) return acc;
      acc[supplier] = acc[supplier] ?? [];
      acc[supplier].push(item);
      return acc;
    },
    {} as Record<string, DropItem[]>,
  );

  const fulfillmentResults: Record<string, FulfillmentResult> = {};

  await Promise.allSettled(
    (Object.entries(grouped) as Array<[string, DropItem[]]>).map(
      async ([supplier, items]) => {
        try {
          let result: unknown;

          if (supplier === "printful") {
            result = await printfulService.createOrder(
              winnersOrderId,
              buildPrintfulItems(items),
              buildPrintfulAddress(order),
            );
          } else if (supplier === "gelato") {
            result = await gelatoService.createOrder(
              winnersOrderId,
              buildGelatoItems(items),
              buildGelatoAddress(order),
            );
          } else if (supplier === "cj") {
            result = await cjService.createOrder(
              winnersOrderId,
              buildCJItems(items),
              buildCJAddress(order),
            );
          } else {
            throw new Error(`Unsupported supplier: ${supplier}`);
          }

          const supplierReference =
            typeof result === "object" && result !== null
              ? ((result as any).id ??
                (result as any).order?.id ??
                (result as any).orderId ??
                null)
              : null;

          await db.orderItem.updateMany({
            where: {
              id: { in: items.map((item) => item.id) },
              tenantId: order.tenantId,
            },
            data: {
              fulfillmentStatus: "sent_to_supplier",
              supplierId: supplier,
              trackingNumber: supplierReference
                ? String(supplierReference)
                : undefined,
              fulfilledAt: new Date(),
            },
          });

          fulfillmentResults[supplier] = { success: true, result };
        } catch (err: unknown) {
          fulfillmentResults[supplier] = {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
          console.error(
            `[fulfillmentEngine] Supplier fulfillment failed for ${supplier}:`,
            err,
          );
        }
      },
    ),
  );

  const allSucceeded = Object.values(fulfillmentResults).every(
    (item) => item.success,
  );
  await db.order.update({
    where: { id: winnersOrderId },
    data: {
      status: allSucceeded ? "PROCESSING" : "CONFIRMED",
      metadata: {
        ...((order.metadata as any) || {}),
        fulfillmentResults,
        fulfillmentStatus: allSucceeded ? "fulfilled" : "partial",
      },
    },
  });

  if (order.user?.email) {
    try {
      if (resend) {
        await resend.emails.send({
          from:
            process.env.EMAIL_FROM ??
            "Winners Ecosystem <reports@yourdomain.com>",
          to: order.user.email,
          subject: `Your order is on its way — ${order.id.slice(-6)}`,
          html: fulfillmentEmailHtml(order, fulfillmentResults),
        });
      }
    } catch (err) {
      console.error(
        "[fulfillmentEngine] Failed to send fulfillment email:",
        err,
      );
    }
  }

  if (order.vendor?.userId) {
    await triggerAgenticLoop({
      userId: order.vendor.userId,
      tenantId: order.tenantId,
      triggerType: "product_sold",
      layer: "market",
      data: { orderId: winnersOrderId, amount: order.total },
    });
  }

  return { orderId: winnersOrderId, fulfillmentResults };
}
