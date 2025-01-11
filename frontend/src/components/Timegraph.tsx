import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  timestamp: number;
  errorCount: number;
}

interface TimeGraphProps {
  data: DataPoint[];
}

export default function TimeGraph({ data }: TimeGraphProps) {
  const [scrollOffset, setScrollOffset] = useState(0);

  // Time range (24 hours) and calculate visible range
  const now = new Date();
  const endTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  ).getTime();
  const startTime = endTime - 24 * 60 * 60 * 1000; // 24 hours ago
  const visibleTimeWindow = 8 * 60 * 60 * 1000; // 8 hours visible at a time
  const visibleStartTime = startTime + scrollOffset * visibleTimeWindow;
  const visibleEndTime = visibleStartTime + visibleTimeWindow;

  // Filter visible data
  const visibleData = data.filter(
    (point) =>
      point.timestamp >= visibleStartTime && point.timestamp <= visibleEndTime
  );

  // Format data for the chart
  const formattedData = visibleData.map((point) => ({
    timestamp: new Date(point.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    errorCount: point.errorCount,
  }));

  return (
    <div className="relative border-b mb-6 ">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke={"#4b5563"} />
          <XAxis dataKey="timestamp" tick={{ fill: "#e5e7eb" }} />
          <YAxis tick={{ fill: "#e5e7eb" }} allowDecimals={true} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              color: "#e5e7eb",
            }}
          />
          <Line
            type="monotone"
            dataKey="errorCount"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Scroll Buttons */}
      <div className="mb-8 mr-2 absolute bottom-0 right-0 flex items-center space-x-2 p-2 mt-20">
        <button
          onClick={() => setScrollOffset(Math.max(0, scrollOffset - 1))}
          className="p-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300"
          disabled={scrollOffset === 0}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setScrollOffset(Math.min(2, scrollOffset + 1))}
          className="p-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300"
          disabled={scrollOffset === 2}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
