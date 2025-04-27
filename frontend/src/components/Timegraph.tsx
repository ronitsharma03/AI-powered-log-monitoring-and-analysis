import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  ReferenceLine,
} from "recharts";
import { BarChart } from "lucide-react";

interface DataPoint {
  timestamp: number;
  errorCount: number;
}

interface TimeGraphProps {
  data: DataPoint[];
}

export default function TimeGraph({ data }: TimeGraphProps) {
  const [formattedData, setFormattedData] = useState<
    { timestamp: string; errorCount: number }[]
  >([]);
  const [maxErrorCount, setMaxErrorCount] = useState(0);

  // Update formatted data whenever new logs are received
  useEffect(() => {
    const now = new Date().getTime();
    const oneHourAgo = now - 60 * 60 * 1000; // 1 hour ago

    // Filter data to include only logs from the past 1 hour
    const filteredData = data.filter((point) => point.timestamp >= oneHourAgo);

    // Format data for the chart
    const newFormattedData = filteredData.map((point) => ({
      timestamp: new Date(point.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit", // Include seconds for more granularity
      }),
      errorCount: point.errorCount,
    }));

    // Calculate max error count for reference line
    const max = Math.max(...filteredData.map(point => point.errorCount), 3);
    setMaxErrorCount(max);
    
    setFormattedData(newFormattedData);
  }, [data]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-sm font-medium text-gray-300">{`Time: ${label}`}</p>
          <p className="text-sm font-bold text-red-500">{`Errors: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate threshold for warning level
  const threshold = Math.max(1, Math.ceil(maxErrorCount * 0.7));

  return (
    <div className="relative border-b mb-6 pb-6">
      <div className="flex items-center mb-3 gap-2">
        <BarChart size={20} className="text-blue-400" />
        <h3 className="text-lg font-medium text-white">Error Frequency</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart 
          data={formattedData} 
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
          <defs>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={"#4b5563"} opacity={0.4} />
          <XAxis
            dataKey="timestamp"
            tick={{
              fill: "#e5e7eb",
              fontSize: "12px",
              dy: 7,
            }}
            interval={Math.ceil(formattedData.length / 8)}
            axisLine={{ stroke: "#6b7280" }}
            tickLine={{ stroke: "#6b7280" }}
          />
          <YAxis
            tick={{ fill: "#e5e7eb", fontSize: "12px" }}
            allowDecimals={false}
            domain={[0, maxErrorCount > 3 ? "auto" : 3]}
            axisLine={{ stroke: "#6b7280" }}
            tickLine={{ stroke: "#6b7280" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={threshold} 
            stroke="#fbbf24" 
            strokeDasharray="3 3" 
            label={{ 
              value: "Warning Threshold", 
              position: "insideTopRight",
              fill: "#fbbf24",
              fontSize: 12
            }} 
          />
          <Area
            type="monotone"
            dataKey="errorCount"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#errorGradient)"
            activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2, fill: "#fff" }}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
          <Legend 
            verticalAlign="top" 
            align="right"
            iconType="circle"
            formatter={() => <span className="text-sm text-white">Error Count</span>}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {formattedData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          No error data available
        </div>
      )}
    </div>
  );
}