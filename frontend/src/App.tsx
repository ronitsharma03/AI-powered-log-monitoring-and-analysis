import { useState, useEffect } from "react";
import TimeGraph from "./components/Timegraph";
import ActivityMonitor from "./components/ActivityMonitor";
import LogsCard from "./components/LogsCard";
import Analysis from "./components/Analysis";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { AnalysisType, fetchLogAnalysis } from "./lib/actions";

interface DataPoint {
  timestamp: number;
  errorCount: number;
}

export interface LogType {
  logId: string;
  logMessage: string;
  timestamp: string;
}

function App() {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisType | null>(null);
  const [errorPoints, setErrorPoints] = useState<DataPoint[]>([]);

  useEffect(() => {
    const createWebSocket = () => {
      const socket = new WebSocket("ws://localhost:3001");

      socket.onopen = () => {
        console.log("WebSocket connected");
        setSocket(socket);
      };

      socket.onmessage = (event) => {
        const jsonData = JSON.parse(event.data);
        console.log("Received data:", jsonData);

        // Add new log data
        setLogs((logs) => [...logs, jsonData]);

        // Update error points for the TimeGraph
        setErrorPoints((prevPoints) => [
          ...prevPoints,
          {
            timestamp: new Date(jsonData.timestamp).getTime(),
            errorCount: jsonData ? 1 : 0,
          },
        ]);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = (event) => {
        console.log("WebSocket closed", event);
        // Reconnect if WebSocket closes
        setTimeout(createWebSocket, 5000);
      };

      return socket;
    };

    const ws = createWebSocket();

    return () => {
      if (ws) {
        ws.close();
        console.log("WebSocket connection closed");
      }
    };
  }, []);

  // Fetch analysis when a log is selected
  useEffect(() => {
    if (selectedLogId) {
      const fetchAnalysis = async () => {
        const analysisData = await fetchLogAnalysis(selectedLogId);
        setAnalysis(analysisData);
      };
      fetchAnalysis();
    }
  }, [selectedLogId]);

  if (!socket) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Connecting...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full transition-colors duration-200 bg-gray-800">
      <div className="flex flex-col">
        <div className="bg-gray-800">
          <ActivityMonitor />
          <TimeGraph data={errorPoints} /> {/* Pass errorPoints to TimeGraph */}
        </div>
        <div className="px-8 flex max-sm:flex-col w-full max-sm:pt-10">
          <ResizablePanelGroup direction="horizontal" className="flex flex-col">
            <ResizablePanel>
              <LogsCard
                logs={logs}
                setSelectedLogId={setSelectedLogId}
                selectedLogId={selectedLogId}
              />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel>
              <Analysis selectedLogId={selectedLogId} analysis={analysis} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}

export default App;
