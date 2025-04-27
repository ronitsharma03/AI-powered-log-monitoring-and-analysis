import { Router } from "express";
import { sendChatMessage } from "../controllers/fetchAnalysis";

const router = Router();

router.post("/:id/chat", sendChatMessage);

export default router; 