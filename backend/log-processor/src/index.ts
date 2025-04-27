import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { redisConnect } from "./config/redisConfig";
import { logProcessor } from "./worker/logProcessor";
import { WebSocketServer } from "ws";
import fetchAnalysisRouter from "./controllers/fetchAnalysis";
import emailSettingsRouter from "./controllers/emailSettingsController";
import systemInfoRouter from "./controllers/systemInfo";
import logsRouter from "./controllers/logsController";
import analysisRoutes from "./routes/analysisRoutes";
import { startEmailScheduler } from "./services/emailScheduler";

// Export server start time for uptime tracking
export const serverStartTime = Date.now();

config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/v1", fetchAnalysisRouter);
app.use("/api/v1/analysis", analysisRoutes);
app.use("/api/v1/email", emailSettingsRouter);
app.use("/api/v1/system", systemInfoRouter);
app.use("/api/v1/logs", logsRouter);

const httpServer = app.listen(PORT, async () => {
  console.log(`Worker is started at port ${PORT}`);
  console.log(`Server start time: ${new Date(serverStartTime).toISOString()}`);
  
  const wss = new WebSocketServer({server: httpServer});
  try {
    await redisConnect();
    try{
      await logProcessor(wss);
    }catch(error){
      console.log("Error in WS server...", error)
    }

    wss.on("connection", async function (ws) {
      ws.on("error", console.error);
    
      console.log("Websocket server started....");
      
      
      ws.on("close", function () {
        console.log("Client connection closed");
      });
    });

    // Start the email scheduler with a 5-minute check interval
    // This will automatically send reports at the configured times
    console.log("Starting email scheduler...");
    const schedulerStarted = startEmailScheduler(5);
    if (schedulerStarted) {
      console.log("Email scheduler started successfully");
    } else {
      console.warn("Failed to start email scheduler");
    }
  } catch (error) {
    console.log(`Error connecting to the redisClient in Worker`, error);
  }
});
