import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import { useApp } from "../utils/appStore";
import { apiService } from "../services/apiService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Send, Bot, User, Loader2, RefreshCw, Database, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

export function EmailAgent() {
  const { emailId } = useParams();
  const { state } = useApp();
  const selectedEmail = emailId
    ? state.emails.find((e) => e.id === emailId)
    : null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content: selectedEmail
        ? `I've analyzed the email from ${selectedEmail.sender.name}. How can I help you with this email?`
        : "Hello! I'm your AI email agent. Ask me anything about managing your emails.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [knowledgeBaseCleared, setKnowledgeBaseCleared] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset conversation when email changes
  useEffect(() => {
    if (selectedEmail) {
      setMessages([
        {
          id: "1",
          role: "agent",
          content: `I've analyzed the email from ${selectedEmail.sender.name}. How can I help you with this email?`,
          timestamp: new Date(),
        },
      ]);
      setKnowledgeBaseCleared(false);
    }
  }, [selectedEmail?.id]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input;
    setInput("");
    setIsLoading(true);

    try {
      let agentResponse;

      if (state.backendConnected) {
        // Use backend API
        const response = await apiService.chatWithAgent(
          userQuery,
          selectedEmail?.id || null,
          conversationHistory
        );

        if (response.success) {
          agentResponse = response.data.response;
          
          // Update conversation history
          setConversationHistory(prev => [
            ...prev,
            { query: userQuery, response: agentResponse }
          ]);
        } else {
          throw new Error(response.message || 'Failed to get response from agent');
        }
      } else {
        // Fallback to local processing
        agentResponse = generateFallbackResponse(userQuery, selectedEmail);
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: agentResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get response from AI agent');
      
      // Fallback response
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation and knowledge base
  const clearConversation = () => {
    setMessages([
      {
        id: "1",
        role: "agent",
        content: selectedEmail
          ? `Knowledge base cleared. I've re-analyzed the email from ${selectedEmail.sender.name}. How can I help you with this email?`
          : "Knowledge base cleared. How can I help you with email management?",
        timestamp: new Date(),
      },
    ]);
    setConversationHistory([]);
    setKnowledgeBaseCleared(true);
    toast.success("Knowledge base cleared and conversation reset!");
  };

  const generateFallbackResponse = (query: string, email: any) => {
    const lowerQuery = query.toLowerCase();
    
    if (email) {
      if (lowerQuery.includes('summary') || lowerQuery.includes('about')) {
        return `This email is from ${email.sender.name} with the subject "${email.subject}". It's categorized as ${email.category || 'Uncategorized'} and appears to be about ${email.subject.toLowerCase()}.`;
      }
      
      if (lowerQuery.includes('action') || lowerQuery.includes('task')) {
        return email.actionItems?.length > 0 
          ? `I found these action items: ${email.actionItems.join(', ')}`
          : "I don't see any specific action items in this email.";
      }
      
      if (lowerQuery.includes('reply') || lowerQuery.includes('respond')) {
        return "I can help you draft a reply. Would you like me to generate a professional response based on the email content?";
      }
    }
    
    return "I understand your request. How can I help you manage your emails more efficiently?";
  };

  return (
    <div className="h-full flex">
      {/* Selected Email Info - Left Panel */}
      {selectedEmail && (
        <div className="w-80 bg-white/50 backdrop-blur-sm border-r border-white/20 p-6 overflow-y-auto">
          <div className="bg-white/70 rounded-2xl shadow-md p-6">
            <h3 className="text-gray-800 mb-4">Email Context</h3>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                {selectedEmail.sender.avatar}
              </div>
              <div>
                <p className="text-gray-800">{selectedEmail.sender.name}</p>
                <p className="text-gray-500 text-xs">
                  {selectedEmail.sender.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-xs mb-1">Subject</p>
                <p className="text-gray-800">{selectedEmail.subject}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Category</p>
                <Badge
                  className={`${selectedEmail.categoryColor} text-white rounded-full`}
                >
                  {selectedEmail.category}
                </Badge>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Received</p>
                <p className="text-gray-700">{selectedEmail.timestamp}</p>
              </div>

              {selectedEmail.actionItems.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs mb-2">Action Items</p>
                  <ul className="space-y-2">
                    {selectedEmail.actionItems.map((item, index) => (
                      <li
                        key={index}
                        className="text-gray-700 text-xs flex items-start gap-2"
                      >
                        <span className="text-blue-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface - Right Panel */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white/70 backdrop-blur-sm border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-800">Email Agent</h2>
                <p className="text-gray-500 text-xs">
                  {selectedEmail ? `Analyzing: ${selectedEmail.subject}` : "AI-powered assistant"}
                </p>
              </div>
            </div>
            
            {/* Knowledge Base Controls */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className={`text-xs ${state.backendConnected ? 'text-green-600' : 'text-orange-600'}`}>
                {state.backendConnected ? (
                  <><Wifi className="w-3 h-3 mr-1" />Backend Connected</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" />Offline Mode</>
                )}
              </Badge>
              
              {selectedEmail && (
                <>
                  <Badge variant="outline" className="text-xs">
                    <Database className="w-3 h-3 mr-1" />
                    RAG Active
                  </Badge>
                  <Button
                    onClick={clearConversation}
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    title="Clear conversation and restart"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Chat
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "agent" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-lg rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-white/70 backdrop-blur-sm text-gray-800 shadow-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/70 backdrop-blur-sm border-t border-white/20 p-6">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
              placeholder={isLoading ? "AI is thinking..." : "Ask me anything about this email..."}
              disabled={isLoading}
              className="flex-1 rounded-2xl border-gray-200 bg-white shadow-sm"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-6 shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
