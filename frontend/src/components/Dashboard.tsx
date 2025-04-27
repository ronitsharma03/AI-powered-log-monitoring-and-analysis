import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, 
  Treemap, ComposedChart, Area, Line
} from 'recharts';
import { LogType } from '@/App';
import { 
  Activity, 
  AlertCircle, 
  BarChart2, 
  Clock,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Layers,
  HardDrive,
} from 'lucide-react';
import axios from 'axios';
import { extractErrorType, extractModule, filterLogsByTimeRange, getModuleColor } from '@/lib/dashboard-utils';


interface DashboardProps {
  logs: LogType[];
}

// Color palette for the charts
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
  '#ef4444', // red-500
  '#84cc16', // lime-500
  '#0ea5e9', // sky-500
  '#d946ef', // fuchsia-500
  '#64748b', // slate-500
];

// Define the interface for treemap data
interface TreemapDataItem {
  name: string;
  value: number;
  fill?: string;
}

// Define the interface for Treemap content props
interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  depth?: number;
  root?: any;
  payload?: TreemapDataItem;
}

// Dashboard component
export default function Dashboard({ logs }: DashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'module' | 'error' | 'hour'>('module');
  const [totalProcessedLogs, setTotalProcessedLogs] = useState<number>(0);
  
  // Throttle logs updates with a dedicated state to prevent frequent re-renders
  const [throttledLogs, setThrottledLogs] = useState<LogType[]>([]);

  // Throttle log updates to reduce render frequency
  useEffect(() => {
    const timer = setTimeout(() => {
      setThrottledLogs(logs);
    }, 1000); // Update dashboard more frequently (1 second instead of 5)
    
    return () => clearTimeout(timer);
  }, [logs]);
  
  // Filter logs by time range - memoize to prevent unnecessary recalculations
  const filteredLogs = useMemo(() => 
    filterLogsByTimeRange(throttledLogs, selectedTimeRange),
  [throttledLogs, selectedTimeRange]);

  // Calculate total errors (simple derivation doesn't need useMemo)
  const totalErrors = filteredLogs.length;
  
  // Calculate average errors per hour
  const avgErrorsPerHour = useMemo(() => {
    if (filteredLogs.length === 0) return 0;
    
    const oldestLog = filteredLogs.reduce((oldest, log) => {
      const logDate = new Date(log.timestamp);
      return !oldest || logDate < new Date(oldest.timestamp) ? log : oldest;
    }, filteredLogs[0]);
    
    const oldestTime = new Date(oldestLog.timestamp).getTime();
    const now = new Date().getTime();
    const hours = Math.max(1, (now - oldestTime) / (1000 * 60 * 60));
    
    return Math.round((filteredLogs.length / hours) * 10) / 10;
  }, [filteredLogs]);

  // Process by module - memoized
  const moduleData = useMemo(() => {
    const moduleCount: Record<string, number> = {};
    
    filteredLogs.forEach(log => {
      const module = extractModule(log.logMessage);
      moduleCount[module] = (moduleCount[module] || 0) + 1;
    });
    
    return Object.entries(moduleCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLogs]);

  // Process by error type - memoized
  const errorTypesData = useMemo(() => {
    const errorTypeCount: Record<string, number> = {};
    
    filteredLogs.forEach(log => {
      const errorType = extractErrorType(log.logMessage);
      errorTypeCount[errorType] = (errorTypeCount[errorType] || 0) + 1;
    });
    
    return Object.entries(errorTypeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  // Process by hour - memoized
  const timeData = useMemo(() => {
    const hourCount: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCount[i.toString().padStart(2, '0')] = 0;
    }

    filteredLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours().toString().padStart(2, '0');
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });

    return Object.entries(hourCount)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [filteredLogs]);

  // Most active hour - memoized
  const mostActiveHour = useMemo(() => {
    if (timeData.length === 0) return 'N/A';
    return timeData.reduce((max, item) => item.count > max.count ? item : max, timeData[0]).hour;
  }, [timeData]);

  // Fetch the total number of logs processed from the database
  const fetchTotalLogsCount = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/v1/logs/count');
      if (response.data.success) {
        setTotalProcessedLogs(response.data.count);
      }
    } catch (err) {
      console.error("Error fetching total logs count:", err);
    }
  }, []);

  // Memoize the fetch function to prevent recreation on every render
  const fetchSystemStats = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/v1/system/stats');
      if (response.data.success) {
        setSystemStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching system stats:", err);
    }
  }, []);

  // Fetch system stats and total logs count on mount and when time range changes
  useEffect(() => {
    fetchSystemStats();
    fetchTotalLogsCount();
  }, [fetchSystemStats, fetchTotalLogsCount]);

  // Refresh data handler - use the memoized fetch function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      await fetchSystemStats();
      await fetchTotalLogsCount();
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [fetchSystemStats, fetchTotalLogsCount]);

  // Custom Tooltip - memoized to prevent recreation on every render
  const CustomTooltip = useCallback(({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{ 
      name?: string; 
      value?: number; 
      payload?: { name?: string; value?: number; }; 
    }>
  }) => {
    if (active && payload && payload.length) {
      const name = payload[0].name || payload[0].payload?.name || '';
      const value = payload[0].value || 0;
      return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-sm font-medium text-gray-300">{`${name}: ${value}`}</p>
          <p className="text-xs text-gray-400">{`${totalErrors > 0 ? Math.round((value / totalErrors) * 100) : 0}% of total`}</p>
        </div>
      );
    }
    return null;
  }, [totalErrors]);

  // Module Distribution Treemap
  const ModuleTreemap = useCallback(() => {
    // For each module, calculate its color
    const moduleDataWithColors = moduleData.map((item) => ({
      ...item,
      fill: getModuleColor(item.name)
    }));

    // Create tree map cells with proper rendering
    const treemapCells = moduleDataWithColors.map((entry, index) => (
      <Cell
        key={`cell-${index}`}
        fill={entry.fill}
        onMouseEnter={() => setHoveredSection(entry.name)}
        onMouseLeave={() => setHoveredSection(null)}
      />
    ));

    return (
      <div className="animate-fadeIn">
        <ResponsiveContainer width="100%" height={350}>
          <Treemap
            data={moduleDataWithColors}
            dataKey="value"
            nameKey="name"
            isAnimationActive={true}
            stroke="#1f2937"
            fill="#3b82f6"
          >
            {treemapCells}
          </Treemap>
        </ResponsiveContainer>
      </div>
    );
  }, [moduleData, setHoveredSection]);

  // Error Types Chart
  const ErrorTypesChart = useCallback(() => (
    <div className="animate-fadeIn">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={errorTypesData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" />
          <XAxis 
            dataKey="type" 
            angle={-45} 
            textAnchor="end" 
            height={60} 
            tick={{ fill: '#d1d5db' }} 
            axisLine={{ stroke: '#6b7280' }}
          />
          <YAxis 
            tick={{ fill: '#d1d5db' }} 
            axisLine={{ stroke: '#6b7280' }}
          />
          <RechartsTooltip content={CustomTooltip} />
          <Bar 
            dataKey="count" 
            name="Errors" 
            onMouseEnter={(data) => setHoveredSection(data.type)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            {errorTypesData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="bar-cell" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  ), [errorTypesData, CustomTooltip, setHoveredSection]);

  // Hourly Distribution Chart
  const HourlyDistributionChart = useCallback(() => (
    <div className="animate-fadeIn">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={timeData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" />
          <XAxis 
            dataKey="hour" 
            scale="band" 
            tick={{ fill: '#d1d5db' }} 
            axisLine={{ stroke: '#6b7280' }}
          />
          <YAxis 
            tick={{ fill: '#d1d5db' }} 
            axisLine={{ stroke: '#6b7280' }}
          />
          <RechartsTooltip content={CustomTooltip} />
          <Area 
            type="monotone" 
            dataKey="count" 
            fill="rgba(59, 130, 246, 0.2)" 
            stroke="#3b82f6" 
            activeDot={{ r: 8 }} 
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#10b981" 
            dot
            name="Errors"
            activeDot={{ r: 6, fill: "#10b981" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  ), [timeData, CustomTooltip]);

  // Render the active chart based on selected tab
  const ActiveChart = useMemo(() => {
    switch (activeChartTab) {
      case 'module':
        return <ModuleTreemap />;
      case 'error': 
        return <ErrorTypesChart />;
      case 'hour':
        return <HourlyDistributionChart />;
      default:
        return <ModuleTreemap />;
    }
  }, [
    activeChartTab, 
    ModuleTreemap, 
    ErrorTypesChart, 
    HourlyDistributionChart
  ]);

  // Custom AnimatedNumber component for better number transitions
  const AnimatedNumber = useCallback(({ value, description, icon: Icon, className = '' }: { 
    value: number | string, 
    description: string, 
    icon: any,
    className?: string 
  }) => {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 shadow-md border border-gray-700 animate-scaleIn ${className}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">{description}</p>
            <h4 className="text-white text-2xl font-bold">{value}</h4>
          </div>
          <div className="p-2 bg-gray-700 rounded-lg">
            <Icon className="h-5 w-5 text-blue-400" />
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Chart header with title and buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <AlertCircle className="mr-2 h-6 w-6 text-red-500" />
          Error Analytics Dashboard
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-gray-700 text-white rounded-md flex items-center hover:bg-gray-600 transition"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-white rounded-md flex items-center hover:bg-gray-600 transition appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="12h">Last 12 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnimatedNumber 
          value={totalErrors} 
          description="Total Errors" 
          icon={AlertCircle} 
          className="border-l-4 border-l-red-500" 
        />
        <AnimatedNumber 
          value={avgErrorsPerHour} 
          description="Avg Errors / Hour" 
          icon={Clock} 
          className="border-l-4 border-l-yellow-500" 
        />
        <AnimatedNumber 
          value={moduleData.length} 
          description="Affected Modules" 
          icon={Layers} 
          className="border-l-4 border-l-blue-500" 
        />
        <AnimatedNumber 
          value={mostActiveHour} 
          description="Most Active Hour" 
          icon={Calendar} 
          className="border-l-4 border-l-green-500" 
        />
      </div>

      {/* Chart navigation */}
      <div className="flex overflow-x-auto pb-2 mb-4 gap-1">
        <button 
          onClick={() => setActiveChartTab('module')} 
          className={`px-4 py-2 rounded-md flex items-center ${activeChartTab === 'module' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} transition`}
        >
          <Layers className="h-4 w-4 mr-2" />
          Modules
        </button>
        <button 
          onClick={() => setActiveChartTab('error')} 
          className={`px-4 py-2 rounded-md flex items-center ${activeChartTab === 'error' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} transition`}
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          Error Types
        </button>
        <button 
          onClick={() => setActiveChartTab('hour')} 
          className={`px-4 py-2 rounded-md flex items-center ${activeChartTab === 'hour' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} transition`}
        >
          <Clock className="h-4 w-4 mr-2" />
          Hourly
        </button>
      </div>

      {/* Active chart */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 min-h-80">
        <h3 className="text-xl font-bold text-white mb-4">
          {activeChartTab === 'module' && 'Error Distribution by Module'}
          {activeChartTab === 'error' && 'Error Types Distribution'}
          {activeChartTab === 'hour' && 'Hourly Error Distribution'}
          {hoveredSection && <span className="text-sm font-normal text-gray-400 ml-2">| {hoveredSection}</span>}
        </h3>
        {ActiveChart}
      </div>
      
      {/* System processing statistics - will be populated when API call succeeds */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <AnimatedNumber 
          value={totalProcessedLogs.toLocaleString()} 
          description="Total Processed Logs" 
          icon={HardDrive} 
          className="border-l-4 border-l-purple-500" 
        />
        <AnimatedNumber 
          value={`${systemStats?.errorRate?.toFixed(2) || '0.00'}%`} 
          description="Error Rate" 
          icon={Activity} 
          className="border-l-4 border-l-orange-500" 
        />
        <AnimatedNumber 
          value={`${systemStats?.avgProcessingTime?.toFixed(2) || '0.00'}ms`} 
          description="Avg Processing Time" 
          icon={CheckCircle2} 
          className="border-l-4 border-l-cyan-500" 
        />
      </div>
    </div>
  );
} 