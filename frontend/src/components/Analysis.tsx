import { AnalysisType } from "@/lib/actions";
import { Bot, Clock, Database, HardDrive, Server, Zap, Send, ArrowUpCircle, X } from "lucide-react";
import "../App.css";
import { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatResponse, sendChatMessage } from "@/lib/actions";

interface AnalysisProps {
  selectedLogId: string;
  analysis: AnalysisType | null;
}

export default function Analysis({ selectedLogId, analysis }: AnalysisProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Focus on input when chat is opened
  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatOpen]);

  // Reset chat when a new log is selected
  useEffect(() => {
    if (selectedLogId) {
      setChatOpen(false);
      setConversation([]);
    }
  }, [selectedLogId]);

  const handleSendMessage = async () => {
    if (!chatQuery.trim() || !selectedLogId || !analysis) return;
    
    const userMessage = chatQuery.trim();
    setChatQuery("");
    
    // Add user message to conversation immediately for UI responsiveness
    // Ensure the role is one of the valid types expected by the API
    setConversation(prev => [...prev, { role: "user", content: userMessage }]);
    
    setLoading(true);
    try {
      // Map conversation to ensure roles are proper strings
      const formattedConversation = conversation.map(msg => ({
        role: msg.role === "user" || msg.role === "assistant" || msg.role === "system" 
          ? msg.role 
          : "user", // Default to user if invalid role
        content: msg.content
      }));
      
      const response = await sendChatMessage(selectedLogId, userMessage, formattedConversation);
      
      if (response.success) {
        // Replace entire conversation with the one from the response
        // This ensures consistency with the server
        setConversation(response.conversation);
      } else {
        // Just add the error message
        setConversation(prev => [...prev, { role: "assistant", content: response.message }]);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pl-4 pr-4 pb-4 bg-gray-800 rounded-lg">
      <div className="sticky top-0 bg-gray-800 py-4 z-10">
        <h2 className="text-xl font-bold flex items-center space-x-2 text-white">
          <Bot size={22} className="text-blue-400" />
          <span>Error Analysis</span>
          
          {selectedLogId && analysis && (
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className={`ml-auto p-2 rounded-md text-sm flex items-center gap-1 transition-colors ${
                chatOpen ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {chatOpen ? (
                <>
                  <X size={14} />
                  <span>Close Chat</span>
                </>
              ) : (
                <>
                  <Bot size={14} />
                  <span>Ask Questions</span>
                </>
              )}
            </button>
          )}
        </h2>
      </div>
      
      <div className={`flex flex-col h-[500px] ${chatOpen ? 'h-[350px]' : 'h-[500px]'}`}>
        {selectedLogId ? (
          analysis ? (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-700/50 backdrop-blur-sm rounded-lg text-gray-300 logs-card-container">
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg mb-4">
                <h3 className="text-sm uppercase tracking-wider text-red-300 mb-1">Error Message</h3>
                <p className="text-red-400 font-mono leading-relaxed">
                  {analysis.analysis.breakdown.error_message}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/70 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-400" />
                    <h3 className="text-sm font-medium text-gray-200">Timestamp</h3>
                  </div>
                  <p className="text-sm ml-6">{analysis.analysis.breakdown.timestamp}</p>
                </div>
                
                <div className="bg-gray-800/70 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={16} className="text-blue-400" />
                    <h3 className="text-sm font-medium text-gray-200">Module</h3>
                  </div>
                  <p className="text-sm ml-6">{analysis.analysis.breakdown.module}</p>
                </div>
                
                <div className="bg-gray-800/70 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive size={16} className="text-blue-400" />
                    <h3 className="text-sm font-medium text-gray-200">PCI Device</h3>
                  </div>
                  <p className="text-sm ml-6">{analysis.analysis.breakdown.pci_device || "No data available for this component"}</p>
                </div>
                
                <div className="bg-gray-800/70 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Server size={16} className="text-blue-400" />
                    <h3 className="text-sm font-medium text-gray-200">Timezone</h3>
                  </div>
                  <p className="text-sm ml-6">{analysis.analysis.breakdown.timezone}</p>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-yellow-400">
                  <Zap size={16} />
                  Possible Cause
                </h3>
                <p className="text-gray-300 leading-relaxed">{analysis.analysis.possible_cause}</p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-blue-400">
                  <Server size={16} />
                  Actionable Steps
                </h3>
                <ul className="space-y-2">
                  {analysis.analysis.actionable_steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-blue-500/20 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-400">Analyzing error log...</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-700/30 rounded-lg">
            <Bot size={36} className="text-gray-500 mb-3 opacity-50" />
            <p>Select an error log to view its analysis</p>
          </div>
        )}
      </div>
      
      {/* Chat Interface */}
      {chatOpen && selectedLogId && analysis && (
        <div className="mt-4 bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
          <div className="bg-gray-800 p-2 border-b border-gray-600 flex items-center">
            <Bot size={16} className="text-blue-400 mr-2" />
            <p className="text-sm font-medium text-gray-300">AI Assistant Chat</p>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="p-3 h-[150px] overflow-y-auto"
          >
            {conversation.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">Ask me about this error or how to implement the suggested fixes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversation.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-gray-600 text-gray-200 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-600 text-gray-200 max-w-[80%] p-2 rounded-lg rounded-tl-none">
                      <div className="flex space-x-1 items-center">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-600 flex">
            <input
              ref={inputRef}
              type="text"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask a question about this error..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-l-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !chatQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-md px-3 py-2 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <ArrowUpCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
