import React, { useState } from "react";
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
import { type DashboardStats } from "@services/admin.api";

interface Props {
  data: DashboardStats["productStats"];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
];

const ProductCategoryChart: React.FC<Props> = ({ data }) => {
  const [scope, setScope] = useState<"ongoing" | "all">("ongoing");

  const currentData = data[scope];

  const chartData = currentData.byCategory
    .map((c) => ({
      name: c.name,
      value: c.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-700 whitespace-nowrap">
            Products by Category
          </h3>
        </div>
        <div>
          <select
            className="custom-select text-base px-3 py-2 border-2 border-primary-blue rounded-md shadow-sm text-primary-blue font-medium outline-none bg-white cursor-pointer"
            value={scope}
            onChange={(e) => setScope(e.target.value as "ongoing" | "all")}
          >
            <option value="ongoing">Ongoing</option>
            <option value="all">All Products</option>
          </select>
        </div>
      </div>
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="value" name="Count">
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No data for filter
          </div>
        )}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 text-center text-sm border-t pt-4">
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">
            Total {scope === "ongoing" ? "Ongoing" : "Products"}
          </p>
          <p className="font-bold text-gray-700">{currentData.total}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">
            Categories
          </p>
          <p className="font-bold text-gray-700">
            {currentData.byCategory.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryChart;
