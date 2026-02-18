import { useAnalyticsStore } from "../analyticsStore";

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function calculateGrowth(current: number, previous: number) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export default function AnalyticsSummary() {
  const {
    userData,
    revenueData,
    prevUserData,
    prevRevenueData,
    isLoading,
  } = useAnalyticsStore();

  const totalUsers = userData.reduce(
    (sum, d) => sum + d.value,
    0
  );
  const prevTotalUsers = prevUserData.reduce(
    (sum, d) => sum + d.value,
    0
  );

  const totalRevenue = revenueData.reduce(
    (sum, d) => sum + d.value,
    0
  );
  const prevTotalRevenue = prevRevenueData.reduce(
    (sum, d) => sum + d.value,
    0
  );

  const userGrowth = calculateGrowth(
    totalUsers,
    prevTotalUsers
  );
  const revenueGrowth = calculateGrowth(
    totalRevenue,
    prevTotalRevenue
  );

  const cardClass =
    "bg-white p-6 rounded shadow";

  const Growth = ({ value }: { value: number }) => (
    <span
      className={`text-sm ${
        value >= 0
          ? "text-green-600"
          : "text-red-600"
      }`}
    >
      {value >= 0 ? "▲" : "▼"}{" "}
      {Math.abs(value).toFixed(1)}%
    </span>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {isLoading ? (
        <div className="col-span-2 text-center animate-pulse text-gray-400">
          Updating summary...
        </div>
      ) : (
        <>
          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              Total Users
            </p>
            <p className="text-2xl font-semibold">
              {totalUsers.toLocaleString()}
            </p>
            <Growth value={userGrowth} />
          </div>

          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              Total Revenue
            </p>
            <p className="text-2xl font-semibold">
              {formatCurrency(totalRevenue)}
            </p>
            <Growth value={revenueGrowth} />
          </div>
        </>
      )}
    </div>
  );
}
