import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { redisConnect } from "./config/redisConfig";
import { logProcessor } from "./worker/logProcessor";
import { WebSocketServer } from "ws";
import router from "./controllers/fetchAnalysis";

config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());


app.use("/api/v1", router);


const httpServer = app.listen(PORT, async () => {
  console.log(`Worker is started at port ${PORT}`);
  const wss = new WebSocketServer({server: httpServer});
  try {
    await redisConnect();
    try{
      await logProcessor(wss);
    }catch(error){
      console.log("Error in WS server...")
    }

    wss.on("connection", async function (ws) {
      ws.on("error", console.error);
    
      console.log("Websocket server started....");
      
      
      ws.on("close", function () {
        console.log("Client connection closed");
      });
    });
  } catch (error) {
    console.log(`Error connecting to the redisClient in Worker`);
  }
});
