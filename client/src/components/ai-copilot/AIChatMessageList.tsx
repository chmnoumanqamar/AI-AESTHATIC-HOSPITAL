import React, { useState } from 'react';
import { User, Sparkles, CheckCheck, Copy, Check, Volume2, VolumeX, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { InteractiveActionCard } from './InteractiveActionCard';
import { GeminiThinkingStream } from './GeminiThinkingStream';
import { GeminiResponseTuner } from './GeminiResponseTuner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { PackageSessionCard } from './PackageSessionCard';
import { LabTestReminderCard } from './LabTestReminderCard';
import { ReportVisualCard } from './ReportVisualCard';
import { CountdownReminderBanner } from './CountdownReminderBanner';
import { FileAttachmentDock, AttachedFileItem } from './FileAttachmentDock';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  cardData?: any;
  timestamp: string;
  attachments?: AttachedFileItem[];
  thoughtProcess?: {
    durationMs?: number;
    steps?: string[];
    thinkingText?: string;
  } | string;
  searchingSteps?: Array<{ label: string; status: 'done' | 'active' }>;
  steps?: string[];
  groundingSources?: Array<{ title: string; subtitle?: string; sourceUrl?: string; verified?: boolean }>;
  followUpChips?: string[];
  navigationTarget?: any;
  isStreaming?: boolean;
}

interface AIChatMessageListProps {
  messages: ChatMessage[];
  onConfirmAction?: (actionText: string) => void;
  onBookDoctor?: (doctorId: string, date: string) => void;
  onSelectTab?: (tab: string) => void;
  onTuningSelect?: (tuningType: 'simpler' | 'shorter' | 'detailed' | 'urdu') => void;
  onOpenUpload?: () => void;
  onRegenerate?: () => void;
}

export const AIChatMessageList: React.FC<AIChatMessageListProps> = ({
  messages,
  onConfirmAction,
  onBookDoctor,
  onSelectTab,
  onTuningSelect,
  onOpenUpload,
  onRegenerate
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~[\]()]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [id]: prev[id] === type ? undefined as any : type
    }));
  };

  return (
    <div className="space-y-4 p-2 sm:p-3">
      {messages.map((msg) => {
        const isUser = msg.sender === 'user';
        const hasAttachments = msg.attachments && msg.attachments.length > 0;

        // Resolve thinking process data
        const thinkingText = typeof msg.thoughtProcess === 'string'
          ? msg.thoughtProcess
          : msg.thoughtProcess?.thinkingText;
        const thinkingSteps = Array.isArray(msg.steps)
          ? msg.steps
          : (typeof msg.thoughtProcess === 'object' && msg.thoughtProcess?.steps ? msg.thoughtProcess.steps : undefined);
        const hasThinking = !isUser && (thinkingText || (thinkingSteps && thinkingSteps.length > 0) || (msg.searchingSteps && msg.searchingSteps.length > 0) || msg.isStreaming);

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} group animate-in fade-in duration-200`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs transition-transform group-hover:scale-105 ${
                isUser
                  ? 'bg-gradient-to-br from-[#2D3923] to-[#1A2215] text-white ring-1 ring-white/20'
                  : 'bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white ring-2 ring-emerald-500/25 shadow-[0_2px_10px_rgba(45,106,79,0.35)]'
              }`}
            >
              {isUser ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white animate-pulse" />}
            </div>

            {/* Bubble Container */}
            <div className={`max-w-[90%] sm:max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
              
              {/* User Attachment Previews */}
              {isUser && hasAttachments && (
                <div className="mb-2 max-w-full">
                  <FileAttachmentDock files={msg.attachments!} readOnly={true} />
                </div>
              )}

              {/* Message Box */}
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-xs ${
                  isUser
                    ? 'text-white rounded-tr-xs'
                    : 'rounded-tl-xs border border-slate-200/80 dark:border-[#2D3D26] bg-white dark:bg-[#192215]'
                }`}
                style={
                  isUser
                    ? {
                        background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                        color: '#FFFFFF'
                      }
                    : undefined
                }
              >
                {/* Assistant Content */}
                {!isUser && (
                  <div className="text-[#1F291E] dark:text-[#F1F5E9] space-y-2">
                    {/* Gemini Thinking Accordion & Live Searching Engine */}
                    {hasThinking && (
                      <GeminiThinkingStream
                        isStreaming={msg.isStreaming}
                        steps={thinkingSteps}
                        searchingSteps={msg.searchingSteps}
                        thinkingText={thinkingText}
                        defaultExpanded={false}
                      />
                    )}

                    {/* Rich Markdown Rendered Body */}
                    <div className="leading-relaxed">
                      <MarkdownRenderer content={msg.text} />
                    </div>

                    {/* Specialized Interactive Widgets & Cards */}
                    {msg.cardData && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-[#2F3F28]">
                        {msg.cardData.type === 'APPOINTMENT_REMINDER' || msg.cardData.type === 'TOKEN_STATUS' || (msg.cardData.tokenNumber && msg.cardData.appointmentDate) ? (
                          <CountdownReminderBanner
                            reminder={msg.cardData}
                            onActionClick={prompt => onConfirmAction?.(prompt)}
                          />
                        ) : msg.cardData.type === 'HOSPITAL_REPORT' || msg.cardData.kpis ? (
                          <ReportVisualCard cardData={msg.cardData} />
                        ) : msg.cardData.type === 'PATIENT_PACKAGES' || msg.cardData.packages ? (
                          <PackageSessionCard
                            cardData={msg.cardData}
                            onBookSession={prompt => onConfirmAction?.(prompt)}
                          />
                        ) : msg.cardData.type === 'ASSIGNED_LAB_TESTS' || msg.cardData.tests ? (
                          <LabTestReminderCard
                            cardData={msg.cardData}
                            onActionClick={prompt => onConfirmAction?.(prompt)}
                            onOpenUpload={onOpenUpload}
                          />
                        ) : (
                          <InteractiveActionCard
                            cardData={msg.cardData}
                            onConfirmAction={onConfirmAction}
                            onBookDoctor={onBookDoctor}
                            onSelectTab={onSelectTab}
                          />
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* User Content */}
                {isUser && (
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-white">
                    {msg.text}
                  </div>
                )}
              </div>

              {/* Interactive Follow-Up Chips */}
              {!isUser && msg.followUpChips && msg.followUpChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.followUpChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => onConfirmAction?.(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300/70 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 font-medium transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Gemini Assistant Utility Action Bar (Copy, TTS Audio, Tuner, Feedback) */}
              {!isUser && (
                <div className="flex items-center gap-1 mt-1.5 px-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1.5 font-medium">
                    {msg.timestamp}
                  </span>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={copiedId === msg.id ? 'Copied to clipboard' : 'Copy response'}
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Read Aloud TTS Audio */}
                  <button
                    onClick={() => handleToggleSpeech(msg.id, msg.text)}
                    className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      speakingId === msg.id
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 animate-pulse'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={speakingId === msg.id ? 'Stop reading' : 'Read aloud (TTS)'}
                  >
                    {speakingId === msg.id ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Gemini Response Tuner ("Modify Response") */}
                  {onTuningSelect && (
                    <GeminiResponseTuner onTuningSelect={onTuningSelect} />
                  )}

                  {/* Regenerate Button */}
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Regenerate response"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Thumbs Up / Down */}
                  <button
                    onClick={() => handleFeedback(msg.id, 'up')}
                    className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      feedback[msg.id] === 'up'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Helpful response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleFeedback(msg.id, 'down')}
                    className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      feedback[msg.id] === 'down'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* User Timestamp */}
              {isUser && (
                <div className="flex items-center gap-1 mt-1 px-1.5 text-[11px] font-medium text-slate-500 dark:text-[#B6AD90]">
                  <span>{msg.timestamp}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline ml-0.5" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

