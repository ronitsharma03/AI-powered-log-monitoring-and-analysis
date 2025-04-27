import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
import { schema } from "../utils/llmOutputSchema";
import { extractModule } from "../utils/logUtils";

// Maximum number of retries for LLM API calls
const MAX_RETRIES = 3;

// Initial backoff delay in milliseconds
const INITIAL_BACKOFF_MS = 1000;

export const main = async (logMessage: string) => {
  try {
    const stream = await getGroqChatStreamWithRetry(logMessage);
    return JSON.stringify(stream, null, 2);
  } catch (error) {
    console.warn("Failed to get LLM analysis after retries, using fallback analysis method");
    const fallbackAnalysis = generateFallbackAnalysis(logMessage);
    return JSON.stringify(fallbackAnalysis, null, 2);
  }
};

/**
 * Retry wrapper for Groq API calls with exponential backoff
 */
async function getGroqChatStreamWithRetry(logMessage: string, retryCount = 0): Promise<any> {
  try {
    return await getGroqChatStream(logMessage);
  } catch (error: any) {
    // If it's a rate limit error and we haven't exceeded max retries
    if (error.status === 429 && retryCount < MAX_RETRIES) {
      const nextRetry = retryCount + 1;
      
      // Parse the retry-after header if available, or use exponential backoff
      let delayMs = error.headers?.["retry-after"] 
        ? parseInt(error.headers["retry-after"]) * 1000 
        : INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      
      console.log(`Rate limit exceeded, retrying in ${delayMs/1000} seconds (retry ${nextRetry}/${MAX_RETRIES})`);
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Retry the request
      return getGroqChatStreamWithRetry(logMessage, nextRetry);
    }
    
    // If it's not a rate limit error or we've exceeded retries, throw the error
    throw error;
  }
}

export async function getGroqChatStream(logMessage: string) {
  const jsonSchema = JSON.stringify(schema, null, 4);
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a system log analyzer. Output all responses in JSON using the schema: ${jsonSchema}`,
      },
      {
        role: "user",
        content: `Analyze the following system log:  
Log Message: ${logMessage}  

1. Break down the log message into its key components.  
2. Identify the possible cause of the issue.  
3. Suggest actionable steps, if applicable, to resolve the issue.`,
      },
    ],
    model: "llama3-70b-8192",
    temperature: 0,
    stream: false,
    response_format: { type: "json_object" },
  });

  return JSON.parse(chatCompletion?.choices[0]?.message?.content!);
}

/**
 * Generate a fallback analysis when LLM API is not available
 * This provides basic analysis without requiring the LLM
 */
function generateFallbackAnalysis(logMessage: string) {
  // Extract timestamp from the log (if present)
  const timestampMatch = logMessage.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
  const timestamp = timestampMatch ? timestampMatch[0] : new Date().toISOString();
  
  // Extract timezone (if present)
  const timezoneMatch = logMessage.match(/[+-]\d{2}:\d{2}/);
  const timezone = timezoneMatch ? timezoneMatch[0] : "UTC";
  
  // Extract module using our utility function
  const module = extractModule(logMessage);
  
  // Look for PCI device information
  const pciMatch = logMessage.match(/[0-9a-f]{4}:[0-9a-f]{4}/i);
  const pciDevice = pciMatch ? pciMatch[0] : "N/A";
  
  // Identify the error message (basic heuristic)
  let errorMessage = "";
  if (logMessage.includes("error:")) {
    errorMessage = logMessage.split("error:")[1].trim();
  } else if (logMessage.includes("ERROR")) {
    errorMessage = logMessage.split("ERROR")[1].trim();
  } else if (logMessage.includes("failed")) {
    errorMessage = logMessage.split("failed")[1].trim();
  } else {
    errorMessage = logMessage;
  }
  
  // Generate a basic analysis
  return {
    logAnalysis: {
      log_message: logMessage,
      breakdown: {
        timestamp,
        timezone,
        module,
        pci_device: pciDevice,
        error_message: errorMessage
      },
      possible_cause: "Unable to perform detailed analysis due to LLM service unavailability. Please check system logs for more information.",
      actionable_steps: [
        "Review the full system logs for context",
        "Check if the service or module is running properly",
        "Verify system resources are adequate",
        "Consult documentation for the specific error message"
      ]
    }
  };
}

/**
 * Handle conversation about a specific error log and its analysis
 */
export async function handleChatConversation(logMessage: string, analysis: any, userQuery: string, conversationHistory: Array<{role: string, content: string}> = []) {
  try {
    // Create default system prompt that includes the log and analysis
    const systemContent = `You are a helpful assistant specializing in system error analysis. 
You're discussing this system log: "${logMessage}"
Your analysis: ${JSON.stringify(analysis, null, 2)}
Help the user understand the error and implement the actionable steps.`;

    // Build the conversation history with proper typing
    const messages = [
      { role: "system" as const, content: systemContent },
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content
      })),
      { role: "user" as const, content: userQuery }
    ];

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama3-70b-8192",
      temperature: 0.5,
      stream: false,
      max_tokens: 1024
    });

    return {
      success: true,
      message: chatCompletion?.choices[0]?.message?.content,
      conversation: [
        ...conversationHistory,
        { role: "user", content: userQuery },
        { role: "assistant", content: chatCompletion?.choices[0]?.message?.content || "" }
      ]
    };
  } catch (error: any) {
    console.error("Error in chat conversation:", error);
    return {
      success: false,
      message: "Failed to process your question. Please try again.",
      error: error.message,
      conversation: [
        ...conversationHistory,
        { role: "user", content: userQuery },
        { role: "assistant", content: "Sorry, I encountered an error processing your question." }
      ]
    };
  }
}
