import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Sparkles,
  X,
  Plus,
  Paperclip,
  Mic,
  MicOff,
  History,
  Maximize2,
  Minimize2,
  Square,
  UploadCloud
} from 'lucide-react';
import { AIChatMessageList, ChatMessage } from './AIChatMessageList';
import { FileAttachmentDock, AttachedFileItem } from './FileAttachmentDock';
import { ChatHistoryDrawer } from './ChatHistoryDrawer';
import { chatSessionService, ChatSession } from '../../services/chat-session.service';
import { api } from '../../services/api';
import { getStoredThemeColor, THEME_COLOR_OPTIONS, ThemeColorOption, getCurrentPalette } from '../../utils/themePalette';

interface DockedCopilotDrawerProps {
  isDocked?: boolean;
  onToggleDock?: () => void;
  currentUser?: any;
  onSelectTab?: (tab: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const DockedCopilotDrawer: React.FC<DockedCopilotDrawerProps> = ({
  isDocked = true,
  onToggleDock,
  currentUser,
  onSelectTab,
  isMaximized = false,
  onToggleMaximize
}) => {
  const userRole = currentUser?.role || 'DOCTOR';

  const initialGreeting: ChatMessage = {
    id: 'm-init',
    sender: 'assistant',
    text: "✨ Hello! I am your AI Clinical Copilot powered by Google Gemini. How may I assist you with clinical care, appointment schedules, packages, diagnostic test reminders, or operational reports today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Sync active theme palette
  const [activePalette, setActivePalette] = useState<ThemeColorOption>(getCurrentPalette);

  useEffect(() => {
    const handleColorEvent = (e: any) => {
      if (e.detail?.gradientStart) {
        setActivePalette(e.detail);
      }
    };
    window.addEventListener('hospital_theme_color_changed', handleColorEvent);
    return () => window.removeEventListener('hospital_theme_color_changed', handleColorEvent);
  }, []);

  // Multi-session & History Drawer state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // File Attachments & Drag-and-drop state
  const [pendingFiles, setPendingFiles] = useState<AttachedFileItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stopRequestedRef = useRef(false);

  // Initialize Sessions from Local Storage
  useEffect(() => {
    const loadedSessions = chatSessionService.getAllSessions();
    setSessions(loadedSessions);

    const savedActiveId = chatSessionService.getActiveSessionId();
    const existing = loadedSessions.find(s => s.id === savedActiveId);

    if (existing && existing.messages && existing.messages.length > 0) {
      setActiveSessionId(existing.id);
      setMessages(existing.messages as any);
    } else if (loadedSessions.length > 0) {
      setActiveSessionId(loadedSessions[0].id);
      chatSessionService.setActiveSessionId(loadedSessions[0].id);
      setMessages(loadedSessions[0].messages as any);
    } else {
      // Create fresh default session
      const newSess = chatSessionService.createNewSession([initialGreeting as any]);
      setActiveSessionId(newSess.id);
      setSessions([newSess]);
    }
  }, []);

  // Save changes to active session
  useEffect(() => {
    if (!activeSessionId) return;
    const updated = chatSessionService.updateSession(activeSessionId, messages as any);
    if (updated) {
      setSessions(chatSessionService.getAllSessions());
    }
  }, [messages, activeSessionId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, isStreaming, pendingFiles]);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);


  // Clipboard Paste (Ctrl+V) listener for screenshots and images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        processFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // File Upload Helper
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      if (file.size > 12 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 12MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const item: AttachedFileItem = {
          id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: base64
        };
        setPendingFiles(prev => [...prev, item]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Voice Dictation (Speech Recognition)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setInputText(prev => (prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim()));
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  // Session Management Handlers
  const handleNewChat = () => {
    const newMsg: ChatMessage = {
      ...initialGreeting,
      id: `m-init-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const created = chatSessionService.createNewSession([newMsg as any]);
    setActiveSessionId(created.id);
    setMessages([newMsg]);
    setPendingFiles([]);
    setSessions(chatSessionService.getAllSessions());
    setIsHistoryOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    const found = sessions.find(s => s.id === sessionId);
    if (found) {
      setActiveSessionId(found.id);
      chatSessionService.setActiveSessionId(found.id);
      setMessages(found.messages as any);
      setPendingFiles([]);
      setIsHistoryOpen(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = chatSessionService.deleteSession(sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        setMessages(updated[0].messages as any);
      } else {
        handleNewChat();
      }
    }
  };

  const handleClearAllSessions = () => {
    chatSessionService.clearAllSessions();
    handleNewChat();
  };

  // Stop Generation handler
  const handleStopGeneration = () => {
    stopRequestedRef.current = true;
    setIsStreaming(false);
    setIsTyping(false);
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.sender === 'assistant' && last.isStreaming) {
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      }
      return prev;
    });
  };

  // Core Send Message Function
  const sendMessage = async (text: string) => {
    if ((!text.trim() && pendingFiles.length === 0) || isTyping || isStreaming) return;

    const attachmentsToSend = [...pendingFiles];
    setPendingFiles([]);
    setInputText('');

    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: text.trim() || (attachmentsToSend.length > 0 ? `Attached ${attachmentsToSend.length} document(s)` : ''),
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setIsStreaming(true);
    stopRequestedRef.current = false;

    // Build immediate assistant placeholder with live thinking engine
    const botMsgId = `m-bot-${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      sender: 'assistant',
      text: '',
      isStreaming: true,
      searchingSteps: [
        {
          label: attachmentsToSend.length > 0
            ? 'Analyzing uploaded multimodal attachments with Gemini Flash...'
            : 'Screening clinical safety & medical guardrails...',
          status: 'active'
        },
        { label: 'Querying hospital database, doctor schedules & packages...', status: 'done' }
      ],
      thoughtProcess: {
        steps: [
          'Evaluated safety triage rules and query intent',
          'Cross-referenced operational database and patient records',
          'Formulating structured clinical action plan'
        ],
        thinkingText: 'Searching hospital operational database and cross-verifying verified records...'
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, initialBotMsg]);

    try {
      const payload = {
        message: text.trim(),
        history: messages.slice(-10).map(m => ({
          role: m.sender,
          content: m.text
        })),
        attachments: attachmentsToSend.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          data: f.data
        }))
      };

      const res = await api.post('/ai/chat', payload);
      const reply = res.data.data;
      const fullContent = reply.content || 'I have processed your clinical request.';

      // Handle Autonomous Navigation immediately if requested
      const targetModuleId = reply.navigationTarget?.moduleId || reply.cardData?.targetModuleId;
      if (targetModuleId && onSelectTab) {
        onSelectTab(targetModuleId);
      }

      // Stream text reveals in smooth typewriter chunks
      let displayed = '';
      const chunkSize = Math.max(6, Math.floor(fullContent.length / 28));

      for (let i = 0; i < fullContent.length; i += chunkSize) {
        if (stopRequestedRef.current) break;
        displayed = fullContent.slice(0, i + chunkSize);
        setMessages(prev =>
          prev.map(m => (m.id === botMsgId ? { ...m, text: displayed } : m))
        );
        await new Promise(r => setTimeout(r, 22));
      }

      // Finalize message state
      setMessages(prev =>
        prev.map(m => {
          if (m.id === botMsgId) {
            return {
              ...m,
              text: stopRequestedRef.current ? displayed : fullContent,
              isStreaming: false,
              cardData: reply.cardData,
              groundingSources: reply.groundingSources,
              searchingSteps: reply.searchingSteps,
              thoughtProcess: reply.thoughtProcess,
              followUpChips: reply.followUpChips,
              navigationTarget: reply.navigationTarget
            };
          }
          return m;
        })
      );

      // Trigger global event if database actions occurred
      if (
        reply.cardData?.type === 'CLINICAL_DATA_SEEDED' ||
        reply.cardData?.type === 'PATIENT_SUMMONED' ||
        reply.cardData?.type === 'PACKAGE_BOOKED'
      ) {
        window.dispatchEvent(new CustomEvent('hospital:refresh-queue'));
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === botMsgId
            ? {
                ...m,
                isStreaming: false,
                text: 'Sorry, I encountered a temporary issue connecting to the hospital clinical engine. Please try again.'
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  // Response Tuning Handler
  const handleTuningSelect = (tuningType: 'simpler' | 'shorter' | 'detailed' | 'urdu') => {
    let prompt = '';
    if (tuningType === 'simpler') {
      prompt = 'Please simplify your previous explanation in easy layman terms.';
    } else if (tuningType === 'shorter') {
      prompt = 'Please summarize your previous response in a few concise bullet points.';
    } else if (tuningType === 'detailed') {
      prompt = 'Please provide a comprehensive, in-depth breakdown of your previous response.';
    } else if (tuningType === 'urdu') {
      prompt = 'براہ کرم پچھلا جواب آسان اردو میں سمجھائیں (Please explain previous response in Urdu).';
    }
    if (prompt) {
      sendMessage(prompt);
    }
  };

  // Regenerate Handler
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg && lastUserMsg.text) {
      sendMessage(lastUserMsg.text);
    }
  };

  // Quick Suggestion Chips by Role
  const getSuggestionChips = () => {
    if (userRole === 'DOCTOR') {
      return [
        { label: 'Next Patient in Queue', prompt: 'Who is the next patient waiting in my queue?' },
        { label: 'Today Schedule', prompt: 'Give me a summary of my appointments today' },
        { label: 'Yesterday Report', prompt: 'Generate hospital performance report for yesterday' },
        { label: 'Open Prescriptions', prompt: 'Take me to prescription management' }
      ];
    }
    if (userRole === 'PHARMACIST') {
      return [
        { label: 'Live Dispense Queue', prompt: 'Show pending prescriptions in live dispense queue' },
        { label: 'Low-Stock Inventory', prompt: 'Check low stock medicines and vault inventory' },
        { label: 'Open Pharmacy Tab', prompt: 'Open pharmacy inventory page' }
      ];
    }
    if (userRole === 'ADMIN') {
      return [
        { label: 'Yesterday Report', prompt: 'Generate hospital performance report for yesterday' },
        { label: 'Last Week Report', prompt: 'Show analytics report for last week' },
        { label: 'Open Audit Vault', prompt: 'Open audit vault module' },
        { label: 'All Deals & Packages', prompt: 'Show purchased aesthetic deals and treatment packages' }
      ];
    }
    // Default / Patient
    return [
      { label: 'My Remaining Sessions', prompt: 'Check my purchased packages and remaining sessions' },
      { label: 'My Lab Tests', prompt: 'Do I have any pending lab tests assigned to me?' },
      { label: 'Book Remaining Session', prompt: 'I want to book my next package treatment session' },
      { label: 'Doctor Schedule', prompt: 'Which specialist doctors are available today?' },
      { label: 'Pharmacy Medicine Stock', prompt: 'Is Augmentin in stock in the pharmacy?' }
    ];
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-full flex flex-col bg-white dark:bg-[#171F13] text-[#1F291E] dark:text-[#F6F7F2] select-none"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-emerald-400 p-6 transition-all">
          <UploadCloud className="w-12 h-12 text-emerald-300 animate-bounce mb-2" />
          <p className="text-base font-bold">Drop files here to attach</p>
          <p className="text-xs text-emerald-200 mt-1">Images, Lab Reports (PDF), CSV or clinical documents</p>
        </div>
      )}

      {/* Radiant Emerald / Themed Medical Header with Studio Controls */}
      <div
        className="p-3 sm:p-3.5 border-b flex items-center justify-between shrink-0 shadow-sm chatbot-drawer-header transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${activePalette.gradientEnd} 0%, ${activePalette.gradientStart} 100%)`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-white/15 backdrop-blur-md border border-white/25 shadow-xs shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-tight">
                AI Clinical Copilot
              </h3>
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>GEMINI</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Action Controls */}
        <div className="flex items-center gap-1">
          {/* Top-Right Chat History Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            title="Chat History & Sessions"
          >
            <History className="w-4 h-4" />
          </button>


          {/* Maximize / Studio Toggle Button */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
              title={isMaximized ? 'Minimize Drawer' : 'Expand to Studio'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Close Dock Button */}
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

      {/* Slide-over Chat History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
      />


      {/* Scrollable Message Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3 bg-[#F9FAF7] dark:bg-[#141A10]"
      >
        <AIChatMessageList
          messages={messages}
          onConfirmAction={text => sendMessage(text)}
          onBookDoctor={(docId, date) => sendMessage(`Book an appointment with doctor ${docId} on ${date}`)}
          onSelectTab={onSelectTab}
          onTuningSelect={handleTuningSelect}
          onOpenUpload={() => fileInputRef.current?.click()}
          onRegenerate={handleRegenerate}
        />
      </div>

      {/* Suggestion Chips */}
      <div className="p-2 sm:p-2.5 border-t border-brand-200/80 dark:border-[#283620] bg-white dark:bg-[#1A2215] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        {getSuggestionChips().map((chip, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(chip.prompt)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 bg-[#F4F9F5] hover:bg-[#E8F3EB] dark:bg-[#202C1B] dark:hover:bg-[#283822] text-[#1B4332] dark:text-[#A7D7C5] border border-[#A7D7C5]/70 dark:border-[#33462A]"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Attachment Staging Area */}
      {pendingFiles.length > 0 && (
        <div className="px-3 pt-2 bg-white dark:bg-[#1A2215]">
          <FileAttachmentDock
            files={pendingFiles}
            onRemoveFile={handleRemovePendingFile}
          />
        </div>
      )}

      {/* Modern Input Bar with Left Plus (+) and Voice Dictation */}
      <div className="p-2.5 sm:p-3 border-t border-brand-200 dark:border-[#283620] bg-white dark:bg-[#1A2215]">
        {/* Hidden Universal File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,text/plain,text/csv,application/json,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isStreaming) {
              handleStopGeneration();
            } else {
              sendMessage(inputText);
            }
          }}
          className="flex items-center gap-1.5 bg-[#F6F8F4] dark:bg-[#141A10] border border-brand-300 dark:border-[#33462A] rounded-2xl p-1.5 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
        >
          {/* Left-Side Universal Plus (+) Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer shrink-0"
            title="Attach file or lab report (Images, PDFs, Documents)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Auto-expanding Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputText);
              }
            }}
            placeholder={
              pendingFiles.length > 0
                ? "Ask Gemini to analyze attached files..."
                : "Ask anything, request reports, or check packages..."
            }
            className="flex-1 bg-transparent px-2 py-1.5 text-xs text-[#1F291E] dark:text-[#F6F7F2] placeholder-slate-400 dark:placeholder-[#778572] focus:outline-none resize-none max-h-28 leading-relaxed"
          />

          {/* Voice Dictation Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#25321E]'
            }`}
            title={isListening ? 'Stop voice recording' : 'Voice Dictation'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send or Stop Generation Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="Stop Generation"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim() && pendingFiles.length === 0}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-95 shrink-0 chatbot-send-button"
              style={{
                background: `linear-gradient(135deg, ${activePalette.gradientStart} 0%, ${activePalette.gradientEnd} 100%)`,
                boxShadow: `0 2px 8px ${activePalette.gradientStart}50`
              }}
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

