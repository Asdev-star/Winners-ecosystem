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

export default function RevenueChart() {
  const revenueData = useAnalyticsStore((state) => state.revenueData);
  const isLoading = useAnalyticsStore((state) => state.isLoading);

  return (
    <div className="bg-white p-6 rounded shadow mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Revenue Trend
      </h3>

      <div className="w-full h-80 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-pulse text-gray-400">
            Loading revenue...
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  `$${value.toLocaleString()}`
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#16a34a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
