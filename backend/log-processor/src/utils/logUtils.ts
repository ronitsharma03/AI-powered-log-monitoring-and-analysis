/**
 * Extracts the module name from a log message
 * @param logMessage The log message to analyze
 * @returns The extracted module name
 */
export function extractModule(logMessage: string): string {
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
} 