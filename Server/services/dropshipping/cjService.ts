const CJ_BASE = "https://developers.cjdropshipping.com";

export interface CJOrderProduct {
  pid: string;
  quantity: number;
}

export const cjService = {
  async authenticate() {
    if (process.env.CJ_DROPSHIPPING_API_KEY) {
      return process.env.CJ_DROPSHIPPING_API_KEY;
    }

    const res = await fetch(`${CJ_BASE}/api/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.CJ_EMAIL,
        password: process.env.CJ_PASSWORD,
      }),
    });
    const data = await res.json();
    return data.data?.accessToken;
  },

  async searchProducts(keyword: string, pageNum = 1, pageSize = 20) {
    const token = await this.authenticate();
    const res = await fetch(
      `${CJ_BASE}/api/product/list?keyword=${encodeURIComponent(keyword)}&pageNum=${pageNum}&pageSize=${pageSize}`,
      { headers: { "CJ-Access-Token": token ?? "" } },
    );
    return res.json();
  },

  async createOrder(orderId: string, products: CJOrderProduct[], address: any) {
    const token = await this.authenticate();
    const res = await fetch(`${CJ_BASE}/api/order/create`, {
      method: "POST",
      headers: {
        "CJ-Access-Token": token ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderNumber: orderId,
        shippingZip: address.zip,
        shippingPhone: address.phone,
        shippingName: address.name,
        shippingAddress: address.line1,
        shippingCity: address.city,
        shippingCountry: address.countryCode,
        products,
      }),
    });
    return res.json();
  },
};
