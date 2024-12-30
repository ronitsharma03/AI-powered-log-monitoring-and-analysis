import express, { Request, Response } from "express"
import { saveLogs, startAnalysis, triggerLogGeneration } from "../controllers/logController";
const logRouter = express.Router();

logRouter.post("/saveLogs", saveLogs);
logRouter.post("/log-insights", startAnalysis);
logRouter.post("/generate-logs", triggerLogGeneration);

export default logRouter;