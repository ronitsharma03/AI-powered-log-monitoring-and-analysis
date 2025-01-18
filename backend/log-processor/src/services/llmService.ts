// import Groq from "groq-sdk";

// const groq = new Groq();

export const main = async (logMessage: string) => {
  const prompt: string = `Analyze the following system log:  
Log Message: ${logMessage}  

1. Break down the log message into its key components.  
2. Identify the possible cause of the issue.  
3. Suggest actionable steps, if applicable, to resolve the issue. `;

  const stream = await getGroqChatStream(logMessage);
  //   const response = stream.choices[0]?.message?.content;
  //   return response as string;
  return JSON.stringify(stream, null, 2);
};

// const getGroqChatStream = async (log: string) => {
//   return groq.chat.completions.create({
//     messages: [
//       {
//         role: "system",
//         content:
//           "You are an expert system logs analyzer. Respond precisely to the prompt without unnecessary introductions or affirmations.",
//       },
//       {
//         role: "user",
//         content: log,
//       },
//     ],
//     model: "llama3-70b-8192",
//     temperature: 0.5,
//     max_completion_tokens: 2048,
//     stream: false,
//   });
// };

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const schema = {
  $defs: {
    LogAnalysis: {
      properties: {
        log_message: { type: "string", title: "Log Message" },
        breakdown: {
          type: "object",
          properties: {
            timestamp: { type: "string", title: "Timestamp" },
            timezone: { type: "string", title: "Timezone" },
            module: { type: "string", title: "Module" },
            pci_device: { type: "string", title: "PCI Device" },
            error_message: { type: "string", title: "Error Message" },
          },
          required: [
            "timestamp",
            "timezone",
            "module",
            "pci_device",
            "error_message",
          ],
          title: "Breakdown",
        },
        possible_cause: { type: "string", title: "Possible Cause" },
        actionable_steps: {
          type: "array",
          items: { type: "string" },
          title: "Actionable Steps",
        },
      },
      required: [
        "log_message",
        "breakdown",
        "possible_cause",
        "actionable_steps",
      ],
      title: "Log Analysis",
      type: "object",
    },
  },
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
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    stream: false,
    response_format: { type: "json_object" },
  });

  return JSON.parse(chatCompletion?.choices[0]?.message?.content!);
}
