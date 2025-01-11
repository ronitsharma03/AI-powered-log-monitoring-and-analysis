import { AlertTriangle, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../App.css";

export interface Log {
  id: string;
  timestamp: string;
  content: string;
  type: "info" | "error";
}

export interface AnalysisType {
  id: string;
  logId: string;
  content: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: string;
}

export default function LogsCard({
  logs,
  analyses,
  setChatMessages,
  setSelectedLogId,
  selectedLogId,
}: {
  logs: Log[];
  analyses: AnalysisType[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSelectedLogId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedLogId: string | null;
}) {
  const logsEndRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10; // Allow a small buffer

      setIsAtBottom(atBottom);
      setShowScrollToBottom(!atBottom);
    }
  };

  const handleScrollToBottomClick = () => {
    scrollToBottom();
    setIsAtBottom(true);
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [logs, isAtBottom]);

  return (
    <div
      className="lg:col-span-2 bg-gray-800 pr-2"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <h2
        className={`text-xl font-medium mb-4 flex items-center space-x-2 text-white
        }`}
      >
        <Terminal size={24} className={"text-blue-400"} />
        <span>Logs</span>
      </h2>
      <div className="space-y-2 max-h-[500px] overflow-y-auto logs-card-container pr-2">
        {logs.map((log) => (
          <button
            key={log.id}
            onClick={() => {
              if (log.type === "error") {
                setSelectedLogId(log.id);
                const analysis = analyses.find((a) => a.logId === log.id);
                if (analysis) {
                  setChatMessages([
                    {
                      id: Math.random().toString(),
                      content: analysis.content,
                      sender: "bot",
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }
              }
            }}
            className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 ${
              log.type === "error"
                ? "bg-red-900/30 hover:bg-red-900/40"
                : "bg-gray-700 hover:bg-gray-600"
            } ${selectedLogId === log.id ? "ring-2 ring-blue-500" : ""}`}
          >
            {log.type === "error" ? (
              <AlertTriangle className="text-red-500 shrink-0" />
            ) : (
              <Terminal className={`text-gray-400 shrink-0`} />
            )}
            <span
              className={`text-sm font-mono text-gray-300
              }`}
            >
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
      {showScrollToBottom && (
        <button
          className="fixed bottom-10 right-10 bg-blue-500 text-white p-2 rounded-full shadow-lg"
          onClick={handleScrollToBottomClick}
        >
          Scroll to bottom
        </button>
      )}
    </div>
  );
}
