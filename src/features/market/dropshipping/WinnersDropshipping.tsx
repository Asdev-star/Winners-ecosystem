import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ContextBar from "../../../components/ui/ContextBar";
import { useAuthStore } from "../../../features/auth/authStore";

const T = {
  bg: "var(--bg)",
  surface: "var(--surface)",
  surface2: "var(--surface2)",
  border: "var(--border)",
  gold: "var(--gold)",
  ice: "var(--ice)",
  green: "var(--green)",
  purple: "var(--purple)",
  red: "var(--red)",
  text: "var(--text)",
  dim: "var(--text-dim)",
};

type TabKey = "overview" | "suppliers" | "niches" | "calculator" | "ai" | "blueprint";
type ModelKey = "printful" | "general" | "premium";
type ToolKey = "product-research" | "competitor-analysis" | "product-description" | "brand-identity";

interface CardProps { children: ReactNode; color?: string; style?: CSSProperties; onClick?: () => void; className?: string; }
interface TagProps { children: ReactNode; color?: string; bg?: string; }
interface Supplier { id: string; name: string; logo: string; type: string; products: string; shipping: string; margin: string; countries: string; bestFor: string; auth: string; planRequired: "FREE" | "PRO"; apiEndpoint?: string; highlight?: string; model: ModelKey; }
interface SupplierCatalogItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  shippingTime?: string;
  atlasReason?: string;
  atlasScore?: number;
  suggestedRetail: number;
  costPrice: number;
  supplier?: { name?: string };
}
interface Niche { id: string; name: string; emoji: string; marketSize: string; competition: "Low" | "Medium" | "High"; confidence: number; recommendedSupplier: string; market: string; products: Array<{ name: string; price: string; margin: string }>; }
interface BlueprintStep { title: string; time: string; tip: string; cta: string; walkthrough: string; }
interface BlueprintPlan { label: string; intro: string; supplierHint: string; steps: BlueprintStep[]; }
interface ToolField { k: string; label: string; ph: string; kind?: "input" | "select"; options?: string[]; }
interface ToolDef { id: ToolKey; icon: string; label: string; color: string; desc: string; fields: ToolField[]; }
interface CalculatorState { productCost: number; sellingPrice: number; shippingCost: number; supplierShipping: number; platformFee: number; monthlySales: number; }
interface ToolFormValues { [key: string]: string; }

const SUPPLIER_TO_MODEL: Record<string, ModelKey> = {
  printful: "printful",
  gelato: "printful",
  aliexpress: "general",
  cj: "general",
  spocket: "premium",
  zendrop: "premium",
};

const SUPPLIERS: Supplier[] = [
  { id: "printful", name: "Printful", logo: "🖨️", type: "Print-on-Demand", products: "500+ customizable products", shipping: "5-12 business days", margin: "$15-45 per item", countries: "Worldwide (220+ countries)", bestFor: "Branded merch and apparel", auth: "API Key", planRequired: "FREE", apiEndpoint: "https://api.printful.com", model: "printful" },
  { id: "gelato", name: "Gelato", logo: "🌍", type: "Print-on-Demand", products: "100+ product types", shipping: "3-7 days (local production)", margin: "$12-40 per item", countries: "32 countries incl. Nigeria, Kenya, South Africa, Ghana", bestFor: "African market - local production = fast delivery", auth: "API Key", planRequired: "FREE", apiEndpoint: "https://order.gelatoapis.com", highlight: "AFRICAN MARKET RECOMMENDED", model: "printful" },
  { id: "aliexpress", name: "AliExpress + DSers", logo: "📦", type: "General Dropshipping", products: "100M+ products", shipping: "10-25 business days", margin: "$5-30 per item", countries: "Ships to 220+ countries", bestFor: "High volume testing and gadgets", auth: "OAuth2 / Shopify-compatible", planRequired: "FREE", model: "general" },
  { id: "cj", name: "CJ Dropshipping", logo: "⚡", type: "General Dropshipping", products: "400,000+ SKUs", shipping: "7-15 business days", margin: "$8-35 per item", countries: "Worldwide with warehouses in US, EU, CN", bestFor: "FMCG and custom sourcing", auth: "API Key", planRequired: "FREE", apiEndpoint: "https://developers.cjdropshipping.com", model: "general" },
  { id: "spocket", name: "Spocket", logo: "⭐", type: "Premium Dropshipping", products: "1M+ US/EU products", shipping: "3-7 business days", margin: "$20-60 per item", countries: "US, EU, CA, AU", bestFor: "Premium quality buyers and diaspora customers", auth: "OAuth2", planRequired: "PRO", model: "premium", highlight: "PRO ONLY" },
  { id: "zendrop", name: "Zendrop", logo: "🚀", type: "Premium Dropshipping", products: "1M+ products", shipping: "5-8 business days", margin: "$15-50 per item", countries: "US focus with global expansion", bestFor: "Auto-fulfillment and US buyers", auth: "API Key", planRequired: "PRO", model: "premium", highlight: "PRO ONLY" },
];

const NICHES: Niche[] = [
  { id: "african-fashion", name: "African Fashion & Clothing", emoji: "🌍", marketSize: "Very high", competition: "Medium", confidence: 92, recommendedSupplier: "Printful / Gelato", market: "Kenya", products: [{ name: "Graphic tees", price: "$25", margin: "$12" }, { name: "Phone case sets", price: "$19", margin: "$10" }, { name: "Canvas tote bags", price: "$22", margin: "$11" }] },
  { id: "tech-accessories", name: "Tech Accessories", emoji: "💻", marketSize: "Very high", competition: "High", confidence: 88, recommendedSupplier: "CJ / AliExpress", market: "Nigeria", products: [{ name: "Phone cases", price: "$18", margin: "$8" }, { name: "Charging kits", price: "$28", margin: "$13" }, { name: "Laptop sleeves", price: "$27", margin: "$12" }] },
  { id: "home-living", name: "Home & Living", emoji: "🏠", marketSize: "High", competition: "Medium", confidence: 81, recommendedSupplier: "Spocket", market: "Ghana", products: [{ name: "Wall art", price: "$35", margin: "$18" }, { name: "Throw pillows", price: "$29", margin: "$14" }, { name: "Desk organisers", price: "$24", margin: "$11" }] },
  { id: "beauty", name: "Beauty & Self-Care", emoji: "💄", marketSize: "Very high", competition: "High", confidence: 86, recommendedSupplier: "Zendrop / Spocket", market: "UK Diaspora", products: [{ name: "Skincare kits", price: "$39", margin: "$21" }, { name: "Satin bonnets", price: "$16", margin: "$8" }, { name: "Gua sha sets", price: "$22", margin: "$10" }] },
  { id: "stationery", name: "Education & Stationery", emoji: "📚", marketSize: "High", competition: "Low", confidence: 79, recommendedSupplier: "Gelato / AliExpress", market: "Kenya", products: [{ name: "Study planners", price: "$18", margin: "$9" }, { name: "Notebook sets", price: "$20", margin: "$10" }, { name: "Desk labels", price: "$14", margin: "$7" }] },
  { id: "gaming", name: "Gaming & Entertainment", emoji: "🎮", marketSize: "High", competition: "Medium", confidence: 77, recommendedSupplier: "AliExpress / CJ", market: "USA Diaspora", products: [{ name: "LED mouse pads", price: "$24", margin: "$11" }, { name: "Controller skins", price: "$19", margin: "$9" }, { name: "Headphone stands", price: "$28", margin: "$13" }] },
  { id: "fitness", name: "Fitness & Wellness", emoji: "💪", marketSize: "High", competition: "Medium", confidence: 84, recommendedSupplier: "Zendrop / Spocket", market: "Global", products: [{ name: "Resistance bands", price: "$22", margin: "$10" }, { name: "Water bottles", price: "$18", margin: "$8" }, { name: "Yoga mats", price: "$35", margin: "$16" }] },
  { id: "baby", name: "Baby & Parenting", emoji: "👶", marketSize: "Medium", competition: "Low", confidence: 75, recommendedSupplier: "Spocket / CJ", market: "Global", products: [{ name: "Swaddle blankets", price: "$26", margin: "$12" }, { name: "Nursing covers", price: "$24", margin: "$11" }, { name: "Milestone cards", price: "$17", margin: "$8" }] },
  { id: "pets", name: "Pet Products", emoji: "🐾", marketSize: "High", competition: "Medium", confidence: 80, recommendedSupplier: "Spocket / CJ", market: "UK Diaspora", products: [{ name: "Dog harnesses", price: "$22", margin: "$11" }, { name: "Pet grooming kits", price: "$29", margin: "$13" }, { name: "Feeding mats", price: "$18", margin: "$8" }] },
  { id: "art-craft", name: "Art & Craft", emoji: "🎨", marketSize: "Medium", competition: "Low", confidence: 73, recommendedSupplier: "Gelato / AliExpress", market: "Global", products: [{ name: "Sticker packs", price: "$16", margin: "$8" }, { name: "Paint sets", price: "$28", margin: "$13" }, { name: "DIY kits", price: "$34", margin: "$16" }] },
];

const BLUEPRINTS: Record<ModelKey, BlueprintPlan> = {
  printful: {
    label: "Print-on-Demand",
    intro: "Best for creators, influencers, and branded merchandise.",
    supplierHint: "Printful or Gelato",
    steps: [
      { title: "Connect Printful or Gelato", time: "3 min", tip: "Start with the supplier closest to your audience for faster delivery.", cta: "Open Suppliers", walkthrough: "Video walkthrough placeholder" },
      { title: "Design your first product", time: "10 min", tip: "ATLAS will suggest a high-converting starter product for your market.", cta: "Open ATLAS Research", walkthrough: "Video walkthrough placeholder" },
      { title: "Set your price", time: "5 min", tip: "Use the calculator to test a margin that still leaves room for ads.", cta: "Open Calculator", walkthrough: "Video walkthrough placeholder" },
      { title: "Write the description", time: "8 min", tip: "ATLAS can generate the listing copy so you can launch faster.", cta: "Generate Description", walkthrough: "Video walkthrough placeholder" },
      { title: "Publish to Winners Market", time: "3 min", tip: "Go live once the image, price, and copy all look clean.", cta: "Open Vendor Dashboard", walkthrough: "Video walkthrough placeholder" },
      { title: "Share in Community + NOVA boost", time: "2 min", tip: "Post your store link in Community so NOVA can amplify reach.", cta: "Open Community", walkthrough: "Video walkthrough placeholder" },
    ],
  },
  general: {
    label: "General Dropshipping",
    intro: "Best for broad catalog testing and fast product validation.",
    supplierHint: "AliExpress + DSers",
    steps: [
      { title: "Connect AliExpress via DSers", time: "5 min", tip: "Use a clean product import flow so your store stays organized.", cta: "Open Suppliers", walkthrough: "Video walkthrough placeholder" },
      { title: "Research a winning product", time: "10 min", tip: "Ask ATLAS for a niche-first product recommendation with margin notes.", cta: "Open ATLAS Research", walkthrough: "Video walkthrough placeholder" },
      { title: "Import from supplier catalog", time: "5 min", tip: "Import one product, then polish it before adding more.", cta: "Open Suppliers", walkthrough: "Video walkthrough placeholder" },
      { title: "Set your markup", time: "5 min", tip: "Keep room for shipping and ad cost before launching.", cta: "Open Calculator", walkthrough: "Video walkthrough placeholder" },
      { title: "Publish - store is live", time: "3 min", tip: "Go live only after the title, image, and price all match.", cta: "Open Vendor Dashboard", walkthrough: "Video walkthrough placeholder" },
      { title: "Process the first order", time: "2 min", tip: "Watch the fulfillment queue so your first order ships cleanly.", cta: "Open Orders", walkthrough: "Video walkthrough placeholder" },
    ],
  },
  premium: {
    label: "Premium Dropshipping",
    intro: "Best for higher-quality US/EU buyers and diaspora stores.",
    supplierHint: "Spocket or Zendrop",
    steps: [
      { title: "Connect Spocket or Zendrop", time: "4 min", tip: "Premium buyers care about delivery speed and packaging quality.", cta: "Open Suppliers", walkthrough: "Video walkthrough placeholder" },
      { title: "Research a premium product", time: "10 min", tip: "Use ATLAS to find products that can support a stronger price anchor.", cta: "Open ATLAS Research", walkthrough: "Video walkthrough placeholder" },
      { title: "Import curated catalog items", time: "5 min", tip: "Pick one or two hero items instead of overloading the store.", cta: "Open Suppliers", walkthrough: "Video walkthrough placeholder" },
      { title: "Set premium markup", time: "5 min", tip: "Make sure your margin covers support and higher expectations.", cta: "Open Calculator", walkthrough: "Video walkthrough placeholder" },
      { title: "Publish the premium store", time: "3 min", tip: "Use clean visuals and a strong brand story before going live.", cta: "Open Vendor Dashboard", walkthrough: "Video walkthrough placeholder" },
      { title: "Launch promotion and fulfilment", time: "2 min", tip: "After launch, move straight into promotion and auto-fulfilment checks.", cta: "Open Community", walkthrough: "Video walkthrough placeholder" },
    ],
  },
};

const ATLAS_BANNER = "ATLAS is watching 2.4M products across 6 suppliers. Your niche: African fashion accessories. 3 winning products identified.";

function Label({ text, color = T.gold }: { text: string; color?: string }) {
  return <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: "0.24em", textTransform: "uppercase", color, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}><div style={{ height: 1, width: 20, background: `linear-gradient(90deg,${color},transparent)` }} />{text}<div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${T.border})` }} /></div>;
}
function Tag({ children, color = T.dim, bg }: TagProps) {
  return <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, padding: "3px 9px", borderRadius: 4, background: bg || `${color}14`, border: `1px solid ${color}33`, color }}>{children}</span>;
}
function Card({ children, color, style = {}, onClick, className }: CardProps) {
  return <div onClick={onClick} className={className} style={{ background: T.surface, border: `1px solid ${color ? `${color}44` : T.border}`, borderRadius: 12, position: "relative", overflow: "hidden", ...style }}>{color ? <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} /> : null}{children}</div>;
}

function useRevealOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function useStream() {
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const abort = useRef(false);

  const run = useCallback(async (endpoint: string, payload: Record<string, string>) => {
    setOut("");
    setLoading(true);
    abort.current = false;
    try {
      const res = await fetch(`/api/v1/supervisors/atlas/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.body) throw new Error("Missing response stream body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done || abort.current) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as { token?: string; text?: string };
            if (parsed.token) setOut((value) => value + parsed.token);
            if (parsed.text) setOut((value) => value + parsed.text);
          } catch {
            // ignore malformed stream chunks
          }
        }
      }
    } catch {
      setOut("AI request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { out, loading, run, reset: () => setOut(""), stop: () => { abort.current = true; setLoading(false); } };
}

function ProfitCalculator() {
  const [state, setState] = useState<CalculatorState>({
    productCost: 12,
    sellingPrice: 25,
    shippingCost: 4,
    supplierShipping: 3,
    platformFee: 10,
    monthlySales: 100,
  });

  const grossMargin = state.sellingPrice - state.productCost - state.supplierShipping;
  const platformFeeAmount = state.sellingPrice * (state.platformFee / 100);
  const netProfit = grossMargin - platformFeeAmount + state.shippingCost;
  const monthlyNetProfit = netProfit * state.monthlySales;
  const marginPct = state.sellingPrice > 0 ? (netProfit / state.sellingPrice) * 100 : 0;
  const breakEvenUnits = null;

  const chartData = [
    { name: "Product cost", value: Math.max(state.productCost, 0), color: "#e05a4e" },
    { name: "Supplier shipping", value: Math.max(state.supplierShipping, 0), color: "#d97706" },
    { name: "Platform fee", value: Math.max(platformFeeAmount, 0), color: T.gold },
    { name: "Your profit", value: Math.max(netProfit, 0), color: T.green },
  ].filter((entry) => entry.value > 0);

  const presets = [
    { label: "T-shirt via Printful", state: { productCost: 12, sellingPrice: 25, shippingCost: 4, supplierShipping: 3, platformFee: 10, monthlySales: 80 } },
    { label: "Phone case via AliExpress", state: { productCost: 4, sellingPrice: 18, shippingCost: 5, supplierShipping: 2, platformFee: 10, monthlySales: 150 } },
    { label: "Mug via Gelato", state: { productCost: 7, sellingPrice: 20, shippingCost: 4, supplierShipping: 3, platformFee: 10, monthlySales: 120 } },
  ] as const;

  const sliders: Array<{ key: keyof CalculatorState; label: string; min: number; max: number; step: number; prefix: string }> = [
    { key: "productCost", label: "Product cost", min: 0, max: 100, step: 1, prefix: "$" },
    { key: "sellingPrice", label: "Selling price", min: 0, max: 300, step: 1, prefix: "$" },
    { key: "shippingCost", label: "Shipping charged", min: 0, max: 50, step: 1, prefix: "$" },
    { key: "supplierShipping", label: "Supplier shipping", min: 0, max: 30, step: 1, prefix: "$" },
    { key: "platformFee", label: "Platform fee", min: 0, max: 30, step: 0.5, prefix: "%" },
    { key: "monthlySales", label: "Monthly sales", min: 1, max: 500, step: 1, prefix: "" },
  ];

  return (
    <Card color={T.green}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.green, letterSpacing: "0.18em", marginBottom: 2 }}>PROFIT CALCULATOR</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Live margin analyzer</div>
      </div>
      <div style={{ padding: "20px 24px", display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {sliders.map((slider) => (
            <div key={slider.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>
                <span>{slider.label}</span>
                <span>{slider.prefix}{Number(state[slider.key]).toFixed(slider.key === "platformFee" ? 1 : 0)}</span>
              </div>
              <input type="range" min={slider.min} max={slider.max} step={slider.step} value={state[slider.key]} onChange={(event) => setState((prev) => ({ ...prev, [slider.key]: Number(event.target.value) }))} style={{ width: "100%" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, alignItems: "stretch" }}>
          <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, minHeight: 300 }}>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={3}>
                    {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {chartData.map((entry) => <Tag key={entry.name} color={entry.color}>{entry.name}</Tag>)}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {[
              { label: "Gross margin / sale", value: `$${grossMargin.toFixed(2)}`, color: T.gold },
              { label: "Platform fee", value: `$${platformFeeAmount.toFixed(2)}`, color: T.purple },
              { label: "Net profit / sale", value: `$${netProfit.toFixed(2)}`, color: netProfit >= 0 ? T.green : T.red },
              { label: "Monthly net profit", value: `$${monthlyNetProfit.toFixed(2)}`, color: T.ice },
              { label: "Margin %", value: `${marginPct.toFixed(1)}%`, color: marginPct >= 20 ? T.green : T.gold },
              { label: "Break-even units", value: breakEvenUnits === null ? "n/a" : String(breakEvenUnits), color: T.dim },
            ].map((metric) => (
              <div key={metric.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.08em", marginBottom: 4 }}>{metric.label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, lineHeight: 1, color: metric.color, fontWeight: 600 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {presets.map((preset) => (
            <button key={preset.label} type="button" onClick={() => setState(preset.state)} style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, padding: "9px 12px", borderRadius: 6, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, cursor: "pointer" }}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function WinnersDropshipping() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [selectedModel, setSelectedModel] = useState<ModelKey>("printful");
  const [activeSupplier, setActiveSupplier] = useState<string>("printful");
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [aiTool, setAiTool] = useState<ToolKey>("product-research");
  const [form, setForm] = useState<ToolFormValues>({});
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierSort, setSupplierSort] = useState<"recommended" | "delivery" | "margin">("recommended");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState<"recommended" | "price" | "margin" | "shipping">("recommended");
  const [supplierCatalog, setSupplierCatalog] = useState<SupplierCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSupplier, setCatalogSupplier] = useState<string | null>(null);
  const [blueprintDone, setBlueprintDone] = useState<Record<ModelKey, boolean[]>>({ printful: Array(6).fill(false), general: Array(6).fill(false), premium: Array(6).fill(false) });
  const { token } = useAuthStore();
  const { out, loading, run, reset } = useStream();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const reveal = useRevealOnce<HTMLDivElement>();
  const flow = useRevealOnce<HTMLDivElement>();
  const atlas = useRevealOnce<HTMLDivElement>();

  const authHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const setQuery = useCallback((patch: Record<string, string | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === null) next.delete(key);
        else next.set(key, value);
      });
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const supplierParam = searchParams.get("supplier");
    const modelParam = searchParams.get("model");

    if (tabParam === "overview" || tabParam === "suppliers" || tabParam === "niches" || tabParam === "calculator" || tabParam === "ai" || tabParam === "blueprint") {
      setTab(tabParam);
    }
    if (modelParam === "printful" || modelParam === "general" || modelParam === "premium") {
      setSelectedModel(modelParam);
    } else if (supplierParam && SUPPLIER_TO_MODEL[supplierParam]) {
      setSelectedModel(SUPPLIER_TO_MODEL[supplierParam]);
    }
    if (supplierParam && SUPPLIERS.some((supplier) => supplier.id === supplierParam)) {
      setActiveSupplier(supplierParam);
      if (supplierParam === "printful" || supplierParam === "gelato") setCatalogSupplier(supplierParam);
    }
  }, [searchParams]);

  const activeSupplierData = useMemo(() => SUPPLIERS.find((supplier) => supplier.id === activeSupplier) ?? null, [activeSupplier]);
  const selectedNiche = useMemo(() => NICHES.find((niche) => niche.id === activeNiche) ?? null, [activeNiche]);
  const blueprint = BLUEPRINTS[selectedModel];

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.trim().toLowerCase();
    return SUPPLIERS.filter((supplier) => {
      if (!query) return true;
      return [supplier.name, supplier.type, supplier.products, supplier.shipping, supplier.margin, supplier.countries, supplier.bestFor].join(" ").toLowerCase().includes(query);
    }).sort((left, right) => {
      if (supplierSort === "delivery") return left.shipping.localeCompare(right.shipping);
      if (supplierSort === "margin") return right.margin.localeCompare(left.margin);
      return Number(right.planRequired === "FREE") - Number(left.planRequired === "FREE");
    });
  }, [supplierSearch, supplierSort]);

  const filteredNiches = useMemo(() => {
    if (!activeNiche) return NICHES;
    return NICHES.filter((niche) => niche.id === activeNiche);
  }, [activeNiche]);

  const catalogStats = useMemo(() => {
    if (supplierCatalog.length === 0) return { count: 0, avgMargin: 0 };
    const avgMargin = supplierCatalog.reduce((sum, item) => {
      const retail = item.suggestedRetail || 0;
      const cost = item.costPrice || 0;
      return sum + (retail > 0 ? ((retail - cost) / retail) * 100 : 0);
    }, 0) / supplierCatalog.length;
    return { count: supplierCatalog.length, avgMargin };
  }, [supplierCatalog]);

  const filteredCatalogItems = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return supplierCatalog.filter((item) => {
      if (!query) return true;
      return [item.title, item.description, item.category, item.shippingTime, item.supplier?.name ?? "", item.atlasReason ?? ""].join(" ").toLowerCase().includes(query);
    }).sort((left, right) => {
      if (catalogSort === "price") return left.suggestedRetail - right.suggestedRetail;
      if (catalogSort === "margin") return (right.suggestedRetail - right.costPrice) - (left.suggestedRetail - left.costPrice);
      if (catalogSort === "shipping") return left.shippingTime.localeCompare(right.shippingTime);
      return Number(right.atlasScore ?? 0) - Number(left.atlasScore ?? 0);
    });
  }, [catalogSearch, catalogSort, supplierCatalog]);

  const openSupplierLaunch = useCallback((supplierId: string) => {
    const model = SUPPLIER_TO_MODEL[supplierId] ?? "printful";
    setActiveSupplier(supplierId);
    setSelectedModel(model);
    setTab("suppliers");
    setQuery({ supplier: supplierId, model, tab: "suppliers" });
  }, [setQuery]);

  const launchAtlasResearch = useCallback((defaults?: Partial<ToolFormValues>) => {
    setAiTool("product-research");
    setForm((current) => ({ ...current, ...defaults }));
    setTab("ai");
    setQuery({ tab: "ai" });
  }, [setQuery]);

  const selectModel = useCallback((model: ModelKey, openBlueprint = false) => {
    setSelectedModel(model);
    if (openBlueprint) setTab("blueprint");
    setQuery({ model, tab: openBlueprint ? "blueprint" : tab });
  }, [setQuery, tab]);

  const loadCatalog = useCallback(async (supplier: "printful" | "gelato") => {
    if (!token) return;
    setCatalogLoading(true);
    setCatalogError(null);
    setCatalogSupplier(supplier);
    try {
      const response = await fetch(`/api/v1/dropship/suppliers/${supplier}/catalog?limit=12`, { headers: authHeaders() });
      const data = (await response.json().catch(() => ({}))) as { products?: SupplierCatalogItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || `Failed to load ${supplier} catalog`);
      setSupplierCatalog(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : `Failed to load ${supplier} catalog`);
      setSupplierCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [authHeaders, token]);

  const syncCatalog = useCallback(async (supplier: "printful" | "gelato") => {
    if (!token) return;
    setCatalogLoading(true);
    setCatalogError(null);
    setCatalogSupplier(supplier);
    try {
      const response = await fetch(`/api/v1/dropship/suppliers/${supplier}/sync`, { method: "POST", headers: authHeaders() });
      const data = (await response.json().catch(() => ({}))) as { products?: SupplierCatalogItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || `Failed to sync ${supplier} catalog`);
      setSupplierCatalog(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : `Failed to sync ${supplier} catalog`);
    } finally {
      setCatalogLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    if (activeSupplier === "printful" || activeSupplier === "gelato") {
      void loadCatalog(activeSupplier);
    } else {
      setSupplierCatalog([]);
      setCatalogSupplier(null);
      setCatalogError(null);
      setCatalogLoading(false);
    }
  }, [activeSupplier, loadCatalog]);

  const toolDefinitions: ToolDef[] = [
    { id: "product-research", icon: "🔍", label: "Product Research", color: T.gold, desc: "Find winning products", fields: [{ k: "niche", label: "Niche / Product Category", ph: "African fashion accessories, home decor, fitness gear..." }, { k: "market", label: "Target Market", ph: "Kenya / Nigeria / Ghana / UK Diaspora / USA Diaspora / Global", kind: "select", options: ["Kenya", "Nigeria", "Ghana", "UK Diaspora", "USA Diaspora", "Global"] }, { k: "audience", label: "Target Audience", ph: "e.g. women 25-40, creators, diaspora buyers" }] },
    { id: "competitor-analysis", icon: "📊", label: "Competitor Analysis", color: T.purple, desc: "Price map and differentiation", fields: [{ k: "product", label: "Product or Category", ph: "e.g. phone cases, skincare kits, study planners" }] },
    { id: "product-description", icon: "✍️", label: "Product Description Generator", color: T.green, desc: "SEO copy and tags", fields: [{ k: "product", label: "Product Name", ph: "e.g. custom print hoodie" }, { k: "supplier", label: "Supplier", ph: "Printful / Gelato / AliExpress / CJ" }, { k: "audience", label: "Target Audience", ph: "e.g. African diaspora buyers" }] },
    { id: "brand-identity", icon: "🖼️", label: "Store Name + Brand Identity", color: T.ice, desc: "Names, palette, tagline, story", fields: [{ k: "niche", label: "Niche", ph: "African fashion, tech accessories, home living..." }, { k: "market", label: "Target Market", ph: "Kenya / Nigeria / UK Diaspora..." }, { k: "personality", label: "Personality (3 words)", ph: "premium, bold, minimal" }] },
  ];

  const selectedBlueprint = BLUEPRINTS[selectedModel];

  const handleGenerate = useCallback(() => {
    const endpointMap: Record<ToolKey, string> = {
      "product-research": "dropshipping-product-research",
      "competitor-analysis": "dropshipping-competitor-analysis",
      "product-description": "dropshipping-product-description",
      "brand-identity": "dropshipping-brand-identity",
    };
    void run(endpointMap[aiTool], form);
  }, [aiTool, form, run]);

  const setBlueprintStepDone = (index: number) => {
    setBlueprintDone((current) => {
      const next = [...current[selectedModel]];
      next[index] = !next[index];
      return { ...current, [selectedModel]: next };
    });
  };

  const handleBlueprintStart = useCallback((index: number) => {
    if (selectedModel === "printful") {
      if (index === 0) openSupplierLaunch("printful");
      if (index === 1) { setAiTool("product-research"); setForm({ niche: "phone cases", market: "Kenya", audience: "African buyers", supplier: "Printful / Gelato" }); setTab("ai"); setQuery({ tab: "ai" }); }
      if (index === 2) setTab("calculator");
      if (index === 3) { setAiTool("product-description"); setForm({ product: "phone case", supplier: "Printful", audience: "African buyers" }); setTab("ai"); setQuery({ tab: "ai" }); }
      if (index === 4) navigate("/market/vendor");
      if (index === 5) navigate("/community");
      return;
    }
    if (selectedModel === "general") {
      if (index === 0) openSupplierLaunch("aliexpress");
      if (index === 1) { setAiTool("product-research"); setForm({ niche: "general dropshipping", market: "Kenya", audience: "African buyers", supplier: "AliExpress + DSers" }); setTab("ai"); setQuery({ tab: "ai" }); }
      if (index === 2) openSupplierLaunch("aliexpress");
      if (index === 3) setTab("calculator");
      if (index === 4) navigate("/market/vendor");
      if (index === 5) navigate("/market/orders");
      return;
    }
    if (index === 0) openSupplierLaunch("spocket");
    if (index === 1) { setAiTool("product-research"); setForm({ niche: "premium dropshipping", market: "USA Diaspora", audience: "premium buyers", supplier: "Spocket / Zendrop" }); setTab("ai"); setQuery({ tab: "ai" }); }
    if (index === 2) openSupplierLaunch("spocket");
    if (index === 3) setTab("calculator");
    if (index === 4) navigate("/market/vendor");
    if (index === 5) navigate("/community");
  }, [navigate, openSupplierLaunch, selectedModel, setQuery]);

  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "suppliers", label: "Suppliers" },
    { id: "niches", label: "Niches" },
    { id: "calculator", label: "Calculator" },
    { id: "ai", label: "AI Tools" },
    { id: "blueprint", label: "Blueprint" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${T.bg};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(201,168,76,0.45)!important;}
        input,textarea,select{transition:border-color 0.2s;}
        .tab-btn:hover{color:${T.text}!important;}
        .card-hover:hover{transform:translateY(-2px);border-color:rgba(201,168,76,0.35)!important;}
        .action-btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px);}
      `}</style>

      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Syne',sans-serif" }}>
        <div style={{ padding: "16px 28px 0" }}>
          <ContextBar activeLayer="market" statusOverrides={{ market: "active" }} />
        </div>
        <div style={{ position: "relative", overflow: "hidden", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(43,95,142,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(43,95,142,0.025) 1px,transparent 1px)`, backgroundSize: "48px 48px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 200, background: "radial-gradient(ellipse,rgba(45,212,160,0.07),transparent 70%)", pointerEvents: "none" }} />
          <div ref={reveal.ref} style={{ maxWidth: 1120, margin: "0 auto", padding: "44px 28px 36px", textAlign: "center", position: "relative", opacity: reveal.visible ? 1 : 0, transform: reveal.visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 14px", marginBottom: 20 }}>
              {["Winners Ecosystem", "Phase 4", "Winners Market", "Dropshipping Hub"].map((item, index, list) => (
                <span key={item} style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: index === list.length - 1 ? T.green : T.dim, letterSpacing: "0.1em" }}>
                  {item}{index < list.length - 1 ? <span style={{ margin: "0 6px", color: T.border }}>→</span> : null}
                </span>
              ))}
            </div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: T.green, marginBottom: 12 }}>📦 Winners Dropshipping Hub · Phase 4A V1.1</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,5.5vw,66px)", fontWeight: 300, lineHeight: 0.95, marginBottom: 12 }}>Sell without stock.<br /><em style={{ fontStyle: "italic", color: T.green }}>Profit without limits.</em></h1>
            <p style={{ fontSize: 14, color: T.dim, lineHeight: 1.8, maxWidth: 540, margin: "0 auto 24px" }}>The Winners dropshipping engine. 6 suppliers. AI research. Auto-fulfillment.</p>
            <div style={{ maxWidth: 760, margin: "0 auto 22px", padding: "20px 24px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 16, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 8, fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em" }}>DROPSHIPPING V1.1</div>
              <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7 }}>A retail model where you sell products without holding inventory. When a customer buys, the supplier ships directly to them and you keep the margin.</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["$0 to Start", "Zero Inventory Risk", "AI Product Research", "African Market Ready"].map((chip) => <Tag key={chip} color={T.green}>{chip}</Tag>)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 }}>
              <button type="button" onClick={() => selectModel(selectedModel, true)} className="action-btn" style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, padding: "10px 14px", borderRadius: 6, background: T.gold, border: "none", color: T.bg, cursor: "pointer" }}>Start Your Store →</button>
              <button type="button" onClick={() => launchAtlasResearch({ niche: "African fashion accessories", market: "Kenya", audience: "African buyers" })} className="action-btn" style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, padding: "10px 14px", borderRadius: 6, background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.3)", color: T.green, cursor: "pointer" }}>View AI Research →</button>
            </div>
          </div>
        </div>
        <div style={{ borderBottom: `1px solid ${T.border}`, background: T.surface, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", display: "flex", gap: 0, overflowX: "auto" }}>
            {tabs.map((entry) => <button key={entry.id} type="button" className="tab-btn" onClick={() => setTab(entry.id)} style={{ padding: "14px 20px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === entry.id ? T.green : "transparent"}`, color: tab === entry.id ? T.green : T.dim, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 9.5, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{entry.label}</button>)}
          </div>
        </div>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 28px 48px", display: "flex", flexDirection: "column", gap: 28 }}>
          {tab === "overview" && (
            <div style={{ animation: "fadeIn 0.3s ease", display: "grid", gap: 22 }}>
              <div ref={flow.ref} style={{ opacity: flow.visible ? 1 : 0, transform: flow.visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
                <Label text="How It Works" />
                <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7, marginBottom: 14, maxWidth: 820 }}>ATLAS AI researches products, you list them in Winners Market, and supplier fulfillment moves automatically so your margin lands in your Winners wallet.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
                  {[
                    ["01", "🔍", "Find Product", "ATLAS AI research finds winning products for your niche."],
                    ["02", "🏪", "List on Store", "Add the product to Winners Market in one click."],
                    ["03", "🛒", "Customer Buys", "Buyer purchases from your store at your price."],
                    ["04", "⚡", "Auto-Fulfill", "Order is sent to the supplier automatically."],
                    ["05", "📦", "Ships Direct", "Supplier ships directly to your customer worldwide."],
                    ["06", "💰", "You Keep Margin", "Platform fee deducted and profit lands in your wallet."],
                  ].map((item, index) => (
                    <div key={item[0]} className="card-hover" style={{ animation: flow.visible ? `fadeIn 0.35s ease ${index * 60}ms both` : "none", background: T.surface, border: `1px solid ${T.border}`, padding: "18px 14px", textAlign: "center", borderRadius: 12 }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7.5, color: T.gold, letterSpacing: "0.15em", marginBottom: 8 }}>{item[0]}</div>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{item[1]}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{item[2]}</div>
                      <div style={{ fontSize: 10.5, color: T.dim, lineHeight: 1.55 }}>{item[3]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
                {[["$0", "Inventory", "Pay only when you sell", T.green], ["6", "Suppliers", "Printful · Gelato · AliExpress + more", T.gold], ["25-99%", "Margins", "Depending on product & supplier", T.purple], ["24hr", "First Sale", "Setup -> live -> first order possible", T.ice]].map((metric) => (
                  <Card key={metric[1]} color={metric[3]} style={{ padding: "18px 20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: metric[3], marginBottom: 4 }}>{metric[0]}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>{metric[1]}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.04em" }}>{metric[2]}</div>
                  </Card>
                ))}
              </div>
              <div>
                <Label text="Three Dropshipping Models" color={T.ice} />
                <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7, marginBottom: 14, maxWidth: 860 }}>Pick the lane that fits your audience, then use the Blueprint tab to launch step by step.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                  {[
                    { model: "printful" as const, label: "Print-on-Demand", icon: "🖨️", supplier: "Printful, Gelato", bestFor: "Creators, influencers, brands", pros: ["Custom branded products", "Zero inventory", "White-label packaging", "No design limits"], cons: ["Higher base cost", "Slower fulfillment (5-12 days)"], margin: "$15-45/item profit margin", color: T.gold },
                    { model: "general" as const, label: "General Dropshipping", icon: "📦", supplier: "AliExpress + DSers, CJ", bestFor: "High volume, testing markets", pros: ["Millions of products", "Ultra-low product cost", "Fast niche testing", "No upfront cost"], cons: ["Long shipping (10-25 days)", "No branding control"], margin: "$5-30/item profit margin", color: T.red },
                    { model: "premium" as const, label: "Premium Dropshipping", icon: "⭐", supplier: "Spocket, Zendrop", bestFor: "Quality brands, US/EU buyers", pros: ["Fast shipping (3-7 days)", "Vetted product quality", "US/EU based suppliers", "Better review profiles"], cons: ["Monthly platform fee", "Less variety"], margin: "$20-60/item profit margin", color: T.purple },
                  ].map((item) => (
                    <Card key={item.model} color={item.color} style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{item.label}</div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: item.color, letterSpacing: "0.08em" }}>{item.supplier}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7.5, color: T.dim, marginBottom: 8 }}>BEST FOR: {item.bestFor}</div>
                      {item.pros.map((value) => <div key={value} style={{ display: "flex", gap: 6, marginBottom: 4 }}><span style={{ color: T.green, fontSize: 9 }}>✓</span><span style={{ fontSize: 11, color: T.dim }}>{value}</span></div>)}
                      {item.cons.map((value) => <div key={value} style={{ display: "flex", gap: 6, marginBottom: 4 }}><span style={{ color: T.red, fontSize: 9 }}>✕</span><span style={{ fontSize: 11, color: T.dim }}>{value}</span></div>)}
                      <div style={{ marginTop: 12, padding: "8px 12px", background: `${item.color}0A`, border: `1px solid ${item.color}22`, borderRadius: 8 }}>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: item.color }}>💰 {item.margin}</div>
                      </div>
                      <button type="button" onClick={() => selectModel(item.model, true)} className="action-btn" style={{ marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700 }}>Start with this model →</button>
                    </Card>
                  ))}
                </div>
              </div>
              <div ref={atlas.ref}>
              <Card color={T.green} style={{ padding: 20 }}>
                <div style={{ opacity: atlas.visible ? 1 : 0, transition: "opacity 0.5s ease" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.green, letterSpacing: "0.14em", marginBottom: 8 }}>ATLAS BANNER</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{ATLAS_BANNER}</div>
                  <button type="button" onClick={() => launchAtlasResearch({ niche: "African fashion accessories", market: "Kenya", audience: "African buyers" })} style={{ padding: "10px 14px", borderRadius: 8, background: T.gold, color: T.bg, border: "none", fontFamily: "'Space Mono',monospace", fontSize: 9, cursor: "pointer" }}>View AI Research →</button>
                </div>
              </Card>
              </div>
            </div>
          )}

          {tab === "suppliers" && (
            <div style={{ animation: "fadeIn 0.3s ease", display: "grid", gap: 18 }}>
              <Label text="Supplier Network" />
              <Card color={T.ice} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Start with a fast path</div>
                    <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6 }}>Search by supplier strength, then sync the catalog you actually want to launch with.</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => openSupplierLaunch("printful")} style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(201,168,76,0.12)", border: `1px solid ${T.gold}33`, color: T.gold, cursor: "pointer" }}>Printful launch path</button>
                    <button type="button" onClick={() => openSupplierLaunch("gelato")} style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.3)", color: T.green, cursor: "pointer" }}>Gelato launch path</button>
                  </div>
                </div>
              </Card>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 10 }}>
                <input value={supplierSearch} onChange={(event) => setSupplierSearch(event.target.value)} placeholder="Search suppliers, shipping times, products, or use cases..." style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontFamily: "'Syne',sans-serif", fontSize: 13 }} />
                <select value={supplierSort} onChange={(event) => setSupplierSort(event.target.value as typeof supplierSort)} style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
                  <option value="recommended">Sort: Recommended</option>
                  <option value="delivery">Sort: Fastest delivery</option>
                  <option value="margin">Sort: Highest margin</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
                {filteredSuppliers.map((supplier) => {
                  const connected = activeSupplier === supplier.id;
                  return (
                    <Card key={supplier.id} color={connected ? supplier.model === "premium" ? T.purple : T.green : undefined} style={{ padding: 16, cursor: "pointer" }} onClick={() => setActiveSupplier(supplier.id)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{supplier.logo}</span>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 800 }}>{supplier.name}</div>
                            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>{supplier.type}</div>
                          </div>
                        </div>
                        <Tag color={connected ? T.green : T.dim}>{connected ? "Connected ✅" : supplier.planRequired}</Tag>
                      </div>
                      {supplier.highlight ? <div style={{ marginBottom: 8 }}><Tag color={T.gold}>{supplier.highlight}</Tag></div> : null}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          { label: "Products", value: supplier.products },
                          { label: "Shipping", value: supplier.shipping },
                          { label: "Margin", value: supplier.margin },
                          { label: "Countries", value: supplier.countries },
                        ].map((row) => (
                          <div key={row.label} style={{ background: T.surface2, borderRadius: 8, padding: "8px 10px", border: `1px solid ${T.border}` }}>
                            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: T.dim, letterSpacing: "0.08em" }}>{row.label}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.4 }}>{row.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, color: T.dim, lineHeight: 1.6 }}>{supplier.bestFor}</div>
                      <button type="button" onClick={(event) => { event.stopPropagation(); openSupplierLaunch(supplier.id); }} style={{ marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 8, background: connected ? "rgba(45,212,160,0.08)" : T.surface2, border: `1px solid ${connected ? T.green : T.border}`, color: connected ? T.green : T.text, fontFamily: "'Space Mono',monospace", fontSize: 9, cursor: "pointer" }}>{connected ? "Connected ✅" : "Connect"}</button>
                    </Card>
                  );
                })}
              </div>
              {activeSupplierData ? (
                <Card color={T.gold} style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 30 }}>{activeSupplierData.logo}</span>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{activeSupplierData.name}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.gold, letterSpacing: "0.1em" }}>{activeSupplierData.type}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: T.dim, lineHeight: 1.7 }}>{activeSupplierData.bestFor}</p>
                </Card>
              ) : null}
              {(activeSupplier === "printful" || activeSupplier === "gelato") && catalogSupplier === activeSupplier ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <Label text={`${activeSupplierData?.name ?? catalogSupplier} Live Catalog`} />
                    <button type="button" onClick={() => void syncCatalog(activeSupplier as "printful" | "gelato")} disabled={catalogLoading} style={{ background: T.gold, color: T.bg, border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: "'Space Mono',monospace", fontSize: 10, fontWeight: 700, cursor: catalogLoading ? "not-allowed" : "pointer" }}>{catalogLoading ? "Syncing..." : "Sync Live Catalog"}</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                    <Card style={{ padding: 12 }}><div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>Catalog items</div><div style={{ fontSize: 18, fontWeight: 800 }}>{catalogStats.count}</div></Card>
                    <Card style={{ padding: 12 }}><div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>Avg margin</div><div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{catalogStats.avgMargin.toFixed(0)}%</div></Card>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 10 }}>
                    <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Search the live catalog..." style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontFamily: "'Syne',sans-serif", fontSize: 13 }} />
                    <select value={catalogSort} onChange={(event) => setCatalogSort(event.target.value as typeof catalogSort)} style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
                      <option value="recommended">Sort: Recommended</option>
                      <option value="margin">Sort: Highest margin</option>
                      <option value="price">Sort: Lowest retail price</option>
                      <option value="shipping">Sort: Fastest shipping</option>
                    </select>
                  </div>
                  {catalogError ? <div style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.red}33`, background: "rgba(224,90,78,0.08)", color: T.red, fontSize: 13 }}>{catalogError}</div> : null}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                    {catalogLoading && supplierCatalog.length === 0 ? <Card style={{ padding: 18, color: T.dim }}>Loading live catalog...</Card> : filteredCatalogItems.length > 0 ? filteredCatalogItems.map((item) => (
                      <Card key={item.id} style={{ padding: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>{item.title}</div>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: T.green, marginBottom: 8 }}>${item.suggestedRetail.toFixed(2)} retail · ${item.costPrice.toFixed(2)} cost</div>
                        <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6, marginBottom: 10 }}>{item.description || "Live supplier catalog item"}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          <Tag color={T.ice}>{item.shippingTime}</Tag>
                          <Tag color={T.gold}>Margin ${(item.suggestedRetail - item.costPrice).toFixed(2)}</Tag>
                          {typeof item.atlasScore === "number" ? <Tag color={T.green}>ATLAS {item.atlasScore}</Tag> : null}
                        </div>
                        <button type="button" className="action-btn" style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 8 }}>View details</button>
                      </Card>
                    )) : <Card style={{ padding: 18, color: T.dim, lineHeight: 1.6 }}>Sync Printful or Gelato to populate a clean, searchable product feed here.</Card>}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {tab === "niches" && (
            <div style={{ animation: "fadeIn 0.3s ease", display: "grid", gap: 18 }}>
              <Label text="Profitable Niches" />
              <Card color={T.gold} style={{ padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>ATLAS niche intelligence</div>
                <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.7 }}>{ATLAS_BANNER}</div>
              </Card>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button type="button" onClick={() => setActiveNiche(null)} style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${T.border}`, background: activeNiche ? T.surface : T.gold, color: activeNiche ? T.text : T.bg, fontFamily: "'Space Mono',monospace", fontSize: 8, cursor: "pointer" }}>All</button>
                {NICHES.map((niche) => <button key={niche.id} type="button" onClick={() => setActiveNiche(niche.id)} style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${T.border}`, background: activeNiche === niche.id ? "rgba(45,212,160,0.1)" : T.surface, color: activeNiche === niche.id ? T.green : T.dim, fontFamily: "'Space Mono',monospace", fontSize: 8, cursor: "pointer" }}>{niche.emoji} {niche.name}</button>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
                {filteredNiches.map((niche) => (
                  <Card key={niche.id} color={niche.competition === "High" ? T.red : niche.competition === "Medium" ? T.gold : T.green} style={{ padding: 18, cursor: "pointer" }} onClick={() => setActiveNiche(activeNiche === niche.id ? null : niche.id)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{niche.emoji}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800 }}>{niche.name}</div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>{niche.marketSize}</div>
                        </div>
                      </div>
                      <Tag color={niche.competition === "High" ? T.red : niche.competition === "Medium" ? T.gold : T.green}>{niche.competition}</Tag>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px" }}><div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: T.dim, letterSpacing: "0.08em" }}>ATLAS confidence</div><div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{niche.confidence}%</div></div>
                      <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px" }}><div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: T.dim, letterSpacing: "0.08em" }}>Supplier</div><div style={{ fontSize: 12.5, fontWeight: 700 }}>{niche.recommendedSupplier}</div></div>
                    </div>
                    <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                      {niche.products.map((product) => <div key={product.name} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 10px", borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}` }}><div style={{ fontSize: 11.5, lineHeight: 1.4 }}>{product.name}</div><div style={{ textAlign: "right" }}><div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>{product.price}</div><div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: T.dim }}>{product.margin} margin</div></div></div>)}
                    </div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); launchAtlasResearch({ niche: niche.name, market: niche.market }); }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.gold}33`, background: "rgba(201,168,76,0.12)", color: T.gold, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 9 }}>Research This Niche →</button>
                  </Card>
                ))}
              </div>
              {selectedNiche ? <Card color={T.green} style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}><span style={{ fontSize: 28 }}>{selectedNiche.emoji}</span><div><div style={{ fontSize: 16, fontWeight: 800 }}>{selectedNiche.name}</div><div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.green, letterSpacing: "0.1em" }}>Demand: {selectedNiche.marketSize} · Competition: {selectedNiche.competition}</div></div></div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Tag color={T.gold}>{selectedNiche.recommendedSupplier}</Tag><Tag color={T.ice}>ATLAS {selectedNiche.confidence}%</Tag></div></Card> : null}
            </div>
          )}

          {tab === "calculator" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="Profit & Margin Calculator" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <ProfitCalculator />
                <Card color={T.purple} style={{ padding: 20 }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.purple, letterSpacing: "0.18em", marginBottom: 2 }}>SCALE PROJECTIONS</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Revenue at different volumes</div>
                  {[10, 50, 100, 500, 1000].map((orders) => {
                    const label = orders === 10 ? "Starter" : orders === 50 ? "Growing" : orders === 100 ? "Established" : orders === 500 ? "Scaling" : "Empire";
                    const color = orders === 10 ? T.dim : orders === 50 ? T.ice : orders === 100 ? T.gold : orders === 500 ? T.green : T.purple;
                    const pct = Math.min(100, (orders / 1000) * 100);
                    return (
                      <div key={orders} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color }}>{orders} orders/mo - {label}</span>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: T.text }}>~${(orders * 15).toLocaleString()} profit</span>
                        </div>
                        <div style={{ height: 5, background: T.surface2, borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}99)`, borderRadius: 999 }} /></div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="ATLAS Tools" color={T.purple} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 20 }}>
                {toolDefinitions.map((tool) => (
                  <button key={tool.id} type="button" onClick={() => { setAiTool(tool.id); reset(); setForm({}); }} className="card-hover" style={{ background: aiTool === tool.id ? `${tool.color}0A` : T.surface, border: `1px solid ${aiTool === tool.id ? `${tool.color}55` : T.border}`, borderRadius: 12, padding: 18, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{tool.icon}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>{tool.label}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: aiTool === tool.id ? tool.color : T.dim, letterSpacing: "0.06em" }}>{tool.desc}</div>
                  </button>
                ))}
              </div>
              {toolDefinitions.map((tool) => tool.id === aiTool ? (
                <Card key={tool.id} color={tool.color}>
                  <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, background: `linear-gradient(135deg,rgba(23,35,53,0.8),${T.surface})` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{tool.icon} {tool.label}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: tool.color, letterSpacing: "0.1em" }}>Route through /api/v1/supervisors/atlas/{tool.id}</div>
                  </div>
                  <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
                    {tool.fields.map((field) => (
                      <div key={field.k}>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{field.label}</div>
                        {field.kind === "select" ? (
                          <select value={form[field.k] || ""} onChange={(event) => setForm((current) => ({ ...current, [field.k]: event.target.value }))} style={{ width: "100%", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 13px", color: T.text, fontFamily: "'Syne',sans-serif", fontSize: 13 }}>
                            <option value="">Select...</option>
                            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input value={form[field.k] || ""} onChange={(event) => setForm((current) => ({ ...current, [field.k]: event.target.value }))} placeholder={field.ph} style={{ width: "100%", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 13px", color: T.text, fontFamily: "'Syne',sans-serif", fontSize: 13 }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "0 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.06em" }}>AI runs through the existing supervisor SSE routes and saves history automatically.</div>
                    <button type="button" onClick={handleGenerate} disabled={loading} style={{ background: loading ? T.border : tool.color, color: T.bg, border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "AI Researching..." : "Generate →"}</button>
                  </div>
                  {(out || loading) ? (
                    <div style={{ padding: "0 24px 22px", maxHeight: 480, overflowY: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: tool.color, animation: loading ? "blink 1s infinite" : "none" }} />
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: tool.color, letterSpacing: "0.14em" }}>{loading ? "GENERATING..." : "COMPLETE"}</span>
                      </div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, lineHeight: 1.8, color: T.text, whiteSpace: "pre-wrap" }}>{out || "Your ATLAS result will appear here."}{loading ? <span style={{ display: "inline-block", width: 7, height: 14, background: tool.color, animation: "blink 0.7s step-end infinite", borderRadius: 1, verticalAlign: "middle" }} /> : null}</div>
                    </div>
                  ) : null}
                </Card>
              ) : null)}
            </div>
          )}

          {tab === "blueprint" && (
            <div style={{ animation: "fadeIn 0.3s ease", display: "grid", gap: 18 }}>
              <Label text="Store Blueprint" />
              <Card color={T.green} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{selectedBlueprint.label} Blueprint</div>
                    <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.7 }}>{selectedBlueprint.intro}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["printful", "general", "premium"] as ModelKey[]).map((model) => <button key={model} type="button" onClick={() => { setSelectedModel(model); setQuery({ model, tab: "blueprint" }); }} style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${T.border}`, background: selectedModel === model ? "rgba(45,212,160,0.1)" : T.surface2, color: selectedModel === model ? T.green : T.dim, fontFamily: "'Space Mono',monospace", fontSize: 8, cursor: "pointer" }}>{BLUEPRINTS[model].label}</button>)}
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Tag color={T.gold}>{selectedBlueprint.supplierHint}</Tag>
                  <Tag color={T.ice}>6 steps</Tag>
                  <Tag color={T.green}>Checklist + video placeholder</Tag>
                </div>
              </Card>
              <div style={{ display: "grid", gap: 12 }}>
                {selectedBlueprint.steps.map((step, index) => {
                  const checked = blueprintDone[selectedModel][index];
                  return (
                    <Card key={step.title} color={checked ? T.green : T.border} style={{ padding: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.gold, letterSpacing: "0.18em", marginBottom: 6 }}>STEP {index + 1}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{step.title}</div>
                          <div style={{ fontSize: 12, color: T.dim }}>{step.time}</div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim }}>
                          <input type="checkbox" checked={checked} onChange={() => setBlueprintStepDone(index)} />
                          Complete
                        </label>
                      </div>
                      <div style={{ fontSize: 12.5, color: T.dim, lineHeight: 1.7, marginBottom: 12 }}>{step.tip}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <button type="button" onClick={() => handleBlueprintStart(index)} style={{ padding: "9px 12px", borderRadius: 8, background: T.gold, color: T.bg, border: "none", cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 9 }}>Start This Step</button>
                        <Tag color={T.ice}>{step.cta}</Tag>
                        <a href="#" onClick={(event) => event.preventDefault()} style={{ color: T.green, fontFamily: "'Space Mono',monospace", fontSize: 9, textDecoration: "none" }}>{step.walkthrough}</a>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
