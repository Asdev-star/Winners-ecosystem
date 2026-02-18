import StatCard from "../../components/ui/StatCard";
import ActivityChart from "../analytics/components/ActivityChart";
import RevenueChart from "../analytics/components/RevenueChart";
import AnalyticsSummary from "../analytics/components/AnalyticsSummary";
import AIInsightPanel from "../analytics/components/AIInsightPanel";

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="1,240"
          change="+12% this month"
        />
        <StatCard
          title="Active Courses"
          value="18"
          change="+2 new"
        />
        <StatCard
          title="Revenue"
          value="$24,300"
          change="+8.4%"
        />
        <StatCard
          title="Completion Rate"
          value="87%"
          change="+3%"
        />
      </div>

      <AnalyticsSummary />
<AIInsightPanel />
<ActivityChart />
<RevenueChart />


    </div>
  );
}
