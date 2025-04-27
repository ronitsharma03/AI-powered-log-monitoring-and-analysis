import { AlertTriangle, ArrowDown, FileWarning, Terminal, PauseCircle, PlayCircle } from "lucide-react";
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
  const [autoScroll, setAutoScroll] = useState(true);

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
    if (isAtBottom && autoScroll) {
      scrollToBottom();
    }
  }, [logs, autoScroll, isAtBottom]);

  // Remove duplicate logs based on logId
  const uniqueLogs = logs.reduce((acc, log) => {
    if (!acc.some((existingLog) => existingLog.logId === log.logId)) {
      acc.push(log);
    }
    return acc;
  }, [] as LogType[]);

  return (
    <div
      className="lg:col-span-2 bg-gray-800 pr-4 pl-4 pb-4 rounded-lg"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="sticky top-0 bg-gray-800 py-4 z-10 flex justify-between items-center">
        <h2 className="text-xl font-medium flex items-center space-x-2 text-white">
          <FileWarning size={22} className="text-blue-400" />
          <span>System Logs</span>
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className="flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1.5 rounded-md text-gray-300"
          >
            {autoScroll ? (
              <>
                <PauseCircle size={14} className="text-blue-400" />
                <span>Pause Auto-scroll</span>
              </>
            ) : (
              <>
                <PlayCircle size={14} className="text-green-400" />
                <span>Resume Auto-scroll</span>
              </>
            )}
          </button>
          <span className="text-sm text-gray-400 px-2 py-1 bg-gray-700 rounded-md">
            {uniqueLogs.length} errors
          </span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto logs-card-container p-2">
        {uniqueLogs.length > 0 ? (
          uniqueLogs.map((log) => (
            <button
              key={log.logId}
              onClick={() => setSelectedLogId(log.logId)}
              className={`w-full text-left p-3 rounded-lg flex flex-col space-y-2 transition-colors duration-200 border border-transparent 
                ${
                  selectedLogId === log.logId
                    ? "bg-red-900/40 border-red-500/50"
                    : "bg-red-900/20 hover:bg-red-900/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={18} className="text-red-400 shrink-0" />
                  <span className="text-sm font-mono text-gray-300">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {selectedLogId === log.logId && (
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Selected</span>
                )}
              </div>
              <div className="text-white text-[14px] font-mono leading-relaxed break-words">
                {log.logMessage.split('"log":"')[1].split('"}')[0]}
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Terminal size={32} className="mb-2 opacity-50" />
            <p>No error logs to display</p>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
      
      {(!isAtBottom || !autoScroll) && uniqueLogs.length > 5 && (
        <button
          className="fixed bottom-10 right-10 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
          onClick={() => {
            scrollToBottom();
            if (!autoScroll) setAutoScroll(true);
          }}
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}