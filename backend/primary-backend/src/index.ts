import express, { Router } from "express";
import cors from "cors";
import { config } from "dotenv";
import { redisConnect } from "./services/redisClient";
import { startLogCollection, startLogMonitoring } from "./services/logMonitor";

config();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT;

// app.use("/api", logRouter);

app.listen(PORT, async () => {
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
