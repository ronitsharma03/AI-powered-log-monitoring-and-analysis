import { Router, Request, Response } from "express";
import prisma from "../config/prismaConfig";
import { handleChatConversation } from "../services/llmService";

const router = Router();

router.post("/fetchAnalysis/:id", async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try{
        const response = await prisma.log.findFirst({
            where: {
                id: Number(id)
            }
        });

        return res.json({
            message: "Analysis fetched successfully",
            analysis: response?.analysis
        });

    }catch(error){
        console.log(`Error fetching the log analysis: ${error}`);
    }
});

router.post("/chat/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { query, conversation = [] } = req.body;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: "Query is required"
        });
    }

    try {
        // Get the log and its analysis
        const log = await prisma.log.findFirst({
            where: { id: Number(id) }
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: "Log not found"
            });
        }

        // Make sure conversation has valid format
        const validatedConversation = conversation.map((msg: any) => ({
            role: typeof msg.role === 'string' && ['user', 'assistant', 'system'].includes(msg.role) 
                ? msg.role 
                : 'user',
            content: String(msg.content || '')
        }));

        // Process the chat request
        const chatResponse = await handleChatConversation(
            log.logMessage,
            log.analysis,
            query,
            validatedConversation
        );

        return res.json(chatResponse);
    } catch (error: any) {
        console.error(`Error in chat endpoint:`, error);
        return res.status(500).json({
            success: false,
            message: "Failed to process chat request",
            error: error.message
        });
    }
});

export default router;