import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
} from "lucide-react";
import Card from "../../components/ui/Card";

interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface PortfolioCardProps {
  item: PortfolioItem;
}

export function PortfolioCard({ item }: PortfolioCardProps) {
  const isProfit = item.pnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isProfit
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {item.symbol}
                </h3>
                <p className="text-sm text-gray-400">
                  {item.quantity.toLocaleString()} units
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                isProfit
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {isProfit ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isProfit ? "+" : ""}
                {item.pnlPercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Avg Price</p>
              <p className="text-sm font-medium text-white">
                ${item.avgPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Current Price</p>
              <p className="text-sm font-medium text-white">
                ${item.currentPrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* P&L */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Total P&L</span>
              </div>
              <span
                className={`text-lg font-bold ${
                  isProfit ? "text-green-400" : "text-red-400"
                }`}
              >
                {isProfit ? "+" : ""}${item.pnl.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
