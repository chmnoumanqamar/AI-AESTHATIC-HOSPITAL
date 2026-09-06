import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Phone, MoreVertical, CheckCheck, Sparkles, User, RefreshCw, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

interface WhatsAppSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalWhatsAppNumber?: string;
}

interface ChatBubble {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const WhatsAppSimulatorModal: React.FC<WhatsAppSimulatorModalProps> = ({
  isOpen,
  onClose,
  hospitalWhatsAppNumber = '+92 300 7654321'
}) => {
  const [senderPhone, setSenderPhone] = useState('+923001234567');
  const [senderName, setSenderName] = useState('Ali Khan');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: `Assalam-o-Alaikum! 🏥 *Aesthetic Hospital Official WhatsApp Bot* mein khush-amdeed.\n\nMain aap ko doctors ki availability, shift timings batane aur foran appointment book karne mein madad kar sakta hoon.\n\nAap kis specialist doctor ya masle ke silsile mein rabta kar rahe hain?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const text = customText || inputMessage;
    if (!text.trim() || loading) return;

    const userBubble: ChatBubble = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userBubble]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post('/ai/whatsapp/simulator', {
        senderPhone,
        senderName,
        messageText: text.trim()
      });

      const botReply = res.data?.data?.reply || 'Hospital system error. Please try again.';
      const botBubble: ChatBubble = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        time: res.data?.data?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botBubble]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Network connectivity error.';
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: `❌ WhatsApp Delivery Error: ${errMsg}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `Assalam-o-Alaikum! 🏥 *Aesthetic Hospital Official WhatsApp Bot* mein khush-amdeed.\n\nMain aap ko doctors ki availability, shift timings batane aur foran appointment book karne mein madad kar sakta hoon.\n\nAap kis specialist doctor ya masle ke silsile mein rabta kar rahe hain?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      {/* Device Frame */}
      <div className="w-full max-w-md bg-[#0C1317] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/80 flex flex-col h-[640px] max-h-[92vh]">
        
        {/* WhatsApp Top Header Bar */}
        <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-800 border border-emerald-300/40 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                🏥
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#008069] rounded-full"></span>
            </div>

            <div className="leading-tight">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Aesthetic Hospital Bot</span>
                <span className="text-[11px] text-emerald-200">✓</span>
              </div>
              <span className="text-[11px] text-emerald-100/90 font-medium">
                {loading ? 'typing...' : 'Official WhatsApp Bot (online)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetChat}
              title="Reset Conversation"
              className="p-1.5 rounded-full hover:bg-emerald-700/60 text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-emerald-700/60 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sender Persona Config Ribbon */}
        <div className="bg-[#1F2C34] px-3 py-2 border-b border-slate-700/50 flex items-center justify-between text-xs text-slate-300 shrink-0 gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-slate-400">Testing As:</span>
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              className="bg-transparent border-b border-slate-600 px-1 py-0.5 text-xs text-emerald-300 font-semibold focus:outline-none w-20 truncate"
              placeholder="Name"
            />
          </div>
          <div className="flex items-center gap-1 truncate font-mono text-[11px]">
            <span className="text-slate-400 text-[10px]">Phone:</span>
            <input
              type="text"
              value={senderPhone}
              onChange={e => setSenderPhone(e.target.value)}
              className="bg-transparent border-b border-slate-600 px-1 py-0.5 text-[11px] text-emerald-300 font-mono focus:outline-none w-28 truncate"
              placeholder="Phone"
            />
          </div>
        </div>

        {/* WhatsApp Chat Bubbles Canvas */}
        <div 
          className="flex-1 overflow-y-auto p-3 space-y-3"
          style={{ 
            backgroundColor: '#0B141A',
            backgroundImage: 'radial-gradient(#182229 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        >
          {/* Security Badge */}
          <div className="flex justify-center">
            <div className="bg-[#182229] border border-amber-900/40 text-amber-200/90 text-[10px] px-3 py-1 rounded-lg text-center max-w-[85%] leading-relaxed shadow-xs">
              🔒 Messages and calls are end-to-end encrypted with AI aesthetic health assistant.
            </div>
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in`}
              >
                <div 
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm relative ${
                    isUser 
                      ? 'bg-[#005C4B] text-emerald-50 rounded-tr-none' 
                      : 'bg-[#202C33] text-slate-100 rounded-tl-none border border-slate-700/40'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-[12px] selection:bg-emerald-800">
                    {msg.text}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-slate-400">{msg.time}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#202C33] text-emerald-300 rounded-2xl rounded-tl-none px-3 py-2 text-xs flex items-center gap-2 border border-slate-700/40">
                <span className="animate-pulse">Thinking & drafting WhatsApp reply...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-[#111B21] px-3 py-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10.5px] scrollbar-none shrink-0">
          <button
            onClick={() => handleSend('Dr. Aisha ki timing aur slots batayein')}
            className="px-2.5 py-1 rounded-full bg-[#202C33] hover:bg-[#2A3942] text-emerald-300 whitespace-nowrap border border-slate-700 cursor-pointer transition-colors"
          >
            Timing & Slots?
          </button>
          <button
            onClick={() => handleSend('Kal Dr. Aisha ke sath appointment book karein')}
            className="px-2.5 py-1 rounded-full bg-[#202C33] hover:bg-[#2A3942] text-emerald-300 whitespace-nowrap border border-slate-700 cursor-pointer transition-colors"
          >
            Book with Dr. Aisha
          </button>
          <button
            onClick={() => handleSend('Haan, details bilkul theek hain')}
            className="px-2.5 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 whitespace-nowrap border border-emerald-700/70 font-semibold cursor-pointer transition-colors"
          >
            ✅ Haan (Confirm)
          </button>
          <button
            onClick={() => handleSend('Nahi, tareekh change karni hai')}
            className="px-2.5 py-1 rounded-full bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 whitespace-nowrap border border-rose-800/60 cursor-pointer transition-colors"
          >
            ❌ Nahi (Edit)
          </button>
        </div>

        {/* WhatsApp Chat Input Bar */}
        <div className="bg-[#202C33] p-2.5 flex items-center gap-2 shrink-0 border-t border-slate-800">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message (e.g. Kal ki appointment)"
            className="flex-1 bg-[#2A3942] text-slate-100 placeholder-slate-400 text-xs px-3.5 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputMessage.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#00A884] hover:bg-[#008069] disabled:opacity-50 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
