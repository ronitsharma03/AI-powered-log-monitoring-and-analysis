import express, { Request, Response } from "express"
import { saveLogs } from "../controllers/logController";
const logRouter = express.Router();

logRouter.post("/saveLogs", saveLogs);

export default logRouter;