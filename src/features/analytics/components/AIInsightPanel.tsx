import { useAnalyticsStore } from "../analyticsStore";

function analyzeTrend(data: number[]) {
  if (data.length < 2) return "Not enough data.";

  const first = data[0];
  const last = data[data.length - 1];

  const change = ((last - first) / first) * 100;

  if (change > 10)
    return "📈 Strong upward growth trend detected.";
  if (change > 0)
    return "📊 Moderate growth observed.";
  if (change < -10)
    return "📉 Significant decline detected.";
  if (change < 0)
    return "⚠ Slight downward trend observed.";

  return "Stable performance across the selected period.";
}

export default function AIInsightPanel() {
  const userData = useAnalyticsStore((state) => state.userData);
  const revenueData = useAnalyticsStore((state) => state.revenueData);
  const period = useAnalyticsStore((state) => state.period);
  const isLoading = useAnalyticsStore((state) => state.isLoading);

  const userValues = userData.map((d) => d.value);
  const revenueValues = revenueData.map((d) => d.value);

  const userInsight = analyzeTrend(userValues);
  const revenueInsight = analyzeTrend(revenueValues);

  return (
    <div className="bg-gray-100 p-6 rounded shadow mt-8">
      <h3 className="text-lg font-semibold mb-4">
        AI Insights ({period})
      </h3>

      {isLoading ? (
        <div className="animate-pulse text-gray-500">
          Analyzing data...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded">
            <p className="font-medium">User Activity</p>
            <p className="text-gray-600">{userInsight}</p>
          </div>

          <div className="bg-white p-4 rounded">
            <p className="font-medium">Revenue Trend</p>
            <p className="text-gray-600">{revenueInsight}</p>
          </div>
        </div>
      )}
    </div>
  );
}
