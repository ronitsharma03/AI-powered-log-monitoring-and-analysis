import { AlertTriangle, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../App.css";
import { LogType } from "@/App";

export interface AnalysisType {
  log_message: string;
  breakdown: {
    timestamp: string;
    timezone: string;
    module: string;
    pci_device: string;
    error_message: string;
  };
  possible_cause: string;
  actionable_steps: string[];
}

export default function LogsCard({
  logs,
  setSelectedLogId,
  selectedLogId,
}: {
  logs: LogType[];
  analyses: AnalysisType[];
  setSelectedLogId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedLogId: string | null;
}) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = (smooth: boolean = true) => {
    logsEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10; // Allow a small buffer
      setIsAtBottom(atBottom);
    }
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [logs]);

  return (
    <div
      className="lg:col-span-2 bg-gray-800 pr-2"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <h2 className="text-xl font-medium mb-4 flex items-center space-x-2 text-white">
        <Terminal size={24} className="text-blue-400" />
        <span>Logs</span>
      </h2>
      <div className="space-y-2 max-h-[500px] overflow-y-auto logs-card-container pr-2">
        {logs.map((log) => (
          <button
            key={log.id}
            onClick={() => {
              if (log.type === "error") {
                setSelectedLogId(log.id);
              }
            }}
            className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 ${
              log.type === "error"
                ? "bg-red-900/30 hover:bg-red-900/40"
                : "bg-gray-700 hover:bg-gray-600"
            } ${selectedLogId === log.id ? "ring-2 ring-blue-500" : ""}`}
          >
            <AlertTriangle className="text-red-500 shrink-0" />

            <span className="text-sm font-mono text-gray-300">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              className={`${
                log.type === "error" ? "text-red-500" : "text-gray-300"
              } truncate`}
            >
              {log.content}
            </span>
          </button>
        ))}
        <div ref={logsEndRef} />
      </div>
      {!isAtBottom && (
        <button
          className="fixed bottom-10 right-10 bg-blue-500 text-white p-2 rounded-full shadow-lg"
          onClick={() => scrollToBottom()}
        >
          Scroll to bottom
        </button>
      )}
    </div>
  );
}
