import express, { Request, Response } from "express"
import { saveLogs, startAnalysis } from "../controllers/logController";
const logRouter = express.Router();

logRouter.post("/saveLogs", saveLogs);
logRouter.post("/logInsights", startAnalysis);

export default logRouter;