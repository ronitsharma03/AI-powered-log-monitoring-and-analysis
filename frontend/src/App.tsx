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

export interface LogType {
  log: {
    timestamp: Date;
    log: string;
  };
  analysis: string;
}

function App() {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // WebSocket setup and message handling with auto-reconnect
  useEffect(() => {
    const createWebSocket = () => {
      const socket = new WebSocket("ws://localhost:3000", "frontend");

      socket.onopen = () => {
        console.log("WebSocket connected");
        setSocket(socket);
      };

      socket.onmessage = (event) => {
        const jsonData = JSON.parse(event.data);
        console.log("Received data:", jsonData);
        setLogs((logs) => [...logs, jsonData]); // Adding new log data
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = (event) => {
        console.log("WebSocket closed", event);
        // Reconnect if WebSocket closes
        setTimeout(createWebSocket, 3000); // Reconnect after 3 seconds
      };

      return socket;
    };

    const ws = createWebSocket(); // Initialize WebSocket connection

    // Cleanup function to close WebSocket when the component unmounts
    return () => {
      if (ws) {
        ws.close();
        console.log("WebSocket connection closed");
      }
    };
  }, []); // Empty dependency array to run this effect once on mount

  // Render connecting message while WebSocket is not yet connected
  if (!socket) {
    return <div>Connecting...</div>;
  }

  // Rendering the logs once WebSocket is connected
  return (
    <div className="min-h-screen w-full transition-colors duration-200 bg-gray-800">
      <div className="flex flex-col">
        <div className="bg-gray-800">
          <ActivityMonitor />
          {/* <TimeGraph data={errorPoints} /> */}
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
              {/* <Analysis
                selectedLogId={selectedLogId}
                analysisContent={selectedAnalysis}
              /> */}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}

export default App;
