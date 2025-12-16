import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DashboardStats } from "@services/admin.api";

interface Props {
  data: DashboardStats["orderStats"];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const OrderStatusChart: React.FC<Props> = ({ data }) => {
  const chartData = data
    .map((o) => ({
      name: o.status.replace(/_/g, " "),
      value: o.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mt-2.5 mb-6">
        <h3 className="font-bold text-gray-700 whitespace-nowrap">
          Orders by Status
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
              tickCount={6}
            />
            <Tooltip />
            <Bar dataKey="value" name="Orders">
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-auto border-t pt-4 text-center">
        <p className="text-gray-500 text-xs uppercase font-semibold">
          Total Orders
        </p>
        <p className="font-bold text-gray-700">
          {data.reduce((acc, curr) => acc + curr.count, 0)}
        </p>
      </div>
    </div>
  );
};

export default OrderStatusChart;
