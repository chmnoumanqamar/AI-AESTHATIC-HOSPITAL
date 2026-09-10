import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Bell, RotateCcw } from 'lucide-react';
import { AIChatMessageList, ChatMessage } from './AIChatMessageList';
import { api } from '../../services/api';
import { getStoredThemeColor, THEME_COLOR_OPTIONS, ThemeColorOption } from '../../utils/themePalette';

interface DockedCopilotDrawerProps {
  isDocked?: boolean;
  onToggleDock?: () => void;
  currentUser?: any;
  onSelectTab?: (tab: string) => void;
}

export const DockedCopilotDrawer: React.FC<DockedCopilotDrawerProps> = ({
  isDocked = true,
  onToggleDock,
  currentUser,
  onSelectTab
}) => {
  const userRole = currentUser?.role || 'DOCTOR';

  const initialGreeting: ChatMessage = {
    id: 'm-init',
    sender: 'assistant',
    text: "👋 Hello! I am your AI Clinical Assistant. How can I assist you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeReminder, setActiveReminder] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync active theme palette
  const [activePalette, setActivePalette] = useState<ThemeColorOption>(() => {
    const id = getStoredThemeColor();
    return THEME_COLOR_OPTIONS.find(c => c.id === id) || THEME_COLOR_OPTIONS[0];
  });

  useEffect(() => {
    const handleColorEvent = (e: any) => {
      if (e.detail?.id) {
        const found = THEME_COLOR_OPTIONS.find(c => c.id === e.detail.id);
        if (found) setActivePalette(found);
      }
    };
    window.addEventListener('hospital_theme_color_changed', handleColorEvent);
    return () => window.removeEventListener('hospital_theme_color_changed', handleColorEvent);
  }, []);

  // Auto-sanitize initial message to ensure fresh short greeting even with hot reload
  useEffect(() => {
    setMessages(prev => {
      if (prev.length > 0 && prev[0].id.startsWith('m-init')) {
        return [
          {
            ...prev[0],
            text: "👋 Hello! I am your AI Clinical Assistant. How can I assist you today?"
          },
          ...prev.slice(1)
        ];
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load upcoming 48-hour reminders for active patient
  useEffect(() => {
    const fetchUpcomingReminders = async () => {
      try {
        const userRes = await api.get('/auth/me');
        const user = userRes.data?.data;
        const patientId = user?.profileId;
        if (patientId) {
          const remRes = await api.get(`/appointments/reminders/patient/${patientId}`);
          const list = remRes.data?.data;
          if (list && list.length > 0) {
            setActiveReminder(list[0]);
          }
        }
      } catch {
        // Silently skip if guest or non-patient
      }
    };
    fetchUpcomingReminders();
  }, [currentUser]);

  const handleResetChat = () => {
    setMessages([
      {
        ...initialGreeting,
        id: `m-init-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text.trim(),
        history: messages.map(m => ({
          role: m.sender,
          content: m.text
        }))
      });

      const reply = res.data.data;
      const botMsg: ChatMessage = {
        id: `m-bot-${Date.now()}`,
        sender: 'assistant',
        text: reply.content || 'I have processed your clinical request.',
        cardData: reply.cardData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);

      // If action seeded daily data or summoned patient, trigger real-time queue refresh across workspaces
      if (reply.cardData?.type === 'CLINICAL_DATA_SEEDED' || reply.cardData?.type === 'PATIENT_SUMMONED') {
        window.dispatchEvent(new CustomEvent('hospital:refresh-queue'));
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered a temporary issue connecting to the hospital clinical engine. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const getSuggestionChips = () => {
    if (userRole === 'DOCTOR') {
      return [
        { label: 'Next Patient in Queue', prompt: 'Who is the next patient waiting in my queue?' },
        { label: 'Today Schedule', prompt: 'Give me a summary of my appointments today' },
        { label: 'Prescription Guide', prompt: 'Show active prescriptions requiring follow up' },
        { label: 'Check Drug Stock', prompt: 'Is Augmentin in stock in the hospital pharmacy?' }
      ];
    }
    if (userRole === 'PHARMACIST') {
      return [
        { label: 'Live Dispense Queue', prompt: 'Show pending prescriptions in live dispense queue' },
        { label: 'Low-Stock Inventory', prompt: 'Check low stock medicines and vault inventory' },
        { label: 'Drug Safety Screening', prompt: 'Explain AI clinical drug allergy and interaction checks' },
        { label: 'Pharmacy Status', prompt: 'Check pharmacy hours, services and inventory summary' }
      ];
    }
    if (userRole === 'RECEPTIONIST') {
      return [
        { label: 'Pending Bookings', prompt: 'List all pending appointment booking requests' },
        { label: 'Queue Status', prompt: 'Check token status for today queue' },
        { label: 'Doctors On Duty', prompt: 'Which doctors are on duty today?' },
        { label: 'Pharmacy Hours', prompt: 'What are the hospital pharmacy operating hours and location?' }
      ];
    }
    if (userRole === 'ADMIN') {
      return [
        { label: 'Audit Vault Summary', prompt: 'Show immutable cryptographic audit vault status' },
        { label: 'Pending Bookings', prompt: 'List all pending appointment booking requests' },
        { label: 'Pharmacy Inventory', prompt: 'Check low stock medicines and vault inventory' }
      ];
    }
    if (userRole === 'PATIENT') {
      return [
        { label: 'Doctor Timings & Schedule', prompt: 'Which doctors are available and what are their clinic timings?' },
        { label: 'Check Open Slots', prompt: 'Show available appointment slots and open tokens for today and tomorrow' },
        { label: 'Pharmacy & Medicines', prompt: 'Is the hospital pharmacy open and can I get my medicines?' },
        { label: 'Book Appointment', prompt: 'I want to book an appointment with a specialist doctor' },
        { label: 'My Appointments', prompt: 'When is my next appointment and reminder?' },
        { label: 'Fees & Billing', prompt: 'What are the consultation fees and billing details?' }
      ];
    }
    return [
      { label: 'Queue Status', prompt: 'Check live queue status and waiting patients' },
      { label: 'Pending Approvals', prompt: 'List all pending appointment booking requests' },
      { label: 'Pharmacy Inventory', prompt: 'Check hospital pharmacy stock and inventory summary' },
      { label: 'Audit Vault Summary', prompt: 'Summarize recent security and clinical audit logs' }
    ];
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#171F13] text-[#1F291E] dark:text-[#F6F7F2] select-none">
      {/* Radiant Themed Medical Header */}
      <div 
        className="p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 shadow-sm chatbot-drawer-header transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${activePalette.gradientEnd} 0%, ${activePalette.gradientStart} 100%)`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-white/15 backdrop-blur-md border border-white/25 shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white tracking-tight leading-tight">
                AI Clinical Assistance
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onToggleDock && (
            <button
              onClick={onToggleDock}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
              title="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Proactive 48-Hour Reminder Banner */}
      {activeReminder && (
        <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl shadow-xs text-xs space-y-1.5 shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              <span>Upcoming Consultation Reminder</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeReminder.isUpcomingSoon 
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200' 
                : 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
            }`}>
              {activeReminder.isUpcomingSoon ? '⚠️ Within 48 Hours' : `In ${activeReminder.daysRemaining} days`}
            </span>
          </div>
          <p className="text-slate-700 dark:text-[#C2C5AA] text-[11px] leading-relaxed">
            Doctor: <strong>{activeReminder.doctorName}</strong> on <strong>{activeReminder.appointmentDate}</strong> (Token #{activeReminder.tokenNumber || '1'}).
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => sendMessage('Check my upcoming appointment details and token')}
              className="px-2.5 py-1 bg-white dark:bg-[#1E2718] hover:bg-emerald-50 dark:hover:bg-[#25331E] border border-emerald-300 dark:border-[#38482E] rounded-lg text-[10px] font-bold text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer"
            >
              View Details
            </button>
            <button
              onClick={() => sendMessage('Reschedule my upcoming appointment')}
              className="px-2.5 py-1 bg-white dark:bg-[#1E2718] hover:bg-emerald-50 dark:hover:bg-[#25331E] border border-emerald-300 dark:border-[#38482E] rounded-lg text-[10px] font-bold text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer"
            >
              Reschedule
            </button>
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3 bg-[#F9FAF7] dark:bg-[#141A10]"
      >
        <AIChatMessageList
          messages={messages}
          onConfirmAction={text => sendMessage(text)}
          onBookDoctor={(docId, date) => sendMessage(`Book an appointment with doctor ${docId} on ${date}`)}
          onSelectTab={onSelectTab}
        />

        {isTyping && (
          <div className="ml-3 px-3 py-2 flex items-center gap-2 text-xs rounded-xl bg-white dark:bg-[#1F2B1C] border border-emerald-200 dark:border-emerald-900/60 w-fit shadow-xs animate-pulse text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Consulting clinical intelligence engine...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="p-2 sm:p-2.5 border-t border-brand-200/80 dark:border-[#283620] bg-white dark:bg-[#1A2215] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        {getSuggestionChips().map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(chip.prompt)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 bg-[#F4F9F5] hover:bg-[#E8F3EB] dark:bg-[#202C1B] dark:hover:bg-[#283822] text-[#1B4332] dark:text-[#A7D7C5] border border-[#A7D7C5]/70 dark:border-[#33462A]"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Modern Input Bar */}
      <div className="p-2.5 sm:p-3 border-t border-brand-200 dark:border-[#283620] bg-white dark:bg-[#1A2215]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputText);
          }}
          className="flex items-center gap-2 bg-[#F6F8F4] dark:bg-[#141A10] border border-brand-300 dark:border-[#33462A] rounded-2xl p-1.5 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask about appointments, doctors, pharmacy medicines, queue, or billing..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#1F291E] dark:text-[#F6F7F2] placeholder-slate-400 dark:placeholder-[#778572] focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-95 shrink-0 chatbot-send-button"
            style={{
              background: `linear-gradient(135deg, ${activePalette.gradientStart} 0%, ${activePalette.gradientEnd} 100%)`,
              boxShadow: `0 2px 8px ${activePalette.gradientStart}50`
            }}
            title="Send Message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};
