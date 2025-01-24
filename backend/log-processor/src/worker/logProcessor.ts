import { saveLogsAndAnalysis } from "../services/dbService";
import { redisClient } from "../config/redisConfig";
import { main } from "../services/llmService";
import { WebSocketServer } from "ws";

interface logDataType {
  key: string;
  element: string;
}

export const logProcessor = async (wss: WebSocketServer) => {
  while (true) {
    try {
      const logsData = await redisClient.brPop("logs", 0) as logDataType | null;
      if (logsData === null) {
        console.log("No log found");
        continue;
      }
      if (logsData) {
        console.log(logsData);
        const response: string = await main(logsData.element);
        const dbResponse = await saveLogsAndAnalysis(logsData, response);
        if(!dbResponse){
          console.log(`Waiting for the db response...`);
        }
        console.log("ID of log: ", dbResponse?.id);
        const data = {
          logId: dbResponse?.id,
          logMessage: logsData.element,
          timestamp: dbResponse?.timestamp
        }
        
        wss.clients.forEach((client) => {
          if(client.readyState === client.OPEN){
            client.send(JSON.stringify(data));
          }
        })

      } else {
        console.log("No logs found");
      }
    } catch (error) {
      console.log("Error popping the logs from Queue", error);
    }
  }
};
