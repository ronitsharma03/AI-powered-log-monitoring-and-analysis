import { Router, Request, Response } from "express";
import prisma from "../config/prismaConfig";

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


export default router;