import { useEffect, useState } from "react";
import { adminApi } from "@services/admin.api";
import type { DashboardStats } from "@interfaces/admin";
import { Loader2 } from "lucide-react";
import UserDistributionChart from "@components/admin/charts/UserDistributionChart";
import ProductCategoryChart from "@components/admin/charts/ProductCategoryChart";
import OrderStatusChart from "@components/admin/charts/OrderStatusChart";
import BidActivityWidget from "@components/admin/charts/BidActivityWidget";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("24h");

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  const fetchStats = async (range: string) => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardStats(range);
      setStats(data);
    } catch (err) {
      setError("Failed to load dashboard stats");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  if (error || !stats) {
    return <div className="text-red-500">{error || "No data available"}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Users Chart */}
        <UserDistributionChart data={stats.userStats} />

        {/* 2. Products Chart */}
        <ProductCategoryChart data={stats.productStats} />

        {/* 3. Orders Chart */}
        <OrderStatusChart data={stats.orderStats} />

        {/* 4. Bids Chart / List */}
        <BidActivityWidget
          data={stats.bidStats}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
