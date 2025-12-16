import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock } from "lucide-react";
import { type DashboardStats } from "@services/admin.api";
import { formatPrice } from "@utils/product";

interface Props {
  data: DashboardStats["bidStats"];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const BidActivityWidget: React.FC<Props> = ({
  data,
  timeRange,
  onTimeRangeChange,
}) => {
  const [viewMode, setViewMode] = useState("chart"); // 'chart' or 'list'

  const chartData = useMemo(() => {
    const filledData = new Map<
      string,
      { name: string; bids: number; autoBids: number; sortKey: number }
    >();

    // Helper to format date key and name based on range
    // Interfaces for different _id shapes
    interface DateParts {
      year: number;
      month: number;
      day: number;
      hour: number;
    }
    interface WeekParts {
      year: number;
      month: number;
      day: number;
      half: number;
    }
    interface MonthParts {
      year: number;
      month: number;
      day: number;
    }

    const processItem = (
      item: {
        _id: string | number | Date | DateParts | WeekParts | MonthParts;
        count: number;
      },
      type: "bids" | "autoBids"
    ) => {
      let key = "";
      let name = "";
      let sortKey = 0;

      if (timeRange === "all") {
        const d = new Date(item._id as string | number | Date);
        if (!isNaN(d.getTime())) {
          sortKey = d.getTime();
          name = `${d.getDate()}/${d.getMonth() + 1}`;
          key = sortKey.toString();
        } else {
          return;
        }
      } else if (timeRange === "week") {
        const id = item._id as WeekParts;
        const d = new Date(id.year, id.month - 1, id.day, id.half * 12);
        sortKey = d.getTime();
        const timeStr = id.half === 0 ? "AM" : "PM";
        name = `${id.day}/${id.month} ${timeStr}`;
        key = sortKey.toString();
      } else if (timeRange === "month") {
        const id = item._id as MonthParts;
        const d = new Date(id.year, id.month - 1, id.day);
        sortKey = d.getTime();
        name = `${id.day}/${id.month}`;
        key = sortKey.toString();
      } else {
        const id = item._id as DateParts;
        const hour = id.hour ?? 0; // Default to 0 if undefined (though should be there for 24h)
        const d = new Date(id.year, id.month - 1, id.day, hour);
        sortKey = d.getTime();
        name = `${hour.toString().padStart(2, "0")}:00`;
        key = sortKey.toString();
      }

      if (!filledData.has(key)) {
        filledData.set(key, { name, bids: 0, autoBids: 0, sortKey });
      }
      if (type === "bids") filledData.get(key)!.bids += item.count;
      if (type === "autoBids") filledData.get(key)!.autoBids += item.count;
    };

    // Pre-fill last 24h only (optional: for others we just show data presence)
    if (timeRange === "24h") {
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = d.getHours();
        const kDate = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          hour
        );
        const key = kDate.getTime().toString();
        const name = `${hour.toString().padStart(2, "0")}:00`;
        filledData.set(key, {
          name,
          bids: 0,
          autoBids: 0,
          sortKey: kDate.getTime(),
        });
      }
    }

    data.hourly.forEach((item) => processItem(item, "bids"));
    data.hourlyAuto.forEach((item) => processItem(item, "autoBids"));

    return Array.from(filledData.values()).sort(
      (a, b) => a.sortKey - b.sortKey
    );
  }, [data, timeRange]);

  const [lastActiveRange, setLastActiveRange] = useState("24h");

  React.useEffect(() => {
    if (timeRange !== "all") {
      setLastActiveRange(timeRange);
    }
  }, [timeRange]);

  const getDayCount = (range: string) => {
    switch (range) {
      case "24h":
        return 1;
      case "week":
        return 7;
      case "month":
        return 30;
      default:
        return 1;
    }
  };

  const handleLastClick = () => {
    if (timeRange === "all") {
      onTimeRangeChange(lastActiveRange);
    } else {
      let next = "24h";
      if (timeRange === "24h") next = "week";
      else if (timeRange === "week") next = "month";
      else if (timeRange === "month") next = "24h";
      onTimeRangeChange(next);
      setLastActiveRange(next);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 gap-2">
        <h3 className="font-bold text-gray-700 whitespace-nowrap">
          Bid {viewMode === "chart" ? "Activity" : "Ranking"}
        </h3>
        <div className="flex gap-2 mt-1 items-center">
          <Clock className="w-5 h-5 text-gray-500" />
          <div className="flex bg-gray-100 rounded-lg px-1.5 py-1 items-center h-fit">
            <div
              className={`flex items-center px-4 py-1 text-xs font-medium rounded-md transition-all cursor-pointer select-none ${
                timeRange !== "all"
                  ? "bg-white text-primary-blue shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={handleLastClick}
            >
              <span className="mr-1">Last</span>
              <span className="font-bold">
                {getDayCount(timeRange === "all" ? lastActiveRange : timeRange)}
              </span>
              <span className="ml-1">
                {"day" +
                  (getDayCount(
                    timeRange === "all" ? lastActiveRange : timeRange
                  ) === 1
                    ? ""
                    : "s")}
              </span>
            </div>
            <button
              className={`px-4 py-1 text-xs font-medium rounded-md transition-colors ${
                timeRange === "all"
                  ? "bg-white text-primary-blue shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => onTimeRangeChange("all")}
            >
              All time
            </button>
          </div>
        </div>
        <select
          className="custom-select text-base px-3 py-2 border-2 border-primary-blue rounded-md shadow-sm text-primary-blue font-medium outline-none cursor-pointer"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <option value="chart">Activity</option>
          <option value="list">Ranking</option>
        </select>
      </div>

      <div
        className={`h-64 w-full custom-scrollbar ${viewMode === "list" ? "overflow-y-auto" : "overflow-hidden"}`}
      >
        {viewMode === "chart" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} minTickGap={30} />
              <YAxis allowDecimals={false} />
              <Tooltip
                itemSorter={(item) => (item.name === "Total Bids" ? -1 : 1)}
              />
              <Line
                type="monotone"
                dataKey="bids"
                stroke="#8884d8"
                name="Total Bids"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="autoBids"
                stroke="#82ca9d"
                name="Auto Bids"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider pl-4">
                    Product
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Bidder
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider pr-8">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.top10.map((bid, i) => (
                  <tr key={i}>
                    <td
                      className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 truncate max-w-[120px] pl-4"
                      title={bid.product?.name}
                    >
                      {bid.product?.name || "Unknown"}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-600">
                      {bid.bidder?.name || "Unknown"}
                    </td>
                    <td className="pl-3 py-2 text-left whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatPrice(bid.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm border-t pt-4">
        <div>
          <p className="text-purple-800 text-xs uppercase font-bold">
            Total Bids
          </p>
          <p className="font-bold text-gray-500">
            {data.hourly.reduce((acc, cur) => acc + cur.count, 0)}
          </p>
        </div>
        <div>
          <p className="text-emerald-600 text-xs uppercase font-bold">
            Total Auto Bids
          </p>
          <p className="font-bold text-gray-500">
            {data.hourlyAuto.reduce((acc, cur) => acc + cur.count, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BidActivityWidget;
