'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, Bot, User, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { promptSuggestions, responses } from '@/lib/ai-chatbot-data';

type ResponseData = KeeperData & {
  totalAssets?: bigint;
  userShares?: bigint;
  totalShares?: bigint;
};

type Topic = {
  keywords: string[];
  getResponse: (data: ResponseData) => string;
};

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface KeeperData {
  vaultBalance?: string;
  metrics?: {
    totalStrategies?: number;
    successRate?: number;
    totalProfit?: string;
  };
  strategy?: {
    isActive?: boolean;
    loanAmount?: string;
    tickLower?: number;
    tickUpper?: number;
    expectedProfit?: string;
    gasEstimate?: string;
  };
  isRunning?: boolean;
  health?: {
    status?: string;
  };
}

interface AIChatbotProps {
  keeperData: KeeperData | null;
  totalAssets?: bigint;
  userShares?: bigint;
  totalShares?: bigint;
  isConnected?: boolean;
}

const getRandomGreeting = () => {
  return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
};

export function AIChatbot({ keeperData, totalAssets, userShares, totalShares, isConnected }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: getRandomGreeting(),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const topic in responses.topics) {
      const { keywords, getResponse } = (responses.topics as Record<string, Topic>)[topic];
      if (keywords.some((keyword: string) => lowerMessage.includes(keyword))) {
        return getResponse({ ...keeperData, totalAssets, userShares, totalShares });
      }
    }

    return responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
  };

  const handleSend = async (messageContent?: string) => {
    const currentInput = messageContent || input;
    if (!currentInput.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking time with more variability
    setTimeout(() => {
      const aiResponse: Message = {
        role: 'ai',
        content: generateResponse(currentInput),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl transition-transform transform hover:scale-110 animate-pulse-glow"
                size="icon"
              >
                <Bot className="h-8 w-8" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ask the AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-lg h-[700px] flex flex-col bg-background border-border shadow-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-purple-500" />
            <span className="font-bold text-lg">AI Analytics Assistant</span>
            <Badge variant="outline" className="text-xs border-green-500 text-green-500">
              Online
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 pr-4 -mr-4 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-6 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-md transition-all ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p>{message.content}</p>
                  <div className="text-xs opacity-60 mt-2 text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 items-start justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3 text-sm shadow-md">
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">Typing</span>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex flex-wrap gap-2 mb-3">
            {promptSuggestions.map((prompt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1.5"
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
              >
                <Zap className="h-3 w-3 mr-1.5" />
                {prompt}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ask about vault analytics..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
              className="flex-1"
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping} size="icon" className="bg-purple-500 hover:bg-purple-600">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
