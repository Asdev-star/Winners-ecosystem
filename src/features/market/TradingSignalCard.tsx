import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Shield,
  Zap,
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

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

interface TradingSignalCardProps {
  signal: TradingSignal;
}

export function TradingSignalCard({ signal }: TradingSignalCardProps) {
  const getTypeIcon = () => {
    switch (signal.type) {
      case "BUY":
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case "SELL":
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case "HOLD":
        return <Minus className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTypeColor = () => {
    switch (signal.type) {
      case "BUY":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "SELL":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "HOLD":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    }
  };

  const getStatusColor = () => {
    switch (signal.status) {
      case "active":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "triggered":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "expired":
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const potentialReturn =
    signal.type === "BUY"
      ? ((signal.targetPrice - signal.price) / signal.price) * 100
      : signal.type === "SELL"
        ? ((signal.price - signal.targetPrice) / signal.price) * 100
        : 0;

  const riskReward =
    signal.type === "BUY"
      ? (signal.targetPrice - signal.price) / (signal.price - signal.stopLoss)
      : signal.type === "SELL"
        ? (signal.price - signal.targetPrice) / (signal.stopLoss - signal.price)
        : 0;

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
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor()}`}
              >
                {getTypeIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {signal.symbol}
                </h3>
                <p className="text-sm text-gray-400">{signal.timeframe}</p>
              </div>
            </div>
            <Badge
              label={signal.status}
              className={`${getStatusColor()} capitalize`}
            />
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Entry Price</p>
              <p className="text-sm font-medium text-white">
                ${signal.price.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Target</p>
              <p className="text-sm font-medium text-green-400">
                ${signal.targetPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Stop Loss</p>
              <p className="text-sm font-medium text-red-400">
                ${signal.stopLoss.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {potentialReturn.toFixed(1)}% potential
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {riskReward.toFixed(1)}R risk/reward
              </span>
            </div>
          </div>

          {/* Confidence */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Confidence</span>
              <span className="text-xs font-medium text-white">
                {signal.confidence}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  signal.confidence >= 80
                    ? "bg-green-500"
                    : signal.confidence >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
          </div>

          {/* Analysis */}
          <div className="mb-4">
            <p className="text-sm text-gray-300 line-clamp-3">
              {signal.analysis}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                {new Date(signal.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">AI Generated</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
