import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

interface MarketAnalysis {
  id: string;
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  assets: string[];
  createdAt: string;
}

interface MarketAnalysisCardProps {
  analysis: MarketAnalysis;
}

export function MarketAnalysisCard({ analysis }: MarketAnalysisCardProps) {
  const getSentimentIcon = () => {
    switch (analysis.sentiment) {
      case "bullish":
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case "bearish":
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case "neutral":
        return <Minus className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getSentimentColor = () => {
    switch (analysis.sentiment) {
      case "bullish":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "bearish":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "neutral":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    }
  };

  const getConfidenceColor = () => {
    if (analysis.confidence >= 80) return "text-green-400";
    if (analysis.confidence >= 60) return "text-yellow-400";
    return "text-red-400";
  };

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
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSentimentColor()}`}
              >
                {getSentimentIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {analysis.title}
                </h3>
                <p className="text-sm text-gray-400 capitalize">
                  {analysis.sentiment} Sentiment
                </p>
              </div>
            </div>
            <Badge
              label={`${analysis.confidence}%`}
              className={`${getConfidenceColor()} font-semibold`}
            />
          </div>

          {/* Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Assets */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Related Assets
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.assets.map((asset, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300 font-medium"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">AI Confidence</span>
              </div>
              <span className={`text-sm font-semibold ${getConfidenceColor()}`}>
                {analysis.confidence}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-2 rounded-full ${
                  analysis.confidence >= 80
                    ? "bg-green-500"
                    : analysis.confidence >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                {new Date(analysis.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">AI Analysis</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
