import { Terminal } from "lucide-react";

export default function ActivityMonitor() {
  const systemStatus: boolean = window.navigator.onLine;
  
  return (
    <div className="flex justify-between items-start mb-4 p-4">
      <h2
        className={`text-xl font-semibold flex items-center space-x-2 text-white
              }`}
      >
        <Terminal size={24} className="text-blue-600" />
        <span>Activity Monitor</span>
      </h2>

      <div
        className={`flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-700`}
      >
        <div>
          <div className="flex flex-row items-center gap-4">
            <div
              className={`h-2 w-2 rounded-full ${
                systemStatus ? "bg-green-500" : "bg-red-500"
              } animate-pulse`}
            ></div>
            <p className="font-semibold text-gray-50">
              System {systemStatus ? "Online" : "Offline"}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
