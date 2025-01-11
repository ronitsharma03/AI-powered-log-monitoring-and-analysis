import { Moon, Sun, Terminal } from "lucide-react";

export default function Topbar({isDark, setIsDark}: { isDark: any, setIsDark: any}) {
    return (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <Terminal
              className={isDark ? "text-blue-400" : "text-blue-600"}
              size={32}
            />
            <h1
              className={`text-2xl font-semibold ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              System Monitor
            </h1>
          </div>
          <button
            onClick={() => setIsDark((prev: any) => !prev)}
            className={`p-2 rounded-lg ${
              isDark
                ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                : "bg-white text-gray-800 hover:bg-gray-100"
            } transition-colors duration-200`}
          >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
    )
}