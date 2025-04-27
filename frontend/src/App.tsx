import { useState, useEffect } from "react";
import TimeGraph from "./components/Timegraph";
import ActivityMonitor from "./components/ActivityMonitor";
import LogsCard from "./components/LogsCard";
import Analysis from "./components/Analysis";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { AnalysisType, fetchLogAnalysis } from "./lib/actions";
import { Cog, LayoutDashboard, LayoutList } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<'logs' | 'dashboard'>('logs');
  const [showSettings, setShowSettings] = useState<boolean>(false);

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
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
          <p>Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full transition-colors duration-200 bg-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>System Log Analyzer</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="bg-gray-700 rounded-lg flex">
              <button
                className={`px-4 py-2 rounded-l-lg flex items-center gap-2 ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setActiveTab('logs')}
              >
                <LayoutList size={16} />
                <span>Logs</span>
              </button>
              <button
                className={`px-4 py-2 rounded-r-lg flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
              title="Settings"
            >
              <Cog size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {activeTab === 'logs' && (
            <div className="bg-gray-800">
              <ActivityMonitor />
              {/* <TimeGraph data={errorPoints} /> */}
            </div>
          )}

          {activeTab === 'dashboard' ? (
            <Dashboard logs={logs} />
          ) : (
            <div className="flex max-sm:flex-col w-full max-sm:pt-10 mt-4">
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
          )}
        </div>
      </div>

      <Settings visible={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;
