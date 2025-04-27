import axios from "axios";

export interface AnalysisType {
  message: string;
  analysis: {
    breakdown: {
      timestamp: string;
      timezone: string;
      module: string;
      pci_device: string;
      error_message: string;
    };
    possible_cause: string;
    actionable_steps: string[];
  };
}

export interface EmailSettings {
  email: string;
  reportFrequency: string;
  reportTime: string;
  samplesPerModule: number;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
  conversation: ChatMessage[];
}

export async function fetchLogAnalysis(
  id: string
): Promise<AnalysisType | null> {
  try {
    const logAnalysis = await axios.post(
      `http://localhost:3001/api/v1/fetchAnalysis/${id}`,
      {}
    );
    if (!logAnalysis.data) {
      return null;
    }
    return logAnalysis.data as AnalysisType;
  } catch (error) {
    console.log(`Error fetching the log's analysis: ${error}`);
    return null;
  }
}

export async function saveEmailSettings(
  settings: EmailSettings
): Promise<boolean> {
  try {
    const response = await axios.post(
      `http://localhost:3001/api/v1/email/settings`,
      settings
    );
    return response.data.success;
  } catch (error) {
    console.log(`Error saving email settings: ${error}`);
    throw error;
  }
}

export async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const response = await axios.get(
      `http://localhost:3001/api/v1/email/settings`
    );
    if (!response.data.success) {
      return null;
    }
    return response.data.settings as EmailSettings;
  } catch (error) {
    console.log(`Error fetching email settings: ${error}`);
    return null;
  }
}

export async function generateReport(
  samplesPerModule: number,
  testOnly: boolean = false
): Promise<{ success: boolean; report?: string; message?: string }> {
  try {
    const response = await axios.post(
      `http://localhost:3001/api/v1/email/generate-report`,
      { samplesPerModule, testOnly }
    );
    return {
      success: response.data.success,
      report: response.data.report,
      message: response.data.message,
    };
  } catch (error) {
    console.log(`Error generating report: ${error}`);
    throw error;
  }
}

export async function sendChatMessage(
  logId: string,
  query: string,
  conversation: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Try primary endpoint first
    const response = await axios.post(
      `http://localhost:3001/api/v1/analysis/${logId}/chat`,
      { query, conversation }
    );
    
    return response.data as ChatResponse;
  } catch (error: any) {
    console.error("Error sending chat message:", error);
    
    // Try fallback endpoint if first one fails
    try {
      const fallbackResponse = await axios.post(
        `http://localhost:3001/api/v1/fetchAnalysis/chat/${logId}`,
        { query, conversation }
      );
      return fallbackResponse.data as ChatResponse;
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      
      // Return error response if both endpoints fail
      return {
        success: false,
        message: "Failed to send message. Please try again.",
        error: error.message,
        conversation: [
          ...conversation,
          { role: "user", content: query },
          { role: "assistant", content: "Sorry, there was an error processing your request." }
        ]
      };
    }
  }
}

export async function testEmailScheduler(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axios.post(
      `http://localhost:3001/api/v1/email/test-scheduler`
    );
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    console.log(`Error testing email scheduler: ${error}`);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to test email scheduler",
    };
  }
}

export async function getAvailableReports(): Promise<Array<{filename: string, date: string, size: number}>> {
  try {
    const response = await axios.get(
      `http://localhost:3001/api/v1/email/reports`
    );
    if (!response.data.success) {
      return [];
    }
    return response.data.reports;
  } catch (error) {
    console.log(`Error fetching available reports: ${error}`);
    return [];
  }
}

export async function downloadReport(filename: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `http://localhost:3001/api/v1/email/reports/${filename}`,
      { responseType: 'blob' }
    );
    
    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.log(`Error downloading report: ${error}`);
    return false;
  }
}
