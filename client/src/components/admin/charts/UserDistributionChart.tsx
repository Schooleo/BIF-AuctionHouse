import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardStats } from "@services/admin.api";

interface Props {
  data: DashboardStats["userStats"];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const UserDistributionChart: React.FC<Props> = ({ data }) => {
  const chartData = [
    { name: "Bidder", value: data.byRole.bidder || 0 },
    { name: "Seller", value: data.byRole.seller || 0 },
    { name: "Admin", value: data.byRole.admin || 0 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mt-2.5 mb-4">
        <h3 className="font-bold text-gray-700 whitespace-nowrap">
          User Distribution
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={95}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 text-center text-sm border-t pt-4">
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">
            Total Users
          </p>
          <p className="font-bold text-gray-700">{data.total}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">
            Bidder
          </p>
          <p className="font-bold text-gray-700">{data.byRole.bidder || 0}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">
            Seller
          </p>
          <p className="font-bold text-gray-700">{data.byRole.seller || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default UserDistributionChart;
