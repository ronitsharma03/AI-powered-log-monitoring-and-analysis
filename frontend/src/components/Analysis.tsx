import { AnalysisType } from "@/lib/actions";
import { Bot } from "lucide-react";
import "../App.css";

interface AnalysisProps {
  selectedLogId: string;
  analysis: AnalysisType | null;
}

export default function Analysis({ selectedLogId, analysis }: AnalysisProps) {
  return (
    <div className="pl-4 bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2 text-white">
        <Bot size={24} className="text-blue-400" />
        <span>Error Analysis</span>
      </h2>
      <div className="flex flex-col h-[500px]">
        {selectedLogId ? (
          analysis ? (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-700 rounded-lg text-gray-300  logs-card-container">
              <span className="text-lg font-semibold mb-2">Error Message:</span>
              <p className="mb-4 text-red-500">
                {analysis.analysis.breakdown.error_message}
              </p>

              <h3 className="text-lg font-semibold mb-2">Breakdown:</h3>
              <ul className="mb-4">
                <li>Timestamp: {analysis.analysis.breakdown.timestamp}</li>
                <li>Timezone: {analysis.analysis.breakdown.timezone}</li>
                <li>Module: {analysis.analysis.breakdown.module}</li>
                <li>PCI Device: {analysis.analysis.breakdown.pci_device}</li>
                <li>
                  Error Message: {analysis.analysis.breakdown.error_message}
                </li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">Possible Cause:</h3>
              <p className="mb-4">{analysis.analysis.possible_cause}</p>

              <h3 className="text-lg font-semibold mb-2">Actionable Steps:</h3>
              <ul className="list-disc list-inside">
                {analysis.analysis.actionable_steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <p className="text-gray-400 ">Fetching analysis....</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select an error log to view its analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
