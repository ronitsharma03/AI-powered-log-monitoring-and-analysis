import { Activity, Server, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface UptimeData {
  raw: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  formatted: string;
}

export default function ActivityMonitor() {
  const systemStatus: boolean = window.navigator.onLine;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [uptime, setUptime] = useState<UptimeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch uptime from backend
  const fetchUptime = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/v1/system/uptime');
      if (response.data.success) {
        setUptime(response.data.uptime);
        setError(null);
      } else {
        setError("Failed to fetch uptime data");
      }
    } catch (err) {
      console.error("Error fetching uptime:", err);
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Initial uptime fetch
    fetchUptime();
    
    // Update uptime every 30 seconds
    const uptimeTimer = setInterval(() => {
      fetchUptime();
    }, 30000);
    
    return () => {
      clearInterval(timer);
      clearInterval(uptimeTimer);
    };
  }, []);
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center space-x-2 text-white">
          <Activity size={24} className="text-blue-500" />
          <span>Activity Monitor</span>
        </h2>
        
        <div className="text-gray-400 text-sm">
          {currentTime.toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-4">
          <div className={`p-2 rounded-full ${systemStatus ? "bg-green-500/20" : "bg-red-500/20"}`}>
            {systemStatus ? 
              <Wifi size={20} className="text-green-400" /> : 
              <WifiOff size={20} className="text-red-400" />
            }
          </div>
          <div>
            <p className="font-semibold text-gray-50">
              System {systemStatus ? "Online" : "Offline"}
            </p>
            <p className="text-xs text-gray-400">
              Status updated just now
            </p>
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-4">
          <div className="p-2 rounded-full bg-blue-500/20">
            <Server size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-50">
              Monitor Active
            </p>
            {loading ? (
              <p className="text-xs text-gray-400">Loading uptime...</p>
            ) : error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <p className="text-xs text-gray-400">
                Server uptime: {uptime?.formatted || "Unknown"}
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-4">
          <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-blue-500" 
              style={{ width: `${systemStatus ? (uptime ? Math.min((uptime.minutes % 60) / 60 * 100, 100) : 0) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
