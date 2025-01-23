import * as fs from "fs";
import * as path from "path";
import { redisClient } from "./redisClient";

interface Log {
  timestamp: string;
  log: string;
}

const logSources = [
  "/var/log/syslog",
  "/var/log/syslog.1",
  "/var/log/kern.log",
  "/var/log/auth.log",
  "/var/log/cups/error_log",
  "/var/log/dpkg.log",
  "/var/log/apport.log"
];

const errorKeywords = [
  "error",
  "Error",
  "ERROR",
  "Fail",
  "fail",
  "Failed",
  "FAILED",
  "failure",
  "FAILURE",
  "retry",
  "Retry",
  "RETRY",
];

const consolidatedLogPath = path.join(__dirname, "./logs/consolidatedLogs.log");

// Checking if the consolidated logs file exists or not
if (!fs.existsSync(consolidatedLogPath)) {
  fs.mkdirSync(path.dirname(consolidatedLogPath), { recursive: true });
  fs.writeFileSync(consolidatedLogPath, ""); // creates an empty file
}

// Monitoring only new logs for each file, starting from the end of the file
export const startLogCollection = () => {
  console.log("Log collection service started...");

  logSources.forEach((source) => {
    let fileOffset = fs.existsSync(source) ? fs.statSync(source).size : 0; // Start reading from the end of the file

    // Watching only for new logs
    fs.watch(source, { encoding: "utf-8" }, (eventType) => {
      if (eventType === "change") {
        const stat = fs.statSync(source);
        const end = stat.size;

        // Read only new data added after the previous offset
        if (fileOffset < end) {
          const logStream = fs.createReadStream(source, {
            encoding: "utf-8",
            start: fileOffset,
            end,
          });

          logStream.on("data", (chunk) => {
            // Process each chunk immediately to avoid keeping too much data in memory
            processLogs(chunk);
          });

          logStream.on("end", () => {
            fileOffset = end; // Updating the offset
          });

          logStream.on("error", (err) => {
            console.log(`Error reading the log file ${source}: `, err);
          });
        }
      }
    });
  });
};

// Monitor the consolidatedLog file for errors after new logs are added
export const startLogMonitoring = () => {
  console.log("Monitoring for error event started...");

  let fileOffset = 0;

  fs.watch(consolidatedLogPath, { encoding: "utf-8" }, (eventType) => {
    if (eventType === "change") {
      const stat = fs.statSync(consolidatedLogPath);
      const end = stat.size;

      if (fileOffset < end) {
        const logStream = fs.createReadStream(consolidatedLogPath, {
          encoding: "utf-8",
          start: fileOffset,
          end,
        });

        logStream.on("data", (chunk) => {
          // Process each chunk immediately to avoid keeping too much data in memory
          processLogs(chunk);
        });

        logStream.on("end", () => {
          fileOffset = end; // Update the offset
        });

        logStream.on("error", (err) => {
          console.error(`Error reading consolidated log file:`, err);
        });
      }
    }
  });
};

// Processing the logs
const processLogs = (chunk: any) => {
  const logs = chunk.split("\n");

  logs.forEach(async (log: any) => {
    if (log && errorKeywords.some((keyword) => log.includes(keyword))) {
      const logEntry = {
        timestamp: new Date(),
        log: log.trim(),
      };

      try {
        await redisClient.lPush("logs", JSON.stringify(logEntry));
        console.log("Successfully pushed the error log to Queue");
        console.log(logEntry);
      } catch (error) {
        console.log("Error sending logs to Redis Queue", error);
      }
    }
  });
};
