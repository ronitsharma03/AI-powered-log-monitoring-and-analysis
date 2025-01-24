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
    console.log(`Error fettching the log's analysis: ${error}`);
    return null;
  }
}
