import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useAnalyticsStore } from "../analyticsStore";

function generateForecast(data: { name: string; value: number }[]) {
  if (data.length < 2) return [];

  const first = data[0].value;
  const last = data[data.length - 1].value;

  const slope = (last - first) / data.length;

  return Array.from({ length: 7 }).map((_, i) => ({
    name: `F${i + 1}`,
    value: Math.max(0, Math.round(last + slope * (i + 1))),
  }));
}

export default function ActivityChart() {
  const period = useAnalyticsStore((state) => state.period);
  const setPeriod = useAnalyticsStore((state) => state.setPeriod);
  const userData = useAnalyticsStore((state) => state.userData);
  const isLoading = useAnalyticsStore((state) => state.isLoading);

  const forecastData = generateForecast(userData);

  const lastRealPoint =
    userData.length > 0
      ? userData[userData.length - 1]
      : null;

  const forecastWithBridge = lastRealPoint
    ? [lastRealPoint, ...forecastData]
    : [];

  return (
    <div className="bg-white p-6 rounded shadow mt-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Active Users
        </h3>
      </div>

      {/* Period Filters */}
      <div className="flex gap-3 mb-4">
        {(["7d", "30d", "90d"] as const).map((p) => (
          <button
            key={p}
            disabled={isLoading}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded border transition ${
              period === p
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-100"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-80 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-pulse text-gray-400">
            Loading analytics...
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              {/* Real Data Line */}
              <Line
                data={userData}
                type="monotone"
                dataKey="value"
                stroke="#000"
                strokeWidth={2}
                dot={false}
              />

              {/* Forecast Line */}
              <Line
                data={forecastWithBridge}
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
