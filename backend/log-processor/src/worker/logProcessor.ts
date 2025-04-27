import { saveLogsAndAnalysis } from "../services/dbService";
import { redisClient } from "../config/redisConfig";
import { main } from "../services/llmService";
import { WebSocketServer } from "ws";

interface logDataType {
  key: string;
  element: string;
}

export const logProcessor = async (wss: WebSocketServer) => {
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;
  const ERROR_BACKOFF_MS = 5000; // 5 seconds

  while (true) {
    try {
      // If we've encountered consecutive errors, add a delay
      if (consecutiveErrors > 0) {
        const backoffTime = Math.min(ERROR_BACKOFF_MS * Math.pow(2, consecutiveErrors - 1), 60000); // Max 1 minute
        console.log(`Backing off for ${backoffTime/1000} seconds after ${consecutiveErrors} consecutive errors`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }

      const logsData = await redisClient.brPop("logs", 0) as logDataType | null;
      if (logsData === null) {
        console.log("No log found");
        continue;
      }

      if (logsData) {
        console.log(`Processing log: ${logsData.element.substring(0, 100)}...`);
        try {
          // Process the log with LLM analysis
          const response: string = await main(logsData.element);
          const dbResponse = await saveLogsAndAnalysis(logsData, response);
          
          if (!dbResponse) {
            console.log(`Waiting for the db response...`);
            continue;
          }
          
          console.log("ID of log: ", dbResponse?.id);
          const data = {
            logId: dbResponse?.id,
            logMessage: logsData.element,
            timestamp: dbResponse?.timestamp
          };
          
          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
          
          // Reset consecutive errors on success
          consecutiveErrors = 0;
        } catch (error) {
          console.error("Error processing log:", error);
          consecutiveErrors++;
          
          // If we hit too many errors in a row, take a longer pause
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.log(`Hit ${MAX_CONSECUTIVE_ERRORS} consecutive errors, taking a longer break...`);
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second pause
            consecutiveErrors = 0; // Reset and try again
          }
        }
      } else {
        console.log("No logs found");
      }
    } catch (error) {
      console.error("Error popping the logs from Queue:", error);
      consecutiveErrors++;
      
      // If Redis connection is failing, give it time to recover
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log("Multiple Redis errors, pausing for recovery...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        consecutiveErrors = 0;
      }
    }
  }
};
