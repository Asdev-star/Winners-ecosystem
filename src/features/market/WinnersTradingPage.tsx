import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Bell,
  Star,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  Clock,
  Filter,
  Search,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Settings,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../auth/authStore";
import { useTradingStore } from "../../stores/tradingStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { TradingSignalCard } from "./TradingSignalCard";
import { PortfolioCard } from "./PortfolioCard";
import { MarketAnalysisCard } from "./MarketAnalysisCard";

interface TradingSignal {
  id: string;
  symbol: string;
  type: "BUY" | "SELL" | "HOLD";
  confidence: number;
  price: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  analysis: string;
  createdAt: string;
  status: "active" | "triggered" | "expired";
}

interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface MarketAnalysis {
  id: string;
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  assets: string[];
  createdAt: string;
}

export function WinnersTradingPage() {
  const { user } = useAuthStore();
  const {
    signals,
    portfolio,
    analyses,
    loading,
    fetchSignals,
    fetchPortfolio,
    fetchAnalyses,
    subscribeToSignal,
    unsubscribeFromSignal,
  } = useTradingStore();

  const [activeTab, setActiveTab] = useState<
    "signals" | "portfolio" | "analysis"
  >("signals");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const timeframes = [
    { value: "all", label: "All Timeframes" },
    { value: "1h", label: "1 Hour" },
    { value: "4h", label: "4 Hours" },
    { value: "1d", label: "1 Day" },
    { value: "1w", label: "1 Week" },
  ];

  const signalTypes = [
    { value: "all", label: "All Types" },
    { value: "BUY", label: "Buy Signals" },
    { value: "SELL", label: "Sell Signals" },
    { value: "HOLD", label: "Hold Signals" },
  ];

  useEffect(() => {
    fetchSignals();
    fetchPortfolio();
    fetchAnalyses();
  }, [fetchSignals, fetchPortfolio, fetchAnalyses]);

  const filteredSignals = signals.filter((signal) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        signal.symbol.toLowerCase().includes(query) ||
        signal.analysis.toLowerCase().includes(query)
      );
    }
    if (selectedTimeframe !== "all" && signal.timeframe !== selectedTimeframe) {
      return false;
    }
    if (selectedType !== "all" && signal.type !== selectedType) {
      return false;
    }
    return true;
  });

  const totalPnl = portfolio.reduce((sum, item) => sum + item.pnl, 0);
  const totalPnlPercent =
    portfolio.length > 0
      ? portfolio.reduce((sum, item) => sum + item.pnlPercent, 0) /
        portfolio.length
      : 0;

  const activeSignals = signals.filter((s) => s.status === "active").length;
  const triggeredSignals = signals.filter(
    (s) => s.status === "triggered",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                Winners Trading
              </h1>
              <p className="mt-2 text-gray-400">
                AI-powered trading signals and portfolio management
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchSignals()}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                New Signal
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Signals</p>
                  <p className="text-2xl font-bold text-white">
                    {activeSignals}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Triggered</p>
                  <p className="text-2xl font-bold text-white">
                    {triggeredSignals}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Portfolio P&L</p>
                  <p
                    className={`text-2xl font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-full ${totalPnl >= 0 ? "bg-green-500/20" : "bg-red-500/20"} flex items-center justify-center`}
                >
                  {totalPnl >= 0 ? (
                    <ArrowUpRight className="w-6 h-6 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-red-400" />
                  )}
                </div>
              </div>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {triggeredSignals > 0
                      ? Math.round(
                          (triggeredSignals /
                            (triggeredSignals + activeSignals)) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            {[
              { value: "signals", label: "Signals", icon: Zap },
              { value: "portfolio", label: "Portfolio", icon: BarChart3 },
              { value: "analysis", label: "Market Analysis", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "signals" && (
          <div>
            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search signals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {timeframes.map((tf) => (
                    <option key={tf.value} value={tf.value}>
                      {tf.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {signalTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Signals Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="text-center py-20">
                <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No signals found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your filters or check back later for new
                  signals.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredSignals.map((signal) => (
                    <motion.div
                      key={signal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TradingSignalCard signal={signal} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {activeTab === "portfolio" && (
          <div>
            {portfolio.length === 0 ? (
              <div className="text-center py-20">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No portfolio items
                </h3>
                <p className="text-gray-400">
                  Start trading to build your portfolio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.map((item) => (
                  <PortfolioCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "analysis" && (
          <div>
            {analyses.length === 0 ? (
              <div className="text-center py-20">
                <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No market analysis
                </h3>
                <p className="text-gray-400">
                  Check back later for AI-powered market insights.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyses.map((analysis) => (
                  <MarketAnalysisCard key={analysis.id} analysis={analysis} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WinnersTradingPage;
