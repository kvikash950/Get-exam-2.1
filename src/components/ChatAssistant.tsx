'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Shield } from 'lucide-react';
import { askPortalAssistant } from '@/ai/flows/portal-assistant-flow';
import { cn } from '@/lib/utils';

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: 'Namaste! I am your My Exam assistant. I can help you understand our features, plans, and anti-cheat technology. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Call the server action flow
      const response = await askPortalAssistant({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', content: response.reply }]);
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "I apologize, but I am experiencing a temporary connection issue. Please try again in a moment or contact our support team directly at support@myexam.io." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <Card className="mb-4 w-[90vw] md:w-[400px] h-[550px] shadow-2xl border-none flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 rounded-[2rem]">
          <CardHeader className="bg-primary text-white p-4 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">My Exam Guide</CardTitle>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Powered by Assessment Forge AI</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] p-3 rounded-2xl text-sm font-medium shadow-sm whitespace-pre-wrap",
                  msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Analyzing query...</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-3 bg-white border-t shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full gap-2">
              <Input 
                placeholder="Ask about AI Proctoring, Offline Mode, or Plans..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-slate-50 border-none h-11 rounded-xl text-sm"
                autoComplete="off"
              />
              <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shrink-0 shadow-lg shadow-primary/20" disabled={!input.trim() || isLoading}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
      
      <Button 
        className={cn(
          "h-14 w-14 md:h-16 md:w-16 rounded-full shadow-2xl p-0 flex items-center justify-center transition-all duration-300 hover:scale-110",
          isOpen ? "bg-slate-200 text-slate-600 rotate-90" : "bg-primary text-white"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </Button>
    </div>
  );
}
