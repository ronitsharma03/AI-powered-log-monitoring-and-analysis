import prisma from "../config/prismaConfig";
import { extractModule } from "../utils/logUtils";

/**
 * Generates an HTML error report with samples from each module
 * @param samplesPerModule Number of log samples to include per module
 * @param reportFrequency Frequency of the report (daily, weekly, monthly)
 * @returns HTML string containing the formatted report
 */
export async function generateErrorReport(samplesPerModule: number = 3, reportFrequency: string = 'daily'): Promise<string> {
  console.log(`Starting report generation with ${samplesPerModule} samples per module, frequency: ${reportFrequency}`);
  
  // Determine the date range based on frequency
  const now = new Date();
  let startDate = new Date();
  
  switch (reportFrequency) {
    case 'hourly':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case 'daily':
      startDate.setHours(0, 0, 0, 0); // Start of the current day
      break;
    case 'weekly':
      // Set to beginning of current week (Sunday)
      const day = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      startDate.setDate(startDate.getDate() - day); // Go back to Sunday
      startDate.setHours(0, 0, 0, 0); // Start of the day
      break;
    case 'monthly':
      startDate.setDate(1); // First day of current month
      startDate.setHours(0, 0, 0, 0); // Start of the day
      break;
    default:
      startDate.setHours(0, 0, 0, 0); // Default to start of current day
  }
  
  console.log(`Filtering logs from ${startDate.toISOString()} to ${now.toISOString()}`);
  
  // Get counts of logs by module for the specified period
  const modules = await prisma.log.groupBy({
    by: ['source'],
    _count: {
      id: true
    },
    where: {
      timestamp: {
        gte: startDate,
        lte: now
      }
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    }
  });
  
  console.log(`Found ${modules.length} modules with logs in the selected time period`);
  
  // If no logs are found, return a simple report
  if (modules.length === 0) {
    return generateEmptyReport(reportFrequency, startDate, now);
  }

  // Get recent logs for each module within the date range
  const moduleData = await Promise.all(
    modules.map(async (module) => {
      const logs = await prisma.log.findMany({
        where: {
          source: module.source,
          timestamp: {
            gte: startDate,
            lte: now
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: samplesPerModule
      });
      
      console.log(`Retrieved ${logs.length} logs for module: ${module.source}`);
      
      return {
        module: module.source || 'unknown',
        count: module._count.id,
        logs
      };
    })
  );

  // Generate the HTML report
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format date range for report heading
  const dateRangeStr = getDateRangeString(reportFrequency, startDate, now);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #2563eb;
        }
        .header {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          border-left: 5px solid #3b82f6;
        }
        .module {
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f9fafb;
          border-radius: 5px;
        }
        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .module-count {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 14px;
        }
        .log-entry {
          background-color: #fff;
          border-left: 3px solid #ef4444;
          padding: 10px;
          margin-bottom: 10px;
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 13px;
        }
        .timestamp {
          color: #6b7280;
          font-size: 12px;
        }
        .summary {
          margin-top: 30px;
          padding: 15px;
          background-color: #ecfdf5;
          border-radius: 5px;
        }
        .date-range {
          font-size: 14px;
          color: #4b5563;
          margin-top: 5px;
        }
        .download-note {
          margin-top: 20px;
          padding: 10px;
          background-color: #fffbeb;
          border-left: 3px solid #f59e0b;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>System Error Log Report</h1>
        <p>Generated on ${reportDate}</p>
        <p class="date-range">${dateRangeStr}</p>
      </div>
      
      <p>This report contains the most recent system error logs grouped by module. Below is a summary of errors detected in each module.</p>
      
      <h2>Error Logs by Module</h2>
  `;

  // Add module sections
  for (const moduleInfo of moduleData) {
    html += `
      <div class="module">
        <div class="module-header">
          <h3>${moduleInfo.module}</h3>
          <span class="module-count">${moduleInfo.count} errors</span>
        </div>
        
        <p>Recent error logs (${Math.min(moduleInfo.logs.length, samplesPerModule)} of ${moduleInfo.count}):</p>
    `;

    // Add log entries for this module
    for (const log of moduleInfo.logs) {
      const timestamp = log.timestamp 
        ? new Date(log.timestamp).toLocaleString() 
        : 'Unknown timestamp';
      html += `
        <div class="log-entry">
          <div class="timestamp">${timestamp}</div>
          ${log.logMessage}
        </div>
      `;
    }

    html += `</div>`;
  }

  // Add summary
  const totalErrors = modules.reduce((sum, module) => sum + module._count.id, 0);
  html += `
      <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Errors:</strong> ${totalErrors}</p>
        <p><strong>Modules Affected:</strong> ${modules.length}</p>
        <p><strong>Report Period:</strong> ${dateRangeStr}</p>
        <p>For more detailed analysis, please visit the System Log Analyzer dashboard.</p>
      </div>
      
      <div class="download-note">
        <p><strong>Note:</strong> You can download this report as an HTML file from the Settings panel in the System Log Analyzer dashboard.</p>
      </div>
    </body>
    </html>
  `;

  console.log("Report generation completed successfully");
  return html;
}

/**
 * Generate a report when no logs are found
 * @param reportFrequency Frequency of the report
 * @param startDate Start date of the period
 * @param endDate End date of the period
 * @returns HTML string containing a report for empty logs
 */
function generateEmptyReport(reportFrequency: string = 'daily', startDate: Date = new Date(), endDate: Date = new Date()): string {
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const dateRangeStr = getDateRangeString(reportFrequency, startDate, endDate);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #2563eb;
        }
        .header {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          border-left: 5px solid #3b82f6;
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          margin: 30px 0;
        }
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 20px;
          color: #9ca3af;
        }
        .summary {
          margin-top: 30px;
          padding: 15px;
          background-color: #ecfdf5;
          border-radius: 5px;
        }
        .date-range {
          font-size: 14px;
          color: #4b5563;
          margin-top: 5px;
        }
        .download-note {
          margin-top: 20px;
          padding: 10px;
          background-color: #fffbeb;
          border-left: 3px solid #f59e0b;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>System Error Log Report</h1>
        <p>Generated on ${reportDate}</p>
        <p class="date-range">${dateRangeStr}</p>
      </div>
      
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h2>No Error Logs Found</h2>
        <p>There are no error logs in the database for the selected period.</p>
        <p>This could mean one of the following:</p>
        <ul style="text-align: left; display: inline-block;">
          <li>The system is running without errors (Great!)</li>
          <li>Log collection has just started and no errors have been detected yet</li>
          <li>There might be an issue with the log collection process</li>
        </ul>
      </div>
      
      <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Errors:</strong> 0</p>
        <p><strong>Modules Affected:</strong> 0</p>
        <p><strong>Report Period:</strong> ${dateRangeStr}</p>
        <p>For more detailed information, please visit the System Log Analyzer dashboard.</p>
      </div>
      
      <div class="download-note">
        <p><strong>Note:</strong> You can download this report as an HTML file from the Settings panel in the System Log Analyzer dashboard.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format a nice date range string based on report frequency
 */
function getDateRangeString(reportFrequency: string, startDate: Date, endDate: Date): string {
  const formatOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  switch (reportFrequency) {
    case 'hourly':
      return `Report covers the past hour (${startDate.toLocaleString(undefined, formatOptions)} - ${endDate.toLocaleString(undefined, formatOptions)})`;
    case 'daily':
      return `Report covers today (${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
    case 'weekly':
      return `Report covers this week (${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
    case 'monthly':
      return `Report covers this month (${startDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})`;
    default:
      return `Report covers period from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  }
} 