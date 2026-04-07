import React, { useState, useEffect } from "react";
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
  PieChart,
  LineChart,
  Trending,
} from "lucide-react";
import { useAuthStore } from "../auth/authStore";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";

interface VirtualPortfolio {
  id: string;
  cashBalance: number;
  totalValue: number;
  positions: VirtualPosition[];
}

interface VirtualPosition {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

interface TradingSignal {
  id: string;
  asset: string;
  direction: "buy" | "sell";
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  tier: string;
  expiresAt: string;
  result: "win" | "loss" | "pending" | null;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
  };
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

const PaperTradingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [portfolio, setPortfolio] = useState<VirtualPortfolio | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "portfolio" | "trade" | "signals" | "analytics"
  >("portfolio");
  const [tradeSymbol, setTradeSymbol] = useState("");
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [isTrading, setIsTrading] = useState(false);

  useEffect(() => {
    fetchPortfolio();
    fetchSignals();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch("/api/v1/trading/portfolio", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignals = async () => {
    try {
      const response = await fetch("/api/v1/trading/signals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSignals(data);
      }
    } catch (error) {
      console.error("Error fetching signals:", error);
    }
  };

  const fetchMarketData = async (symbol: string) => {
    try {
      const response = await fetch(`/api/v1/trading/market/${symbol}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMarketData((prev) => ({ ...prev, [symbol]: data }));
        return data;
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
    }
    return null;
  };

  const executeTrade = async () => {
    if (!tradeSymbol || tradeQuantity <= 0) return;

    setIsTrading(true);
    try {
      const endpoint = tradeType === "buy" ? "buy" : "sell";
      const response = await fetch(`/api/v1/trading/portfolio/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          symbol: tradeSymbol.toUpperCase(),
          quantity: tradeQuantity,
        }),
      });

      if (response.ok) {
        await fetchPortfolio(); // Refresh portfolio
        await fetchMarketData(tradeSymbol.toUpperCase()); // Refresh market data
        setTradeSymbol("");
        setTradeQuantity(1);
        alert(`${tradeType.toUpperCase()} order executed successfully!`);
      } else {
        const error = await response.json();
        alert(error.error || "Trade failed");
      }
    } catch (error) {
      console.error("Error executing trade:", error);
      alert("Trade failed");
    } finally {
      setIsTrading(false);
    }
  };

  const updatePrices = async () => {
    try {
      const response = await fetch("/api/v1/trading/portfolio/update-prices", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const updatedPortfolio = await response.json();
        setPortfolio(updatedPortfolio);
      }
    } catch (error) {
      console.error("Error updating prices:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getPlanLimits = () => {
    const plan = user?.tenant?.plan || "FREE";
    switch (plan) {
      case "FREE":
        return { signals: 3, features: ["Paper trading", "Basic charts"] };
      case "PRO":
        return {
          signals: -1,
          features: [
            "Unlimited signals",
            "Portfolio sharing",
            "TradingView charts",
            "Backtesting",
          ],
        };
      case "ENTERPRISE":
        return {
          signals: -1,
          features: [
            "Full signal library",
            "Copy trading",
            "ATLAS market analysis",
          ],
        };
      default:
        return { signals: 3, features: ["Paper trading", "Basic charts"] };
    }
  };

  const planLimits = getPlanLimits();

  if (loading) {
    return (
      <div className="paper-trading-loading">
        <div className="spinner"></div>
        <p>Loading your trading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="paper-trading-page">
      <div className="trading-header">
        <div className="header-content">
          <h1>📈 Paper Trading</h1>
          <p>Practice trading with virtual $10,000</p>
        </div>

        <div className="plan-badge">
          <Badge
            variant={
              user?.tenant?.plan === "ENTERPRISE"
                ? "premium"
                : user?.tenant?.plan === "PRO"
                  ? "success"
                  : "default"
            }
          >
            {user?.tenant?.plan || "FREE"} Plan
          </Badge>
        </div>
      </div>

      {/* Portfolio Overview */}
      {portfolio && (
        <div className="portfolio-overview">
          <div className="overview-cards">
            <Card className="overview-card">
              <div className="card-icon">
                <DollarSign size={24} />
              </div>
              <div className="card-content">
                <h3>Total Value</h3>
                <p className="value">{formatCurrency(portfolio.totalValue)}</p>
                <p className="change positive">
                  +{formatCurrency(portfolio.totalValue - 10000)} from start
                </p>
              </div>
            </Card>

            <Card className="overview-card">
              <div className="card-icon">
                <BarChart3 size={24} />
              </div>
              <div className="card-content">
                <h3>Cash Balance</h3>
                <p className="value">{formatCurrency(portfolio.cashBalance)}</p>
                <p className="change neutral">Available to trade</p>
              </div>
            </Card>

            <Card className="overview-card">
              <div className="card-icon">
                <Activity size={24} />
              </div>
              <div className="card-content">
                <h3>Open Positions</h3>
                <p className="value">{portfolio.positions.length}</p>
                <p className="change neutral">Active trades</p>
              </div>
            </Card>

            <Card className="overview-card">
              <div className="card-icon">
                <Target size={24} />
              </div>
              <div className="card-content">
                <h3>Total P&L</h3>
                <p
                  className={`value ${portfolio.totalValue - 10000 >= 0 ? "positive" : "negative"}`}
                >
                  {formatCurrency(portfolio.totalValue - 10000)}
                </p>
                <p
                  className={`change ${portfolio.totalValue - 10000 >= 0 ? "positive" : "negative"}`}
                >
                  {(((portfolio.totalValue - 10000) / 10000) * 100).toFixed(2)}%
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="trading-tabs">
        <button
          className={`tab ${activeTab === "portfolio" ? "active" : ""}`}
          onClick={() => setActiveTab("portfolio")}
        >
          📊 Portfolio
        </button>
        <button
          className={`tab ${activeTab === "trade" ? "active" : ""}`}
          onClick={() => setActiveTab("trade")}
        >
          💰 Trade
        </button>
        <button
          className={`tab ${activeTab === "signals" ? "active" : ""}`}
          onClick={() => setActiveTab("signals")}
        >
          📡 Signals ({signals.length})
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📈 Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "portfolio" && portfolio && (
          <div className="portfolio-tab">
            <div className="tab-header">
              <h2>Your Positions</h2>
              <Button onClick={updatePrices} variant="outline" size="sm">
                <RefreshCw size={16} />
                Update Prices
              </Button>
            </div>

            {portfolio.positions.length > 0 ? (
              <div className="positions-table">
                <div className="table-header">
                  <span>Symbol</span>
                  <span>Quantity</span>
                  <span>Avg Cost</span>
                  <span>Current Price</span>
                  <span>Market Value</span>
                  <span>P&L</span>
                  <span>P&L %</span>
                </div>

                {portfolio.positions.map((position) => (
                  <div key={position.id} className="table-row">
                    <span className="symbol">{position.symbol}</span>
                    <span>{position.quantity}</span>
                    <span>{formatCurrency(position.avgCost)}</span>
                    <span>{formatCurrency(position.currentPrice)}</span>
                    <span>{formatCurrency(position.marketValue)}</span>
                    <span
                      className={
                        position.unrealizedPnL >= 0 ? "positive" : "negative"
                      }
                    >
                      {formatCurrency(position.unrealizedPnL)}
                    </span>
                    <span
                      className={
                        position.unrealizedPnL >= 0 ? "positive" : "negative"
                      }
                    >
                      {position.avgCost > 0
                        ? formatPercent(
                            (position.unrealizedPnL /
                              (position.avgCost * position.quantity)) *
                              100,
                          )
                        : "0.00%"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-positions">
                <p>No open positions yet. Start trading!</p>
                <Button onClick={() => setActiveTab("trade")}>
                  Make Your First Trade
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "trade" && (
          <div className="trade-tab">
            <div className="trade-interface">
              <div className="trade-form">
                <h2>Execute Trade</h2>

                <div className="form-group">
                  <label>Symbol</label>
                  <Input
                    type="text"
                    placeholder="e.g., AAPL, BTC, SPY"
                    value={tradeSymbol}
                    onChange={(e) =>
                      setTradeSymbol(e.target.value.toUpperCase())
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={tradeQuantity}
                    onChange={(e) =>
                      setTradeQuantity(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="trade-type">
                  <button
                    className={`trade-btn ${tradeType === "buy" ? "buy" : ""}`}
                    onClick={() => setTradeType("buy")}
                  >
                    🟢 BUY
                  </button>
                  <button
                    className={`trade-btn ${tradeType === "sell" ? "sell" : ""}`}
                    onClick={() => setTradeType("sell")}
                  >
                    🔴 SELL
                  </button>
                </div>

                <Button
                  onClick={executeTrade}
                  disabled={!tradeSymbol || tradeQuantity <= 0 || isTrading}
                  className="execute-trade-btn"
                >
                  {isTrading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Executing...
                    </>
                  ) : (
                    `Execute ${tradeType.toUpperCase()}`
                  )}
                </Button>
              </div>

              <div className="market-preview">
                <h3>Market Preview</h3>
                {tradeSymbol && marketData[tradeSymbol] && (
                  <div className="market-data">
                    <div className="symbol-price">
                      <h4>{marketData[tradeSymbol].symbol}</h4>
                      <p className="price">
                        {formatCurrency(marketData[tradeSymbol].price)}
                      </p>
                      <p
                        className={`change ${marketData[tradeSymbol].change >= 0 ? "positive" : "negative"}`}
                      >
                        {marketData[tradeSymbol].change >= 0 ? "+" : ""}
                        {formatCurrency(marketData[tradeSymbol].change)}(
                        {formatPercent(marketData[tradeSymbol].changePercent)})
                      </p>
                    </div>

                    <div className="trade-calculation">
                      <p>Quantity: {tradeQuantity}</p>
                      <p>
                        Total:{" "}
                        {formatCurrency(
                          tradeQuantity * marketData[tradeSymbol].price,
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "signals" && (
          <div className="signals-tab">
            <div className="tab-header">
              <h2>Trading Signals</h2>
              <div className="plan-info">
                <Badge variant="info">
                  {planLimits.signals === -1
                    ? "Unlimited"
                    : `${planLimits.signals} signals/month`}
                </Badge>
              </div>
            </div>

            {signals.length > 0 ? (
              <div className="signals-grid">
                {signals.map((signal) => (
                  <Card key={signal.id} className="signal-card">
                    <div className="signal-header">
                      <div className="signal-symbol">
                        <h3>{signal.asset}</h3>
                        <Badge
                          variant={
                            signal.direction === "buy" ? "success" : "danger"
                          }
                        >
                          {signal.direction.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="signal-confidence">
                        <Star size={16} />
                        {signal.confidence}%
                      </div>
                    </div>

                    <div className="signal-details">
                      <div className="detail-row">
                        <span>Entry:</span>
                        <span>{formatCurrency(signal.entryPrice)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Target:</span>
                        <span>{formatCurrency(signal.targetPrice)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Stop Loss:</span>
                        <span>{formatCurrency(signal.stopLoss)}</span>
                      </div>
                    </div>

                    <div className="signal-footer">
                      <div className="signal-meta">
                        <span>By {signal.creator.displayName}</span>
                        <span>
                          {new Date(signal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {signal.result && (
                        <Badge
                          variant={
                            signal.result === "win" ? "success" : "danger"
                          }
                        >
                          {signal.result.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="no-signals">
                <p>No trading signals available.</p>
                {(user?.tenant?.plan === "PRO" ||
                  user?.tenant?.plan === "ENTERPRISE") && (
                  <Button variant="outline">Create Signal</Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="analytics-tab">
            <h2>Portfolio Analytics</h2>

            <div className="analytics-grid">
              <Card className="analytics-card">
                <h3>Performance Overview</h3>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="label">Total Return</span>
                    <span
                      className={`value ${portfolio && portfolio.totalValue - 10000 >= 0 ? "positive" : "negative"}`}
                    >
                      {portfolio
                        ? formatCurrency(portfolio.totalValue - 10000)
                        : "$0.00"}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Return %</span>
                    <span
                      className={`value ${portfolio && portfolio.totalValue - 10000 >= 0 ? "positive" : "negative"}`}
                    >
                      {portfolio
                        ? (
                            ((portfolio.totalValue - 10000) / 10000) *
                            100
                          ).toFixed(2) + "%"
                        : "0.00%"}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Best Trade</span>
                    <span className="value positive">$0.00</span>
                  </div>
                  <div className="metric">
                    <span className="label">Worst Trade</span>
                    <span className="value negative">$0.00</span>
                  </div>
                </div>
              </Card>

              <Card className="analytics-card">
                <h3>Asset Allocation</h3>
                <div className="allocation-chart">
                  {portfolio && portfolio.positions.length > 0 ? (
                    portfolio.positions.map((position) => (
                      <div key={position.id} className="allocation-item">
                        <span className="symbol">{position.symbol}</span>
                        <div className="allocation-bar">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(position.marketValue / portfolio.totalValue) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="percentage">
                          {(
                            (position.marketValue / portfolio.totalValue) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No positions to display</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .paper-trading-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .trading-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .header-content p {
          margin: 0;
          color: var(--text-secondary);
        }

        .portfolio-overview {
          margin-bottom: 2rem;
        }

        .overview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .overview-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
        }

        .card-icon {
          color: var(--primary);
          background: rgba(59, 130, 246, 0.1);
          padding: 0.75rem;
          border-radius: 8px;
        }

        .card-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .card-content .value {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .card-content .change {
          margin: 0;
          font-size: 0.8rem;
        }

        .change.positive {
          color: var(--success);
        }

        .change.negative {
          color: var(--danger);
        }

        .change.neutral {
          color: var(--text-secondary);
        }

        .trading-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2rem;
        }

        .tab {
          padding: 1rem 2rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .tab-content {
          min-height: 400px;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .tab-header h2 {
          margin: 0;
          color: var(--text-primary);
        }

        .positions-table {
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          background: var(--light-bg);
          font-weight: 600;
          color: var(--text-primary);
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .symbol {
          font-weight: 600;
          color: var(--primary);
        }

        .positive {
          color: var(--success);
        }

        .negative {
          color: var(--danger);
        }

        .no-positions {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .trade-interface {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .trade-form {
          background: white;
          padding: 2rem;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .trade-form h2 {
          margin: 0 0 2rem 0;
          color: var(--text-primary);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .trade-type {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
        }

        .trade-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid var(--border);
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .trade-btn.buy.active {
          background: var(--success);
          color: white;
          border-color: var(--success);
        }

        .trade-btn.sell.active {
          background: var(--danger);
          color: white;
          border-color: var(--danger);
        }

        .execute-trade-btn {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .market-preview {
          background: white;
          padding: 2rem;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .market-preview h3 {
          margin: 0 0 1.5rem 0;
          color: var(--text-primary);
        }

        .market-data {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .symbol-price h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          color: var(--text-primary);
        }

        .symbol-price .price {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .trade-calculation {
          padding: 1rem;
          background: var(--light-bg);
          border-radius: 6px;
        }

        .signals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .signal-card {
          padding: 1.5rem;
        }

        .signal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .signal-symbol h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .signal-confidence {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--warning);
          font-weight: 600;
        }

        .signal-details {
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .detail-row span:first-child {
          color: var(--text-secondary);
        }

        .signal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .signal-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .no-signals {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .analytics-card {
          padding: 2rem;
        }

        .analytics-card h3 {
          margin: 0 0 1.5rem 0;
          color: var(--text-primary);
        }

        .performance-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--light-bg);
          border-radius: 6px;
        }

        .metric .label {
          color: var(--text-secondary);
        }

        .metric .value {
          font-weight: 600;
        }

        .allocation-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .allocation-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .allocation-bar {
          flex: 1;
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 4px;
        }

        .percentage {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          min-width: 50px;
          text-align: right;
        }

        .no-data {
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem;
        }

        .paper-trading-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .trading-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .overview-cards {
            grid-template-columns: 1fr;
          }

          .trading-tabs {
            flex-wrap: wrap;
          }

          .tab {
            padding: 0.75rem 1rem;
          }

          .trade-interface {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .table-row {
            text-align: center;
          }

          .signals-grid {
            grid-template-columns: 1fr;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .performance-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PaperTradingPage;
