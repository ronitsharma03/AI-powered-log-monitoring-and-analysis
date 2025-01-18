import { saveLogsAndAnalysis } from "../services/dbService";
import { redisClient } from "../config/redisConfig";
import { WebSocket } from "ws";
import { main } from "../services/llmService";

interface logDataType {
  key: string;
  element: string;
}

export const logProcessor = async (ws: WebSocket) => {
  while (true) {
    try {
      const logsData = await redisClient.brPop("logs", 0);
      if (logsData) {
        console.log(logsData);
        const response: string = await main(logsData.element);
        await saveLogsAndAnalysis(logsData, response);

        if(ws.readyState === ws.OPEN){
            const logWithAnalysis = {
                log: logsData.element,
                analysis: response
            };
            ws.send(JSON.stringify(logWithAnalysis));
        }else{
            console.log("Error sending logAnalysis to primary BE")
        }
      } else {
        console.log("No logs found");
      }
    } catch (error) {
      console.log("Error popping the logs from Queue");
    }
  }
};
