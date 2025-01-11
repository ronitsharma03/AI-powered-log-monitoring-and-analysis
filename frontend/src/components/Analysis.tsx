import { Bot, Send } from "lucide-react";
import { Message } from "./LogsCard";
import { RefObject } from "react";

interface AnalysisProps {
  selectedLogId: string | null;
  chatMessages: Message[];
  chatEndRef: RefObject<HTMLDivElement>;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
}
export default function Analysis({
  selectedLogId,
  chatMessages,
  chatEndRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
}: AnalysisProps) {
  return (
    <div className="pl-4 bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2 text-white">
        <Bot size={24} className="text-blue-400" />
        <span>Error Analysis</span>
      </h2>
      <div className="flex flex-col h-[500px]">
        {selectedLogId ? (
          <>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {chatMessages.map((message: any) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-blue-100"
                          : "text-gray-400"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask for more details..."
                className="flex-1 rounded-lg px-4 py-2 bg-gray-700 text-gray-200 placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select an error log to start analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
