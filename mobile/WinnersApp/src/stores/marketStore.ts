import { create } from "zustand";

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
};

type CartItem = {
  productId: string;
  quantity: number;
};

type MarketState = {
  products: MarketProduct[];
  cartItems: CartItem[];
  wishlist: string[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, nextQuantity: number) => void;
  toggleWishlist: (productId: string) => void;
};

const PRODUCTS: MarketProduct[] = [
  {
    id: "atlas-growth-kit",
    name: "ATLAS Growth Stack Kit",
    price: 24.99,
    rating: 4.8,
    reviews: 127,
    atlasScore: 96,
    vendorType: "DIGITAL",
    vendorName: "Winners Store",
    vendorTrust: "Trust 94",
    category: "Tech",
    description: "Offer pages, automations, and launch copy for mobile-first operators who need to ship quickly.",
    images: ["Launch dashboard preview", "Offer stack overview", "Automation flow preview"],
  },
  {
    id: "diaspora-beauty-bundle",
    name: "Diaspora Beauty Bundle",
    price: 18.5,
    rating: 4.5,
    reviews: 64,
    atlasScore: 82,
    vendorType: "LOCAL",
    vendorName: "Winners Africa",
    vendorTrust: "Trust 88",
    category: "Beauty",
    description: "A locally fulfilled beauty bundle with cross-border appeal and repeat-purchase friendly margins.",
    images: ["Beauty bundle hero image", "Product texture close-up", "Packaging view"],
  },
  {
    id: "creator-commerce-board",
    name: "Creator Commerce Board",
    price: 42,
    rating: 4.9,
    reviews: 211,
    atlasScore: 91,
    vendorType: "DIGITAL",
    vendorName: "Winners Store",
    vendorTrust: "Trust 97",
    category: "Fashion",
    description: "Templates, calendars, and revenue dashboards for creators who want a cleaner commerce operating system.",
    images: ["Board overview", "Template collection", "Revenue dashboard"],
  },
  {
    id: "dropship-launch-pack",
    name: "Dropship Launch Pack",
    price: 29.95,
    rating: 4.6,
    reviews: 93,
    atlasScore: 78,
    vendorType: "DROPSHIP",
    vendorName: "Partner Vendor",
    vendorTrust: "Trust 79",
    category: "Tech",
    description: "A tested dropship starter pack with vendor sourcing notes and fulfillment handoff checklists.",
    images: ["Dropship setup image", "Fulfillment diagram", "Vendor scorecard"],
  },
];

export const useMarketStore = create<MarketState>((set) => ({
  products: PRODUCTS,
  cartItems: [
    { productId: "atlas-growth-kit", quantity: 1 },
    { productId: "diaspora-beauty-bundle", quantity: 2 },
  ],
  wishlist: [],
  addToCart: (productId) =>
    set((state) => {
      const existing = state.cartItems.find((item) => item.productId === productId);

      if (existing) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        };
      }

      return {
        cartItems: [...state.cartItems, { productId, quantity: 1 }],
      };
    }),
  removeFromCart: (productId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.productId !== productId),
    })),
  updateQuantity: (productId, nextQuantity) =>
    set((state) => ({
      cartItems:
        nextQuantity <= 0
          ? state.cartItems.filter((item) => item.productId !== productId)
          : state.cartItems.map((item) =>
              item.productId === productId ? { ...item, quantity: nextQuantity } : item,
            ),
    })),
  toggleWishlist: (productId) =>
    set((state) => ({
      wishlist: state.wishlist.includes(productId)
        ? state.wishlist.filter((item) => item !== productId)
        : [...state.wishlist, productId],
    })),
}));
