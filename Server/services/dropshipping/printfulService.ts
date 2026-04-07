import {
  importProductFromPrintful,
  syncSupplierCatalog,
} from "../supplierService.js";

export interface ShippingAddress {
  name: string;
  address1: string;
  city: string;
  state_code?: string;
  country_code?: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface PrintfulVariant {
  id: number;
  product_id?: number;
  price: string;
  cost?: string;
  retail_price?: string;
}

export interface PrintfulFile {
  preview_url?: string;
  url?: string;
}

export interface PrintfulProduct {
  id: number;
  name: string;
  variants: PrintfulVariant[];
  files: PrintfulFile[];
}

export interface PrintfulOrderItem {
  external_variant_id: string;
  quantity: number;
}

const PRINTFUL_BASE = "https://api.printful.com";

export const printfulService = {
  async getProducts(category?: string): Promise<PrintfulProduct[]> {
    const url = `${PRINTFUL_BASE}/products${category ? `?category=${encodeURIComponent(category)}` : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
    });
    const data = await res.json();
    return data.result || [];
  },

  async getProductVariants(productId: number) {
    const res = await fetch(`${PRINTFUL_BASE}/products/${productId}`, {
      headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
    });
    const data = await res.json();
    return data.result;
  },

  async calculateShipping(
    items: PrintfulOrderItem[],
    address: ShippingAddress,
  ) {
    const res = await fetch(`${PRINTFUL_BASE}/shipping/rates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient: address, items }),
    });
    return res.json();
  },

  async createOrder(
    orderId: string,
    items: PrintfulOrderItem[],
    address: ShippingAddress,
  ) {
    const res = await fetch(`${PRINTFUL_BASE}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: orderId,
        recipient: address,
        items,
        confirm: true,
      }),
    });
    const data = await res.json();
    return data.result;
  },

  async getOrderStatus(printfulOrderId: string) {
    const res = await fetch(`${PRINTFUL_BASE}/orders/${printfulOrderId}`, {
      headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
    });
    return res.json();
  },

  async importProduct(printfulProductId: number, tenantId: string) {
    return importProductFromPrintful(String(printfulProductId), tenantId);
  },
};

export async function syncPrintfulCatalogForTenant(
  tenantId: string,
  limit = 24,
) {
  return syncSupplierCatalog({ tenantId, supplier: "printful", limit });
}

export async function importPrintfulProductForTenant(
  productId: string,
  tenantId: string,
) {
  return importProductFromPrintful(productId, tenantId);
}
