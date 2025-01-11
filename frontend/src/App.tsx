import { useState, useEffect, useRef } from "react";
import TimeGraph from "./components/Timegraph";
import ActivityMonitor from "./components/ActivityMonitor";
import LogsCard, { AnalysisType, Log, Message } from "./components/LogsCard";
import Analysis from "./components/Analysis";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";

interface DataPoint {
  timestamp: number;
  errorCount: number;
}

function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [errorPoints, setErrorPoints] = useState<DataPoint[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);


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

        setIsAnalyzing(true);
        setTimeout(() => {
          const newAnalysis: AnalysisType = {
            id: Math.random().toString(),
            logId: logId,
            content:
              "The error appears to be caused by network latency issues. Recommended action: Check network connectivity and service health metrics.",
          };
          setAnalyses((prev) => [...prev.slice(-10), newAnalysis]);
          setIsAnalyzing(false);

          if (selectedLogId === logId) {
            setChatMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                content: newAnalysis.content,
                sender: "bot",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedLogId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        content: newMessage,
        sender: "user",
        timestamp: new Date().toISOString(),
      },
    ]);

    // Simulate bot response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          content:
            "I'll analyze that further. Based on the error patterns, it seems the network latency spikes correlate with high traffic periods. Consider implementing request rate limiting or scaling the service capacity during peak hours.",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1000);

    setNewMessage("");
  };

  const selectedAnalysis = analyses.find((a) => a.logId === selectedLogId);

  return (
    <div className="min-h-screen w-fulltransition-colors duration-200 bg-gray-800">
      <div className="flex flex-col">
        <div className="bg-gray-800">
          <ActivityMonitor />
          <TimeGraph data={errorPoints} />
        </div>
        <div className="px-8 flex flex-row w-full">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <LogsCard
                logs={logs}
                analyses={analyses}
                setChatMessages={setChatMessages}
                setSelectedLogId={setSelectedLogId}
                selectedLogId={selectedLogId}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <Analysis
                selectedLogId={selectedLogId}
                chatMessages={chatMessages}
                chatEndRef={chatEndRef}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}

export default App;
