import db from "../db.js";

type SupportedSupplier = "printful" | "gelato" | "cj";

type SupplierProductSeed = {
  externalId: string;
  title: string;
  description: string;
  costPrice: number;
  suggestedRetail: number;
  category: string;
  images: string[];
  shippingTime: string;
  minOrder?: number;
  stockLevel?: string;
  atlasScore?: number;
  atlasReason?: string;
  tags?: string[];
};

type FulfillmentResult = {
  supplier: SupportedSupplier;
  status: string;
  trackingNumber?: string | null;
  supplierReference?: string | null;
  raw?: unknown;
};

const SUPPLIER_LABELS: Record<SupportedSupplier, { name: string; origin: string }> = {
  printful: { name: "Printful", origin: "Global" },
  gelato: { name: "Gelato", origin: "Global" },
  cj: { name: "CJ Dropshipping", origin: "China · International" },
};

function getSupplierToken(supplier: SupportedSupplier) {
  switch (supplier) {
    case "printful":
      return process.env.PRINTFUL_API_KEY ?? "";
    case "gelato":
      return process.env.GELATO_API_KEY ?? "";
    case "cj":
      return process.env.CJ_DROPSHIPPING_API_KEY ?? "";
    default:
      return "";
  }
}

function getSupplierBaseUrl(supplier: SupportedSupplier) {
  switch (supplier) {
    case "printful":
      return "https://api.printful.com";
    case "gelato":
      return "https://order.gelatoapis.com";
    case "cj":
      return "https://developers.cjdropshipping.com/api2.0/v1";
    default:
      return "";
  }
}

function buildSupplierHeaders(supplier: SupportedSupplier) {
  const token = getSupplierToken(supplier);
  if (!token) {
    throw new Error(`${supplier.toUpperCase()} supplier credentials are not configured`);
  }

  if (supplier === "gelato") {
    return {
      "Content-Type": "application/json",
      "X-API-KEY": token,
    };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function fetchSupplierJson<T>(
  supplier: SupportedSupplier,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getSupplierBaseUrl(supplier)}${path}`, {
    ...init,
    headers: {
      ...buildSupplierHeaders(supplier),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${supplier} request failed (${response.status}): ${text || response.statusText}`);
  }

  return (await response.json()) as T;
}

function dedupeTags(tags: string[]) {
  return Array.from(new Set(tags.filter(Boolean)));
}

async function ensureSupplierRecord(tenantId: string, supplier: SupportedSupplier) {
  const existing = await db.supplier.findFirst({
    where: { tenantId, name: SUPPLIER_LABELS[supplier].name },
  });

  if (existing) return existing;

  return db.supplier.create({
    data: {
      tenantId,
      name: SUPPLIER_LABELS[supplier].name,
      origin: SUPPLIER_LABELS[supplier].origin,
      isVerified: true,
      rating: 4.6,
      website: getSupplierBaseUrl(supplier),
    },
  });
}

async function upsertSupplierProduct(
  tenantId: string,
  supplierId: string,
  supplier: SupportedSupplier,
  seed: SupplierProductSeed,
) {
  const sourceTag = `source:${supplier}:${seed.externalId}`;
  const existing = await db.supplierProduct.findFirst({
    where: {
      tenantId,
      supplierId,
      tags: { has: sourceTag },
    },
  });

  const payload = {
    tenantId,
    supplierId,
    title: seed.title,
    description: seed.description || `${seed.title} imported from ${SUPPLIER_LABELS[supplier].name}.`,
    costPrice: seed.costPrice,
    suggestedRetail: seed.suggestedRetail,
    category: seed.category || "General",
    images: seed.images,
    shippingTime: seed.shippingTime || "7-14 days",
    minOrder: seed.minOrder ?? 1,
    stockLevel: seed.stockLevel ?? "high",
    atlasScore: seed.atlasScore ?? 72,
    atlasReason: seed.atlasReason ?? `${SUPPLIER_LABELS[supplier].name} supplier sync`,
    tags: dedupeTags([...(seed.tags ?? []), sourceTag, `supplier:${supplier}`]),
    isActive: true,
  };

  if (existing) {
    return db.supplierProduct.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return db.supplierProduct.create({
    data: payload,
  });
}

function extractPrintfulSeeds(payload: any): SupplierProductSeed[] {
  const rows = Array.isArray(payload?.result) ? payload.result : [];

  return rows.map((product: any) => {
    const firstVariant = Array.isArray(product?.sync_variants) ? product.sync_variants[0] : null;
    const firstFile = Array.isArray(product?.files) ? product.files[0] : null;
    const productId = String(product?.id ?? firstVariant?.product_id ?? product?.external_id ?? "");
    const variantId = String(firstVariant?.id ?? "");
    const retail = Number(firstVariant?.retail_price ?? firstVariant?.price ?? product?.retail_price ?? 0);
    const fallbackCost = retail > 0 ? retail * 0.4 : 0;
    const cost = Number(firstVariant?.cost ?? fallbackCost);

    return {
      externalId: productId,
      title: String(product?.name ?? product?.title ?? `Printful ${productId}`),
      description: String(product?.description ?? ""),
      costPrice: cost,
      suggestedRetail: Number((retail || cost * 2.5 || 25).toFixed(2)),
      category: String(product?.type ?? "Print on Demand"),
      images: firstFile?.preview_url ? [String(firstFile.preview_url)] : [],
      shippingTime: "5-10 days",
      atlasScore: 80,
      atlasReason: "Printful print-on-demand product synced from supplier API.",
      tags: variantId ? [`printful:variant:${variantId}`] : [],
    };
  }).filter((seed) => Boolean(seed.externalId));
}

function extractGelatoSeeds(payload: any): SupplierProductSeed[] {
  const rows =
    (Array.isArray(payload?.products) && payload.products) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload) ? payload : []);

  return rows.map((product: any) => {
    const productId = String(product?.id ?? product?.productUid ?? "");
    const firstVariant = Array.isArray(product?.variants) ? product.variants[0] : null;
    const firstImage = Array.isArray(product?.images) ? product.images[0] : null;
    const cost = Number(firstVariant?.price ?? product?.price ?? 0);

    return {
      externalId: productId,
      title: String(product?.title ?? product?.name ?? `Gelato ${productId}`),
      description: String(product?.description ?? ""),
      costPrice: cost,
      suggestedRetail: Number(((cost || 10) * 2.5).toFixed(2)),
      category: String(product?.category ?? "Print on Demand"),
      images: firstImage?.url ? [String(firstImage.url)] : [],
      shippingTime: "3-7 days",
      atlasScore: 82,
      atlasReason: "Gelato local-print product synced from supplier API.",
      tags: firstVariant?.id ? [`gelato:variant:${String(firstVariant.id)}`] : [],
    };
  }).filter((seed) => Boolean(seed.externalId));
}

function extractCJSeeds(payload: any): SupplierProductSeed[] {
  const rows =
    (Array.isArray(payload?.data?.list) && payload.data.list) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload) ? payload : []);

  return rows.map((product: any) => {
    const productId = String(product?.pid ?? product?.id ?? "");
    const image = product?.productImage ?? product?.image;
    const cost = Number(product?.sellPrice ?? product?.price ?? 0);

    return {
      externalId: productId,
      title: String(product?.productNameEn ?? product?.nameEn ?? `CJ ${productId}`),
      description: String(product?.description ?? ""),
      costPrice: cost,
      suggestedRetail: Number(((cost || 8) * 2.4).toFixed(2)),
      category: String(product?.categoryName ?? product?.category ?? "General"),
      images: image ? [String(image)] : [],
      shippingTime: "7-15 days",
      atlasScore: 74,
      atlasReason: "CJ Dropshipping catalog item synced from supplier API.",
      tags: [`cj:product:${productId}`],
    };
  }).filter((seed) => Boolean(seed.externalId));
}

async function syncPrintfulCatalog(tenantId: string, limit = 24) {
  const payload = await fetchSupplierJson<any>("printful", `/store/products?limit=${limit}`);
  return extractPrintfulSeeds(payload);
}

async function syncGelatoCatalog(tenantId: string, limit = 24) {
  void tenantId;
  const payload = await fetchSupplierJson<any>("gelato", `/v3/catalogs?limit=${limit}`);
  return extractGelatoSeeds(payload);
}

async function syncCJCatalog(tenantId: string, limit = 24) {
  void tenantId;
  const payload = await fetchSupplierJson<any>("cj", `/product/list?pageNum=1&pageSize=${limit}`);
  return extractCJSeeds(payload);
}

export async function syncSupplierCatalog(input: {
  tenantId: string;
  supplier: SupportedSupplier;
  limit?: number;
}) {
  const supplierRecord = await ensureSupplierRecord(input.tenantId, input.supplier);
  const seeds =
    input.supplier === "printful"
      ? await syncPrintfulCatalog(input.tenantId, input.limit)
      : input.supplier === "gelato"
        ? await syncGelatoCatalog(input.tenantId, input.limit)
        : await syncCJCatalog(input.tenantId, input.limit);

  const products = [];
  for (const seed of seeds) {
    products.push(
      await upsertSupplierProduct(
        input.tenantId,
        supplierRecord.id,
        input.supplier,
        seed,
      ),
    );
  }

  return {
    supplier: input.supplier,
    syncedCount: products.length,
    products,
  };
}

export async function importProductFromPrintful(productId: string, tenantId: string) {
  const supplier = await ensureSupplierRecord(tenantId, "printful");
  const payload = await fetchSupplierJson<any>("printful", `/products/${productId}`);
  const result = payload?.result ?? payload;
  const firstVariant = Array.isArray(result?.variants) ? result.variants[0] : null;
  const firstImage = Array.isArray(result?.files) ? result.files[0] : null;
  const retail = Number(firstVariant?.price ?? result?.price ?? 0);
  const cost = Number(firstVariant?.price ?? retail ?? 0);

  return upsertSupplierProduct(tenantId, supplier.id, "printful", {
    externalId: String(productId),
    title: String(result?.name ?? `Printful ${productId}`),
    description: String(result?.description ?? ""),
    costPrice: cost,
    suggestedRetail: Number(((retail || cost || 10) * 2.5).toFixed(2)),
    category: String(result?.type ?? "Print on Demand"),
    images: firstImage?.preview_url ? [String(firstImage.preview_url)] : [],
    shippingTime: "5-10 days",
    atlasScore: 80,
    atlasReason: "Printful product imported directly from supplier API.",
    tags: firstVariant?.id ? [`printful:variant:${String(firstVariant.id)}`] : [],
  });
}

function findTagValue(tags: string[], prefix: string) {
  return tags.find((tag) => tag.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function fulfillViaPrintful(orderItem: any): Promise<FulfillmentResult> {
  const supplierProduct = orderItem.product?.supplierProduct;
  const variantId = findTagValue(supplierProduct?.tags ?? [], "printful:variant:");
  if (!variantId) {
    throw new Error("Printful fulfillment requires a synced variant reference");
  }

  const payload = await fetchSupplierJson<any>("printful", "/orders", {
    method: "POST",
    body: JSON.stringify({
      recipient: {
        name: orderItem.order?.shippingName,
        address1: orderItem.order?.shippingAddress,
        city: orderItem.order?.shippingCity,
        state_code: orderItem.order?.shippingState,
        country_code: orderItem.order?.shippingCountry,
        zip: orderItem.order?.shippingZip,
        phone: orderItem.order?.shippingPhone,
      },
      items: [
        {
          variant_id: Number(variantId),
          quantity: orderItem.quantity,
        },
      ],
      external_id: orderItem.orderId,
    }),
  });

  return {
    supplier: "printful",
    status: "sent_to_supplier",
    supplierReference: String(payload?.result?.id ?? payload?.id ?? orderItem.orderId),
    trackingNumber: null,
    raw: payload,
  };
}

async function fulfillViaGelato(orderItem: any): Promise<FulfillmentResult> {
  const supplierProduct = orderItem.product?.supplierProduct;
  const variantId = findTagValue(supplierProduct?.tags ?? [], "gelato:variant:");
  if (!variantId) {
    throw new Error("Gelato fulfillment requires a synced variant reference");
  }

  const payload = await fetchSupplierJson<any>("gelato", "/v4/orders", {
    method: "POST",
    body: JSON.stringify({
      orderType: "order",
      externalReference: orderItem.orderId,
      customerReference: orderItem.order?.orderNumber,
      shipmentMethodUid: "standard",
      shippingAddress: {
        firstName: orderItem.order?.shippingName ?? "Customer",
        addressLine1: orderItem.order?.shippingAddress,
        city: orderItem.order?.shippingCity,
        state: orderItem.order?.shippingState,
        postCode: orderItem.order?.shippingZip,
        country: orderItem.order?.shippingCountry,
        email: orderItem.order?.user?.email,
        phone: orderItem.order?.shippingPhone,
      },
      orderItems: [
        {
          itemReferenceId: variantId,
          quantity: orderItem.quantity,
        },
      ],
    }),
  });

  return {
    supplier: "gelato",
    status: "sent_to_supplier",
    supplierReference: String(payload?.id ?? payload?.orderId ?? orderItem.orderId),
    trackingNumber: null,
    raw: payload,
  };
}

async function fulfillViaCJ(orderItem: any): Promise<FulfillmentResult> {
  const supplierProduct = orderItem.product?.supplierProduct;
  const productId = findTagValue(supplierProduct?.tags ?? [], "cj:product:");
  if (!productId) {
    throw new Error("CJ fulfillment requires a synced product reference");
  }

  const payload = await fetchSupplierJson<any>("cj", "/shopping/order/createOrder", {
    method: "POST",
    body: JSON.stringify({
      orderNumber: orderItem.order?.orderNumber,
      shippingAddress: {
        recipientName: orderItem.order?.shippingName,
        address: orderItem.order?.shippingAddress,
        city: orderItem.order?.shippingCity,
        province: orderItem.order?.shippingState,
        zipCode: orderItem.order?.shippingZip,
        countryCode: orderItem.order?.shippingCountry,
        phoneNumber: orderItem.order?.shippingPhone,
      },
      products: [
        {
          pid: productId,
          quantity: orderItem.quantity,
        },
      ],
    }),
  });

  return {
    supplier: "cj",
    status: "sent_to_supplier",
    supplierReference: String(payload?.data?.orderId ?? payload?.orderId ?? orderItem.orderId),
    trackingNumber: null,
    raw: payload,
  };
}

export async function autoFulfillDropOrder(input: {
  orderItemId: string;
  tenantId: string;
}) {
  const orderItem = await db.orderItem.findFirst({
    where: {
      id: input.orderItemId,
      tenantId: input.tenantId,
      product: { fulfillmentType: "dropship" },
    },
    include: {
      order: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
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
  });

  if (!orderItem) {
    throw new Error("Dropship order item not found");
  }

  const supplierName = orderItem.product?.supplierProduct?.supplier?.name?.toLowerCase() ?? "";
  const supplier: SupportedSupplier =
    supplierName.includes("printful")
      ? "printful"
      : supplierName.includes("gelato")
        ? "gelato"
        : "cj";

  const result =
    supplier === "printful"
      ? await fulfillViaPrintful(orderItem)
      : supplier === "gelato"
        ? await fulfillViaGelato(orderItem)
        : await fulfillViaCJ(orderItem);

  await db.orderItem.update({
    where: { id_tenantId: { id: orderItem.id, tenantId: input.tenantId } },
    data: {
      fulfillmentStatus: result.status,
      trackingNumber: result.trackingNumber ?? null,
      fulfilledAt: new Date(),
      supplierId: orderItem.product?.supplierId ?? orderItem.product?.supplierProduct?.supplierId ?? null,
    },
  });

  return result;
}
