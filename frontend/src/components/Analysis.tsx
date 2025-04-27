import { AnalysisType } from "@/lib/actions";
import { Bot, Clock, Database, HardDrive, Server, Zap, Send, ArrowUpCircle, X, MessageSquare, Lightbulb, Info, Terminal, HelpCircle } from "lucide-react";
import "../App.css";
import { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatResponse, sendChatMessage } from "@/lib/actions";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisProps {
  selectedLogId: string;
  analysis: AnalysisType | null;
}

// Predefined suggestion questions
const SUGGESTIONS = [
  { id: 1, text: "What caused this error?", icon: <Info size={14} /> },
  { id: 2, text: "How can I fix this issue?", icon: <Terminal size={14} /> },
  { id: 3, text: "Is this error critical?", icon: <HelpCircle size={14} /> },
  { id: 4, text: "Explain the actionable steps in detail", icon: <Lightbulb size={14} /> }
];

export default function Analysis({ selectedLogId, analysis }: AnalysisProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setShowSuggestions(true);
      setError(null);
    }
  }, [selectedLogId]);

  const handleSendMessage = async (message?: string) => {
    const userMessage = message || chatQuery.trim();
    
    if (!userMessage || !selectedLogId || !analysis) return;
    
    setChatQuery("");
    setShowSuggestions(false);
    setError(null);
    
    // Add user message to conversation immediately for UI responsiveness
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
      setError("Failed to send message. Please try again.");
      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Use a suggestion as the query
  const useSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Handle textarea resize and Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea as user types
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    
    // Reset height to get the correct scrollHeight
    target.style.height = 'auto';
    
    // Set new height based on content (with max height of 120px)
    const newHeight = Math.min(target.scrollHeight, 120);
    target.style.height = `${newHeight}px`;
    
    setChatQuery(target.value);
  };

  return (
    <div className="pl-4 pr-4 pb-4 bg-gray-800 rounded-lg h-full flex flex-col">
      <div className="sticky top-0 bg-gray-800 py-4 z-10">
        <h2 className="text-xl font-bold flex items-center space-x-2 text-white">
          {chatOpen ? (
            <>
              <Bot size={22} className="text-blue-400" />
              <span>AI Assistant</span>
            </>
          ) : (
            <>
              <Bot size={22} className="text-blue-400" />
              <span>Error Analysis</span>
            </>
          )}
          
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
                  <MessageSquare size={14} />
                  <span>Ask AI Assistant</span>
                </>
              )}
            </button>
          )}
        </h2>
      </div>
      
      {!chatOpen && (
        <div className="flex-1">
          {selectedLogId ? (
            analysis ? (
              <div className="flex-1 overflow-y-auto p-4 bg-gray-700/50 backdrop-blur-sm rounded-lg text-gray-300 logs-card-container h-[500px]">
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
      )}
      
      {/* Chat Interface */}
      {chatOpen && selectedLogId && analysis && (
        <div className="flex-1 flex flex-col bg-gray-700 rounded-lg overflow-hidden border border-gray-600 shadow-lg max-h-[600px]">
          <div className="bg-gray-800 p-3 border-b border-gray-600 flex items-center">
            <Bot size={18} className="text-blue-400 mr-2" />
            <p className="font-medium text-gray-300">AI Assistant for Error Analysis</p>
            <p className="ml-2 text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
              Powered by LLaMA 3
            </p>
          </div>
          
          {/* Error message if any */}
          {error && (
            <div className="px-4 py-2 bg-red-900/30 border-b border-red-500/30 text-red-200 text-sm flex items-center">
              <X size={14} className="mr-2 text-red-400" />
              {error}
            </div>
          )}
          
          <div 
            ref={chatContainerRef}
            className="p-4 overflow-y-auto chat-container h-[400px]"
          >
            {conversation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Bot size={36} className="text-blue-400 mb-4" />
                <h3 className="text-white font-medium text-center mb-2">I can help you understand this error</h3>
                <p className="text-gray-400 text-sm text-center mb-4">
                  Ask questions about the error, how to fix it, or why it happened.
                </p>
                
                <div className="bg-gray-800/70 p-3 rounded-lg mb-5 max-w-md w-full">
                  <h4 className="text-sm font-medium text-gray-200 mb-2">Error Details</h4>
                  <p className="text-xs text-gray-400 mb-1"><strong>Module:</strong> {analysis.analysis.breakdown.module}</p>
                  <p className="text-xs text-gray-400 mb-2"><strong>Error:</strong> {analysis.analysis.breakdown.error_message}</p>
                </div>
                
                {showSuggestions && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map(suggestion => (
                      <button
                        key={suggestion.id}
                        onClick={() => useSuggestion(suggestion.text)}
                        className="bg-gray-800 hover:bg-gray-700 text-blue-400 text-sm px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors border border-gray-600"
                      >
                        {suggestion.icon}
                        <span>{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {conversation.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        {msg.role === 'user' ? (
                          <span className="text-white font-medium text-xs">You</span>
                        ) : (
                          <Bot size={16} className="text-white" />
                        )}
                      </div>
                      
                      <div 
                        className={`p-3 rounded-lg chat-message text-xs ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-gray-600 text-gray-200 rounded-tl-none'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="bg-gray-600 text-gray-200 p-3 rounded-lg rounded-tl-none">
                        <div className="flex space-x-2 items-center h-5">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Suggestion chips after conversation started */}
          {conversation.length > 0 && !loading && showSuggestions && (
            <div className="px-4 py-2 border-t border-gray-600 flex flex-wrap gap-2">
              {SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => useSuggestion(suggestion.text)}
                  className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors border border-gray-600 text-gray-300"
                >
                  {suggestion.icon}
                  <span>{suggestion.text}</span>
                </button>
              ))}
            </div>
          )}
          
          <div className="p-3 border-t border-gray-600 mt-auto">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={chatQuery}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this error or how to fix it... (Shift+Enter for new line)"
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[40px] max-h-[120px] resize-none"
                disabled={loading}
                rows={1}
                style={{ height: 'auto' }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !chatQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[50px] self-end h-[40px]"
                aria-label="Send message"
              >
                {loading ? (
                  <ArrowUpCircle size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-400 ml-1">
              Press Shift+Enter for a new line
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
