import { LogType } from "@/App";

// Extract module from log message more reliably
export const extractModule = (logMessage: string): string => {
  // Standardize module names to the specified list
  const standardModules = ['kernel', 'network', 'gnome-shell', 'dbus-daemon', 'bluetooth', 'wifi'];

  // Look for structured data in JSON format
  const jsonMatch = logMessage.match(/"module":\s*"([^"]+)"/i);
  if (jsonMatch && jsonMatch[1]) {
    const extractedModule = jsonMatch[1].toLowerCase();
    
    // Find the closest matching standard module
    for (const stdModule of standardModules) {
      if (extractedModule.includes(stdModule)) {
        return stdModule;
      }
    }
  }

  // Alternative format: ModuleName: message
  const alternativeMatch = logMessage.match(/^([A-Za-z0-9_-]+):/);
  if (alternativeMatch && alternativeMatch[1]) {
    const extractedModule = alternativeMatch[1].toLowerCase();
    
    // Find the closest matching standard module
    for (const stdModule of standardModules) {
      if (extractedModule.includes(stdModule)) {
        return stdModule;
      }
    }
  }

  // Look for brackets: [ModuleName] message
  const bracketMatch = logMessage.match(/\[([^\]]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    const extractedModule = bracketMatch[1].toLowerCase();
    
    // Find the closest matching standard module
    for (const stdModule of standardModules) {
      if (extractedModule.includes(stdModule)) {
        return stdModule;
      }
    }
  }

  // Look for keywords in the log to identify the module
  const logLower = logMessage.toLowerCase();
  
  if (logLower.includes('kernel') || logLower.includes('syslogd')) {
    return 'kernel';
  }
  
  if (logLower.includes('network') || logLower.includes('eth') || logLower.includes('tcp') || 
      logLower.includes('ip ') || logLower.includes('dhcp') || logLower.includes('interface')) {
    return 'network';
  }
  
  if (logLower.includes('gnome') || logLower.includes('gnome-shell') || logLower.includes('desktop')) {
    return 'gnome-shell';
  }
  
  if (logLower.includes('dbus') || logLower.includes('dbus-daemon') || logLower.includes('message bus')) {
    return 'dbus-daemon';
  }
  
  if (logLower.includes('bluetooth') || logLower.includes('bt ') || logLower.includes('btusb')) {
    return 'bluetooth';
  }
  
  if (logLower.includes('wifi') || logLower.includes('wlan') || logLower.includes('wireless') || logLower.includes('wpa')) {
    return 'wifi';
  }

  // If we can't confidently determine the module, assign to a standard module based on content
  if (logLower.includes('usb') || logLower.includes('pci') || logLower.includes('memory') || 
      logLower.includes('cpu') || logLower.includes('device')) {
    return 'kernel';
  }
  
  // Default fallback to one of the standard modules
  // Distribute undetected modules evenly across standard modules to prevent overloading "other"
  const hash = logLower.split('').reduce((a, b) => {
    return a + b.charCodeAt(0);
  }, 0);
  
  return standardModules[hash % standardModules.length];
};

// Extract error type from log message
export const extractErrorType = (logMessage: string): string => {
  const lowerCaseMsg = logMessage.toLowerCase();
  
  if (lowerCaseMsg.includes("timeout") || lowerCaseMsg.includes("timed out")) return "Timeout";
  if (lowerCaseMsg.includes("permission denied") || lowerCaseMsg.includes("access denied")) return "Permission";
  if (lowerCaseMsg.includes("failed") || lowerCaseMsg.includes("failure")) return "Failure";
  if (lowerCaseMsg.includes("warning")) return "Warning";
  if (lowerCaseMsg.includes("connection") || lowerCaseMsg.includes("connect")) return "Connection";
  if (lowerCaseMsg.includes("memory") || lowerCaseMsg.includes("allocation")) return "Memory";
  if (lowerCaseMsg.includes("disk") || lowerCaseMsg.includes("storage") || lowerCaseMsg.includes("i/o")) return "Disk I/O";
  if (lowerCaseMsg.includes("driver") || lowerCaseMsg.includes("firmware")) return "Driver";
  if (lowerCaseMsg.includes("authentication") || lowerCaseMsg.includes("auth")) return "Authentication";
  if (lowerCaseMsg.includes("network") || lowerCaseMsg.includes("interface")) return "Network";
  
  return "Other";
};

// Filter logs by time range
export const filterLogsByTimeRange = (logs: LogType[], timeRange: string): LogType[] => {
  const now = new Date().getTime();
  
  return logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    
    switch (timeRange) {
      case '1h':
        return now - logTime <= 60 * 60 * 1000;
      case '6h':
        return now - logTime <= 6 * 60 * 60 * 1000;
      case '12h':
        return now - logTime <= 12 * 60 * 60 * 1000;
      case '24h':
        return now - logTime <= 24 * 60 * 60 * 1000;
      case 'all':
        return true;
      default:
        return now - logTime <= 24 * 60 * 60 * 1000;
    }
  });
};

// Process logs to get error severity distribution
export const getSeverityDistribution = (logs: LogType[]) => {
  const severityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  
  logs.forEach(log => {
    const lowerCaseMsg = log.logMessage.toLowerCase();
    
    if (lowerCaseMsg.includes("critical") || 
        lowerCaseMsg.includes("emergency") || 
        lowerCaseMsg.includes("alert") ||
        lowerCaseMsg.includes("fatal")) {
      severityCounts.Critical++;
    } else if (lowerCaseMsg.includes("error") || 
               lowerCaseMsg.includes("fail") || 
               lowerCaseMsg.includes("failed")) {
      severityCounts.High++;
    } else if (lowerCaseMsg.includes("warning") || 
               lowerCaseMsg.includes("warn")) {
      severityCounts.Medium++;
    } else {
      severityCounts.Low++;
    }
  });
  
  return Object.entries(severityCounts).map(([name, value]) => ({ name, value }));
};

// Get color for severity level
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'Critical': return '#ef4444'; // red
    case 'High': return '#f97316'; // orange 
    case 'Medium': return '#f59e0b'; // amber
    case 'Low': return '#3b82f6'; // blue
    default: return '#6b7280'; // gray
  }
};

// Get consistent color for module visualization
export const getModuleColor = (moduleName: string): string => {
  // Define specific colors for each standard module
  const moduleColors: Record<string, string> = {
    'kernel': '#3b82f6',     // blue
    'network': '#10b981',    // green
    'gnome-shell': '#f59e0b', // amber
    'dbus-daemon': '#8b5cf6', // purple
    'bluetooth': '#ec4899',  // pink
    'wifi': '#06b6d4',       // cyan
  };

  // Convert to lowercase for case-insensitive matching
  const normalizedName = moduleName.toLowerCase();
  
  // Return the color if it exists in our mapping
  if (moduleColors[normalizedName]) {
    return moduleColors[normalizedName];
  }
  
  // For any unmatched module names, generate a consistent color
  let hash = 0;
  for (let i = 0; i < moduleName.length; i++) {
    hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a hex color
  const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return `#${'00000'.substring(0, 6 - color.length) + color}`;
}; 