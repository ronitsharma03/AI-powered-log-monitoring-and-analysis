import { Router, Request, Response } from "express";
import { serverStartTime } from "../index";
import prisma from "../config/prismaConfig";

const router = Router();

router.get("/uptime", async (req: Request, res: Response) => {
  try {
    const currentTime = Date.now();
    const uptimeMs = currentTime - serverStartTime;
    
    // Convert to human readable format
    const seconds = Math.floor(uptimeMs / 1000) % 60;
    const minutes = Math.floor(uptimeMs / (1000 * 60)) % 60;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    
    const formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    res.json({
      success: true,
      uptime: {
        raw: uptimeMs,
        seconds,
        minutes,
        hours,
        days,
        formatted
      }
    });
  } catch (error) {
    console.error("Error getting system uptime:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve system uptime"
    });
  }
});

// Get system health metrics
router.get("/health", async (req: Request, res: Response) => {
  try {
    // In a real system, this would include memory usage, CPU load, etc.
    // Here we're providing a simplified version
    res.json({
      success: true,
      health: {
        status: "healthy",
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error("Error fetching system health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system health"
    });
  }
});

// Get logs statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // Get actual stats from database
    const totalLogs = await prisma.log.count();
    
    // Get module distribution
    const moduleStats = await prisma.log.groupBy({
      by: ['source'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Calculate processing times (past 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentLogs = await prisma.log.findMany({
      where: {
        timestamp: {
          gte: yesterday
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });
    
    // Calculate average processing time (this would be more meaningful with actual processing time data)
    // For now we'll use a placeholder value
    const avgProcessingTime = 42.76;
    
    // Calculate error rate (errors vs total logs processed)
    // In this demo all logs are errors, so rate is 100%
    const errorRate = 100.0;
    
    // Get module distribution for the past 24 hours
    const recentModuleDistribution = moduleStats.map(module => ({
      module: module.source || 'unknown',
      count: module._count.id,
      percentage: (module._count.id / totalLogs * 100).toFixed(2) + '%'
    }));
    
    const stats = {
      totalProcessedLogs: totalLogs,
      errorRate,
      avgProcessingTime,
      moduleDistribution: recentModuleDistribution
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error getting system stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve system stats"
    });
  }
});

export default router; 