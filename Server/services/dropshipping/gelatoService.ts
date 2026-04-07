import { syncSupplierCatalog } from "../supplierService.js";

export interface ShippingAddress {
  firstName?: string;
  name?: string;
  address1: string;
  addressLine1?: string;
  city: string;
  state?: string;
  state_code?: string;
  postCode?: string;
  country: string;
  country_code?: string;
  zip?: string;
  phone?: string;
  email?: string;
}

export interface GelatoOrderItem {
  itemReferenceId: string;
  quantity: number;
}

const GELATO_BASE = "https://order.gelatoapis.com";

export const gelatoService = {
  async getCatalog() {
    const res = await fetch(`${GELATO_BASE}/v3/catalogs`, {
      headers: {
        "X-API-KEY": process.env.GELATO_API_KEY ?? "",
        "Content-Type": "application/json",
      },
    });
    return res.json();
  },

  async createOrder(
    orderId: string,
    items: GelatoOrderItem[],
    address: ShippingAddress,
  ) {
    const res = await fetch(`${GELATO_BASE}/v4/orders`, {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.GELATO_API_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderReferenceId: orderId,
        customerReferenceId: orderId,
        currency: "USD",
        items,
        shippingAddress: address,
      }),
    });
    return res.json();
  },

  async importProduct(gelatoProductId: string, tenantId: string) {
    const result = await fetch(
      `${GELATO_BASE}/v3/catalogs/${encodeURIComponent(gelatoProductId)}`,
      {
        headers: {
          "X-API-KEY": process.env.GELATO_API_KEY ?? "",
          "Content-Type": "application/json",
        },
      },
    );
    return result.json();
  },
};

export async function syncGelatoCatalogForTenant(tenantId: string, limit = 24) {
  return syncSupplierCatalog({ tenantId, supplier: "gelato", limit });
}
