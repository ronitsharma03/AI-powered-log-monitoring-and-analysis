import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { redisConnect } from "./services/redisClient";
import { startLogCollection, startLogMonitoring } from "./services/logMonitor";
import webSocket, { WebSocketServer} from 'ws';

config();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT;

// app.use("/api", logRouter);


const expressServer= app.listen(PORT, async () => {
  console.log(`Primary backend is listening on ${PORT}`);
  try {
    await redisConnect();
    
    try {
      startLogCollection();
      startLogMonitoring();
    } catch (error) {
      console.log("Error starting Logs monitor service", error);
      process.exit(1);
    }
  } catch (error) {
    console.log("Error starting the redis client");
    process.exit(1);
  }
});

const wss = new WebSocketServer({ server: expressServer});

wss.on('connection', function(ws){
  ws.on('error', console.error);

  console.log("Worker connected to primary backend");

  ws.on('message', function(message){
    const messageString = message.toString();
    console.log(messageString)
  });

  ws.on('close', function(){
    console.log("Connection closed to the Worker");
  })
})