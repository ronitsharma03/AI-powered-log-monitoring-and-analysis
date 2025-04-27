import { Router, Request, Response } from "express";
import prisma from "../config/prismaConfig";

const router = Router();

// Get the total count of logs in the database
router.get("/count", async (req: Request, res: Response) => {
  try {
    const count = await prisma.log.count();
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error getting log count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get log count"
    });
  }
});

// Get all logs with optional pagination and filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, module } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    const skip = (pageNum - 1) * limitNum;
    
    const where = module 
      ? { source: { contains: String(module) } }
      : {};
    
    const logs = await prisma.log.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { timestamp: 'desc' }
    });
    
    const total = await prisma.log.count({ where });
    
    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch logs"
    });
  }
});

export default router; 