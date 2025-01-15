import { useState, useEffect } from "react";
import TimeGraph from "./components/Timegraph";
import ActivityMonitor from "./components/ActivityMonitor";
import LogsCard, { AnalysisType, Log } from "./components/LogsCard";
import Analysis from "./components/Analysis";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";

interface DataPoint {
  timestamp: number;
  errorCount: number;
}

function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [errorPoints, setErrorPoints] = useState<DataPoint[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisType[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  useEffect(() => {
    // Simulate error data for the past 24 hours
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const data: DataPoint[] = [];

    for (let i = 0; i < 24; i++) {
      const timestamp = startOfDay + i * 60 * 60 * 1000;
      const errorCount = Math.floor(Math.random() * 5);
      if (errorCount > 0) {
        data.push({ timestamp, errorCount });
      }
    }

    setErrorPoints(data);

    const interval = setInterval(() => {
      const isError = Math.random() > 0.9;
      const logId = Math.random().toString();
      const newLog: Log = {
        id: logId,
        timestamp: new Date().toISOString(),
        content: isError
          ? "Error: Connection timeout in service endpoint"
          : "System running normally",
        type: isError ? "error" : "info",
      };

      setLogs((prev) => [...prev.slice(-50), newLog]);

      if (isError) {
        setErrorPoints((prev) => {
          const now = new Date();
          const hour = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours()
          ).getTime();

          const existingPoint = prev.find((p) => p.timestamp === hour);
          if (existingPoint) {
            return prev.map((p) =>
              p.timestamp === hour ? { ...p, errorCount: p.errorCount + 1 } : p
            );
          } else {
            return [...prev, { timestamp: hour, errorCount: 1 }];
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch analysis when a log is selected
  useEffect(() => {
    if (selectedLogId) {
      fetch(`/api/logs/${selectedLogId}/analysis`)
        .then((response) => response.json())
        .then((data: AnalysisType) => {
          setSelectedAnalysis(data.content);
          setAnalyses((prev) => [...prev.slice(-10), data]);
        })
        .catch((error) => {
          console.error("Error fetching analysis:", error);
          setSelectedAnalysis("Error fetching analysis. Please try again.");
        });
    } else {
      setSelectedAnalysis(null);
    }
  }, [selectedLogId]);

  return (
    <div className="min-h-screen w-full transition-colors duration-200 bg-gray-800">
      <div className="flex flex-col">
        <div className="bg-gray-800">
          <ActivityMonitor />
          <TimeGraph data={errorPoints} />
        </div>
        <div className="px-8 flex max-sm:flex-col w-full max-sm:pt-10">
          <ResizablePanelGroup direction="horizontal" className="flex flex-col">
            <ResizablePanel>
              <LogsCard
                logs={logs}
                // analyses={analyses}
                setSelectedLogId={setSelectedLogId}
                selectedLogId={selectedLogId}
              />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel>
              <Analysis
                selectedLogId={selectedLogId}
                analysisContent={selectedAnalysis}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}

export default App;
