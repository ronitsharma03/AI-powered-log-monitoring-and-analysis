export interface llmOutputType {
  logAnalysis: {
    log_message: string;
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

export const schema = {
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
