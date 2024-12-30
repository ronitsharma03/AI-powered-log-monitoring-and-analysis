import { Request, Response } from "express";
import { Log } from "../models/Schema";
import axios from "axios";
import { spawn } from "child_process";

interface logType {
  category: string;
  timestamp: string;
  source: string;
  message: string;
}

export async function triggerLogGeneration(
  req: Request,
  res: Response
): Promise<any> {
  console.log("Log generation endpoint hit");

  try {
    const pythonScriptPath = "/home/ronit/Desktop/ai-logCollector/python_script/log_collect.py";

    // const args = []; => for giving any argun=ments to the script

    const pythonProcess = spawn("python3", [pythonScriptPath]);

    let scriptOutput = "";
    pythonProcess.stdout.on("data", (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (error) => {
      console.error("Python Script Error: ", error.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Python script executed successfully");
        res.json({
          message: "Log generation script executed successfully",
          output: scriptOutput.trim(),
        });
      } else {
        console.error(`Python script exited with code ${code}`);
        res.status(500).json({
          message: "Python script execution failed",
        });
      }
    });
  } catch (error) {
    console.error("Error triggering the log generation script:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function saveLogs(req: Request, res: Response): Promise<any> {
  console.log("Logs collection endpoint is hit");
  const { logs, category } = req.body;

  if (!logs || logs.length === 0) {
    return res.status(400).json({
      message: "Logs not provided",
    });
  }

  const validCategories = ["info", "warn", "error"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      message: "Invalid category. Must be one of: 'info', 'warn', 'error'",
    });
  }

  const logEntries = logs.map((logItem: logType) => {
    return {
      timestamp: new Date(logItem.timestamp),
      source: logItem.source,
      message: logItem.message,
    };
  });

  try {
    const existingLog = await Log.findOne({ category });

    if (existingLog) {
      existingLog.logs.push(...logEntries);
      await existingLog.save();
      console.log(`Logs added to existing category: ${category}`);
    } else {
      const newLog = new Log({
        category,
        logs: logEntries,
      });
      await newLog.save();
      console.log(`New log document created for category: ${category}`);
    }

    return res.json({
      message: "Logs saved successfully",
    });
  } catch (error) {
    console.log("Error saving logs to the DB", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function startAnalysis(req: Request, res: Response): Promise<any> {
  const { category, timeframe_minutes, limit } = req.body;

  if (!category) {
    return res.status(400).json({
      message: "Category not provided",
    });
  }

  const validCategories = ["info", "warn", "error"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      message: "Invalid category. Must be one of: 'info', 'warn', 'error'",
    });
  }

  if (!timeframe_minutes || !limit) {
    return res.status(400).json({
      message: "Timeframe or limit is needed",
    });
  }

  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeframe_minutes * 60000); //convert minutes to milliseconds

    const logs = await Log.aggregate([
      { $unwind: "$logs" },
      {
        $match: {
          category,
          "logs.timestamp": { $gte: startTime, $lte: endTime },
        },
      },
      { $sort: { "logs.timestamp": -1 } },
      { $limit: limit },
      {
        $project: {
          "logs.timestamp": 1,
          "logs.source": 1,
          "logs.message": 1,
          "logs.category": 1,
        },
      },
    ]);

    if (logs.length === 0) {
      return res.json({
        message: "No logs found for specified inputs",
      });
    }

    // Sending logs for ananlysis
    const analysis = await analyzeLogsWithLLM(
      logs.map((log) => log.logs),
      "Analyze the logs and provide insights with summary"
    );

    return res.json({
      message: "Logs fetched successfully",
      data: logs,
      analysis: analysis,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function analyzeLogsWithLLM(logs: logType[], defaultPrompt: string) {
  const llmPrompt = createLLMPrompt(logs, defaultPrompt);

  try {
    const response = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3.2",
      messages: [
        {
          role: "user",
          content: llmPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    });

    return response.data;
  } catch (error) {
    console.log("Error communicating with Ollama LLM: ", error);
    return null;
  }
}

function createLLMPrompt(logs: logType[], defaultPrompt: string) {
  let prompt = defaultPrompt
    ? defaultPrompt + "\n\n"
    : "Analyze the following logs and provide insights and possible resolution: \n\n";

  logs.forEach((log) => {
    prompt += `Timestamp: ${log.timestamp}\n`;
    prompt += `Source: ${log.source}\n`;
    prompt += `Message: ${log.message}\n`;
    prompt += `Category: ${log.category}\n\n`;
  });

  return prompt;
}
