import React from 'react';
import { Bot, User, Sparkles, CheckCheck } from 'lucide-react';
import { InteractiveActionCard } from './InteractiveActionCard';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  cardData?: any;
  timestamp: string;
}

interface AIChatMessageListProps {
  messages: ChatMessage[];
  onConfirmAction?: (actionText: string) => void;
  onBookDoctor?: (doctorId: string, date: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const AIChatMessageList: React.FC<AIChatMessageListProps> = ({
  messages,
  onConfirmAction,
  onBookDoctor,
  onSelectTab
}) => {
  return (
    <div className="space-y-4 p-3 sm:p-4">
      {messages.map((msg) => {
        const isUser = msg.sender === 'user';

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs transition-transform group-hover:scale-105 ${
                isUser
                  ? 'bg-gradient-to-br from-[#2D3923] to-[#1A2215] text-white ring-1 ring-white/20'
                  : 'bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] text-white ring-2 ring-emerald-500/20 shadow-[0_2px_8px_rgba(45,106,79,0.3)]'
              }`}
            >
              {isUser ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
            </div>

            {/* Bubble Container */}
            <div className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all ${
                  isUser
                    ? 'text-white rounded-tr-xs shadow-md'
                    : 'rounded-tl-xs border shadow-xs'
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
                {/* For assistant, use class based styling that works in both light and dark mode */}
                {!isUser && (
                  <div className="text-[#1F291E] dark:text-[#F1F5E9]">
                    <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed font-normal">
                      {msg.text}
                    </div>

                    {/* Rich Widget Cards */}
                    {msg.cardData && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-[#38482E]">
                        <InteractiveActionCard
                          cardData={msg.cardData}
                          onConfirmAction={onConfirmAction}
                          onBookDoctor={onBookDoctor}
                          onSelectTab={onSelectTab}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isUser && (
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-white">
                    {msg.text}
                  </div>
                )}
              </div>

              {/* Timestamp Row - High Contrast, Clean & Readable */}
              <div className="flex items-center gap-1 mt-1 px-1.5 text-[11px] font-medium text-slate-500 dark:text-[#B6AD90]">
                <span>{msg.timestamp}</span>
                {isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline ml-0.5" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
