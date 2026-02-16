import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { analyzeData } from '../services/gemini';
import { Transaction } from '../types';

interface AIChatProps {
  transactions: Transaction[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChat: React.FC<AIChatProps> = ({ transactions }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI financial analyst. Ask me anything about your spending, trends, or specific transactions.' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await analyzeData(transactions, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble analyzing that." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[500px] md:h-[600px] overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
        <div className="p-2 bg-primary-600/20 rounded-lg">
          <Bot className="text-primary-500" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Analyst</h3>
          <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700 flex items-center gap-2">
              <Loader2 className="animate-spin text-primary-500" size={16} />
              <span className="text-xs text-slate-400">Analyzing dataset...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your finances (e.g., 'Total food spend?')"
            className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
          />
          <button
            onClick={handleSend}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {["Current balance?", "Top expense category?", "Spending trend?"].map(hint => (
                <button 
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors flex items-center gap-1"
                >
                    <Sparkles size={10} className="text-yellow-500" />
                    {hint}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
