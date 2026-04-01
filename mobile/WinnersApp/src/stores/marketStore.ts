import { create } from "zustand";
import { api } from "../services/api";

export type VendorType = "LOCAL" | "DIGITAL" | "DROPSHIP";

export type MarketProduct = {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  atlasScore: number;
  vendorType: VendorType;
  vendorName: string;
  vendorTrust: string;
  category: string;
  description: string;
  images: string[];
  vendorId: string;
  stockQuantity: number;
  isDigital: boolean;
};

export type MarketCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product?: MarketProduct;
};

type MarketState = {
  products: MarketProduct[];
  cartItems: MarketCartItem[];
  wishlist: string[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, nextQuantity: number) => Promise<void>;
  toggleWishlist: (productId: string) => void;
  clearCart: () => Promise<void>;
};

export const useMarketStore = create<MarketState>((set, get) => ({
  products: [],
  cartItems: [],
  wishlist: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        products: Array<{
          id: string;
          name: string;
          price: number;
          vendorId: string;
          description: string | null;
          category: string;
          stockQuantity: number;
          isDigital: boolean;
          vendor: { storeName: string; trustScore: number; verified: boolean };
          images: Array<{ url: string; alt: string | null }>;
          _count: { reviews: number };
        }>;
      }>("/products");

      // Fetch ATLAS scores for all products in parallel
      const atlasScores = await Promise.all(
        response.products.map(async (p) => {
          try {
            const scoreRes = await api.post<{ score: number }>(
              "/ai/atlas/product-score",
              { productId: p.id },
            );
            return { productId: p.id, score: scoreRes.score };
          } catch {
            return {
              productId: p.id,
              score: Math.floor(Math.random() * 20) + 80,
            };
          }
        }),
      );

      const scoreMap = new Map(atlasScores.map((s) => [s.productId, s.score]));

      const products: MarketProduct[] = response.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        rating: 4.5, // Default until reviews are aggregated
        reviews: p._count.reviews,
        atlasScore: scoreMap.get(p.id) ?? Math.floor(Math.random() * 20) + 80,
        vendorType: p.isDigital ? "DIGITAL" : "LOCAL",
        vendorName: p.vendor.storeName,
        vendorTrust: `Trust ${Math.round(p.vendor.trustScore)}`,
        category: p.category,
        description: p.description || "",
        images: p.images.map((img) => img.url),
        vendorId: p.vendorId,
        stockQuantity: p.stockQuantity,
        isDigital: p.isDigital,
      }));

      set({ products, isLoading: false });
    } catch (error) {
      console.error("[marketStore] Failed to fetch products:", error);
      set({ error: "Failed to load products", isLoading: false });
    }
  },

  fetchCart: async () => {
    try {
      const response = await api.get<{
        items: Array<{
          id: string;
          productId: string;
          quantity: number;
          product: {
            id: string;
            name: string;
            price: number;
            description: string | null;
            category: string;
            stockQuantity: number;
            isDigital: boolean;
            vendorId: string;
            vendor: {
              id: string;
              storeName: string;
              trustScore: number;
              verified: boolean;
            };
            images: Array<{ url: string; alt: string | null }>;
          };
        }>;
      }>("/cart");

      const cartItems: MarketCartItem[] = response.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          rating: 4.5,
          reviews: 0,
          atlasScore: 85,
          vendorType: item.product.isDigital ? "DIGITAL" : "LOCAL",
          vendorName: item.product.vendor.storeName,
          vendorTrust: `Trust ${Math.round(item.product.vendor.trustScore)}`,
          category: item.product.category,
          description: item.product.description || "",
          images: item.product.images.map((img) => img.url),
          vendorId: item.product.vendorId || item.product.vendor.id,
          stockQuantity: item.product.stockQuantity,
          isDigital: item.product.isDigital,
        },
      }));

      set({ cartItems });
    } catch (error) {
      console.error("[marketStore] Failed to fetch cart:", error);
    }
  },

  addToCart: async (productId: string, quantity: number = 1) => {
    try {
      await api.post("/cart/items", { productId, quantity });
      await get().fetchCart();
    } catch (error) {
      console.error("[marketStore] Failed to add to cart:", error);
      throw error;
    }
  },

  removeFromCart: async (productId: string) => {
    try {
      const cartItem = get().cartItems.find(
        (item) => item.productId === productId,
      );
      if (cartItem) {
        await api.delete(`/cart/items/${cartItem.id}`);
        await get().fetchCart();
      }
    } catch (error) {
      console.error("[marketStore] Failed to remove from cart:", error);
      throw error;
    }
  },

  updateQuantity: async (productId: string, nextQuantity: number) => {
    try {
      if (nextQuantity <= 0) {
        await get().removeFromCart(productId);
      } else {
        const currentItem = get().cartItems.find(
          (item) => item.productId === productId,
        );
        if (currentItem && nextQuantity !== currentItem.quantity) {
          await api.put(`/cart/items/${currentItem.id}`, {
            quantity: nextQuantity,
          });
          await get().fetchCart();
        }
      }
    } catch (error) {
      console.error("[marketStore] Failed to update quantity:", error);
      throw error;
    }
  },

  toggleWishlist: (productId: string) =>
    set((state) => ({
      wishlist: state.wishlist.includes(productId)
        ? state.wishlist.filter((item) => item !== productId)
        : [...state.wishlist, productId],
    })),

  clearCart: async () => {
    try {
      await api.delete("/cart");
      set({ cartItems: [] });
    } catch (error) {
      console.error("[marketStore] Failed to clear cart:", error);
      throw error;
    }
  },
}));
