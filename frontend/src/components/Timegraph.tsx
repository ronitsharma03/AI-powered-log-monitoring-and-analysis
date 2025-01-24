import React, { useState, useEffect } from "react";
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
  const [formattedData, setFormattedData] = useState<
    { timestamp: string; errorCount: number }[]
  >([]);

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

    setFormattedData(newFormattedData);
  }, [data]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-sm text-gray-300">{`Time: ${label}`}</p>
          <p className="text-sm text-red-500">{`Errors: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative border-b mb-6 pb-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formattedData} margin={{ top: 20 }}> {/* Add margin to the top */}
          <CartesianGrid strokeDasharray="3 3" stroke={"#4b5563"} />
          <XAxis
            dataKey="timestamp"
            tick={{
              fill: "#e5e7eb",
              fontSize: "14px", // Reduce font size
              dy: 7, // Add padding below the X-axis labels
            }}
            interval={Math.ceil(formattedData.length / 10)} // Adjust interval for better spacing
          />
          <YAxis
            tick={{ fill: "#e5e7eb", fontSize: "14px" }} // Reduce font size for Y-axis
            allowDecimals={false}
            domain={[0, "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="errorCount"
            stroke="#ef4444"
            strokeWidth={2}
            dot={(props) =>
              props.payload.errorCount > 0 ? (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={4}
                  stroke="#ef4444"
                  fill="#ef4444"
                />
              ) : (
                <React.Fragment />
              )
            }
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}