import express from "express";
import cors from "cors";
import { config } from "dotenv";
import WebSocket from "ws";
import { redisConnect } from "./config/redisConfig";
import { logProcessor } from "./worker/logProcessor";

config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", async function () {
  console.log("Connected to the primary backend");
  await logProcessor(ws);
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});

app.listen(PORT, async () => {
  console.log(`Worker is started at port ${PORT}`);
  try {
    await redisConnect();
    await logProcessor(ws);
  } catch (error) {
    console.log(`Error connecting to the redisClient in Worker`);
  }
});
