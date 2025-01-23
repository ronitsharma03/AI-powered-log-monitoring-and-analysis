import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
import { schema } from "../utils/llmOutputSchema";

export const main = async (logMessage: string) => {
  const prompt: string = `Analyze the following system log:  
Log Message: ${logMessage}  

1. Break down the log message into its key components.  
2. Identify the possible cause of the issue.  
3. Suggest actionable steps, if applicable, to resolve the issue. `;

  const stream = await getGroqChatStream(logMessage);
  return JSON.stringify(stream, null, 2);
};

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
