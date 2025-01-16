import express, { Router } from "express";
import cors from "cors";
import { config } from "dotenv";
import logRouter from "./routes/logCollector";
import { redisConnect } from "./services/redisClient";

config();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT;

app.use("/api", logRouter);

app.listen(PORT, async () => {
  console.log(`Primary backend is listening on ${PORT}`);
  try {
    await redisConnect();
  } catch (error) {
    console.log("Error starting the redis client");
  }
});
