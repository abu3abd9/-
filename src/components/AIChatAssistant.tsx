import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, Minimize2, Maximize2, Copy, Check, HelpCircle, MessageSquare, RefreshCw, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `أهلاً بك! أنا المساعد الذكي لمنصة "اجتماع" 🤖✨\n\nيمكنك سؤالي عن أي شيء! أستطيع الشرح لك بالتفصيل عن منصة اجتماع، كيفية الحفظ والتسجيل والتنزيل، أو الإجابة عن أي سؤال عام في التقنية، مقابلات العمل، أو غير ذلك.`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history })
      });

      const data = await res.json();
      const replyText = data.reply || 'تم استلام استفسارك بنجاح!';

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى إعادة المحاولة.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    '✨ اشرح لي مميزات منصة اجتماع بالتفصيل',
    '🎥 كيف أحفظ تسجيلي وأنزل تقرير المقابلة؟',
    '💡 أعطني نصائح لإجراء مقابلة عمل ناجحة',
    '📦 كيف أقوم بتنزيل كود هذا الموقع كاملاً؟'
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 px-4 py-3 rounded-full font-bold shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition cursor-pointer border border-emerald-300/40"
          title="مساعد الذكاء الاصطناعي | اسألني أي سؤال"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 text-slate-950" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900"></span>
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black tracking-wide">مساعد الذكاء الاصطناعي</span>
          <Sparkles className="w-4 h-4 text-slate-900 animate-pulse" />
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[85vh] h-[600px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-100">مساعد اجتماع الذكي</h3>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">اسأل أي سؤال عن المنصة أو أي موضوع عام</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
                title="تصغير"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/60 text-xs text-slate-200">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl relative group ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none shadow-md'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-none shadow-lg'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.text}</p>

                  <div className="flex items-center justify-between gap-4 mt-2 text-[10px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1"
                        title="نسخ النص"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl max-w-[80%] text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="text-xs">جاري تفكير ومناقشة المساعد الذكي...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 text-[11px] rounded-lg border border-slate-700/70 whitespace-nowrap transition flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="اكتب سؤالك هنا (عن المنصة أو أي موضوع)..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 rounded-xl font-bold transition flex items-center justify-center shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
