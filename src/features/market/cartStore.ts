// src/features/market/cartStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import { persistStorage } from "../../lib/storage";

export interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stockQuantity: number;
    isDigital: boolean;
    vendorId?: string;   // Required for multi-vendor checkout
    vendorName?: string;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

interface PendingAction {
  type: "update" | "remove" | "clear";
  itemId?: string;
  quantity?: number;
  timestamp: number;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  pendingActions: PendingAction[];

  fetchCart: () => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncPendingActions: () => Promise<void>;
}

function buildCartHeaders(includeJson = false): Record<string, string> {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...getAuthHeaders(),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,
      pendingActions: [],

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/cart`, {
            headers: buildCartHeaders(),
          });
          if (!res.ok) throw new Error("Failed to load cart");
          const data = await res.json();
          set({ cart: data.cart || data, isLoading: false });
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : "Failed to load cart", isLoading: false });
        }
      },

      updateQuantity: async (itemId, quantity) => {
        if (quantity < 1) return;

        // Optimistic update
        const currentCart = get().cart;
        if (currentCart) {
          const updatedItems = currentCart.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          );
          set({ cart: { ...currentCart, items: updatedItems } });
        }

        if (!navigator.onLine) {
          set((s) => ({
            pendingActions: [
              ...s.pendingActions,
              { type: "update", itemId, quantity, timestamp: Date.now() },
            ],
          }));
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
            method: "PUT",
            headers: buildCartHeaders(true),
            body: JSON.stringify({ quantity }),
          });
          if (!res.ok) throw new Error("Sync failed");
          const data = await res.json();
          set({ cart: data.cart || data });
        } catch (err) {
          // If network failed, add to pending
          set((s) => ({
            pendingActions: [
              ...s.pendingActions,
              { type: "update", itemId, quantity, timestamp: Date.now() },
            ],
          }));
        }
      },

      removeItem: async (itemId) => {
        // Optimistic update
        const currentCart = get().cart;
        if (currentCart) {
          const updatedItems = currentCart.items.filter((item) => item.id !== itemId);
          set({ cart: { ...currentCart, items: updatedItems } });
        }

        if (!navigator.onLine) {
          set((s) => ({
            pendingActions: [
              ...s.pendingActions,
              { type: "remove", itemId, timestamp: Date.now() },
            ],
          }));
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
            method: "DELETE",
            headers: buildCartHeaders(),
          });
          if (!res.ok) throw new Error("Sync failed");
          const data = await res.json();
          set({ cart: data.cart || data });
        } catch (err) {
          set((s) => ({
            pendingActions: [
              ...s.pendingActions,
              { type: "remove", itemId, timestamp: Date.now() },
            ],
          }));
        }
      },

      clearCart: async () => {
        set({ cart: { id: "", items: [], total: 0 } });

        if (!navigator.onLine) {
          set((s) => ({
            pendingActions: [
              ...s.pendingActions,
              { type: "clear", timestamp: Date.now() },
            ],
          }));
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/cart`, {
            method: "DELETE",
            headers: buildCartHeaders(),
          });
          if (!res.ok) throw new Error("Sync failed");
        } catch (err) {
          set((s) => ({
            pendingActions: [
              ...s.pendingActions,
              { type: "clear", timestamp: Date.now() },
            ],
          }));
        }
      },

      syncPendingActions: async () => {
        const { pendingActions } = get();
        if (pendingActions.length === 0 || !navigator.onLine) return;

        set({ isLoading: true });
        
        // Simple sequential sync
        for (const action of pendingActions) {
          try {
            if (action.type === "update") {
              await fetch(`${API_BASE}/cart/items/${action.itemId}`, {
                method: "PUT",
                headers: buildCartHeaders(true),
                body: JSON.stringify({ quantity: action.quantity }),
              });
            } else if (action.type === "remove") {
              await fetch(`${API_BASE}/cart/items/${action.itemId}`, {
                method: "DELETE",
                headers: buildCartHeaders(),
              });
            } else if (action.type === "clear") {
              await fetch(`${API_BASE}/cart`, {
                method: "DELETE",
                headers: buildCartHeaders(),
              });
            }
          } catch (err) {
            console.error("Failed to sync action", action, err);
          }
        }

        set({ pendingActions: [], isLoading: false });
        await get().fetchCart();
      },
    }),
    {
      name: "winners-cart-storage",
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
