import { Bot } from "lucide-react";

interface AnalysisProps {
  selectedLogId: string | null;
  analysisContent: string | null;
}

export default function Analysis({ selectedLogId, analysisContent }: AnalysisProps) {
  return (
    <div className="pl-4 bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2 text-white">
        <Bot size={24} className="text-blue-400" />
        <span>Error Analysis</span>
      </h2>
      <div className="flex flex-col h-[500px]">
        {selectedLogId ? (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-700 rounded-lg text-gray-300">
            {analysisContent ? (
              <p>{analysisContent}</p>
            ) : (
              <p className="text-gray-400">Fetching analysis...</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select an error log to view its analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
