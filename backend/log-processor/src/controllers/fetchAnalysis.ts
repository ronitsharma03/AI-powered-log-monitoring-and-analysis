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

        console.log(`Processing chat request for log ID ${id} with query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

        // Process the chat request
        const chatResponse = await handleChatConversation(
            log.logMessage,
            log.analysis,
            query,
            validatedConversation
        );

        if (!chatResponse || typeof chatResponse !== 'object') {
            throw new Error("Invalid response format from LLM service");
        }

        console.log(`Chat response successful: ${chatResponse.success}`);
        return res.json(chatResponse);
    } catch (error: any) {
        console.error(`Error in chat endpoint:`, error);
        return res.status(500).json({
            success: false,
            message: "Failed to process chat request",
            error: error.message || "Unknown error occurred",
            conversation: [
                ...conversation,
                { role: "user", content: query },
                { role: "assistant", content: "I'm sorry, I encountered an error processing your request. Please try again later." }
            ]
        });
    }
});



export const sendChatMessage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { query, conversation } = req.body;

    // Input validation
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
            error: 'Invalid query format. Query must be a non-empty string.',
            conversation: conversation || [] 
        });
    }

    if (!conversation || !Array.isArray(conversation)) {
        return res.status(400).json({ 
            error: 'Invalid conversation format. Conversation must be an array.',
            conversation: [] 
        });
    }

    console.log(`Processing chat request for analysis ID: ${id}, Query: ${query}`);

    try {
        // Get the log with its analysis
        const log = await prisma.log.findFirst({
            where: { id: Number(id) }
        });

        if (!log) {
            return res.status(404).json({
                success: false, 
                message: 'Log not found',
                conversation
            });
        }

        // Process the chat conversation with the LLM
        const response = await handleChatConversation(
            log.logMessage,
            log.analysis,
            query,
            conversation
        );
        
        return res.json(response);
    } catch (error: any) {
        console.error("Error processing chat message:", error);
        
        // Create a fallback response that maintains the conversation
        const fallbackResponse = {
            error: error.message || "Failed to process your message. Please try again later.",
            conversation: [
                ...conversation,
                { role: "user", content: query },
                { 
                    role: "assistant", 
                    content: "I'm sorry, but I encountered an error while processing your request. Please check the application logs or try again later." 
                }
            ]
        };
        
        return res.status(500).json(fallbackResponse);
    }
};

export default router;