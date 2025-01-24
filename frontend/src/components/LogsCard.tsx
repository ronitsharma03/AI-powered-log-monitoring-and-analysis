import { AlertTriangle, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../App.css";
import { LogType } from "@/App";

export default function LogsCard({
  logs,
  setSelectedLogId,
  selectedLogId,
}: {
  logs: LogType[];
  setSelectedLogId: React.Dispatch<React.SetStateAction<string>>;
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

  // Remove duplicate logs based on logId
  const uniqueLogs = logs.reduce((acc, log) => {
    if (!acc.some((existingLog) => existingLog.logId === log.logId)) {
      acc.push(log);
    }
    return acc;
  }, [] as LogType[]);

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
      <div className="space-y-2 max-h-[500px] overflow-y-auto logs-card-container p-2">
        {uniqueLogs.map((log) => (
          <button
            key={log.logId}
            onClick={() => setSelectedLogId(log.logId)}
            className={`w-full text-left p-3 rounded-lg flex flex-col space-y-2 transition-colors duration-200 bg-red-900/30 hover:bg-red-900/40 ${
              selectedLogId === log.logId ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="text-red-500 shrink-0" />
              <span className="text-sm font-mono text-gray-300">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-white text-[15px]">
              {log.logMessage.split('"log":"')[1].split('"}')[0]}
            </div>
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