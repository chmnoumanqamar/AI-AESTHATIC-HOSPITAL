import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, X, Clock, ChevronRight } from 'lucide-react';
import { ChatSession } from '../../services/chat-session.service';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="absolute inset-0 bg-white dark:bg-[#151D12] z-40 flex flex-col animate-in slide-in-from-right duration-250 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-emerald-900/40 flex items-center justify-between bg-slate-50 dark:bg-[#1A2416]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-white">
            Chat History & Sessions
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Bar (+ New Chat & Search) */}
      <div className="p-3 space-y-2 border-b border-slate-100 dark:border-emerald-900/30">
        <button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search past conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1C2618] border border-slate-200 dark:border-emerald-900/40 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
            No conversations found.
          </div>
        ) : (
          filteredSessions.map(sess => {
            const isActive = sess.id === activeSessionId;
            const messageCount = sess.messages ? sess.messages.length : 0;
            const formattedDate = new Date(sess.updatedAt || sess.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess.id);
                  onClose();
                }}
                className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-emerald-50/90 dark:bg-[#202E1B] border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                    : 'bg-white hover:bg-slate-50 dark:bg-[#182114] dark:hover:bg-[#1E2919] border-slate-200/80 dark:border-[#273620]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-[#24311F] text-slate-500 dark:text-emerald-400 group-hover:text-emerald-600'
                  }`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-semibold truncate ${
                      isActive
                        ? 'text-emerald-900 dark:text-emerald-100'
                        : 'text-slate-700 dark:text-[#D5DDD0] group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      {sess.title}
                    </h4>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{messageCount} msgs</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteSession(sess.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer (Clear All) */}
      {sessions.length > 1 && (
        <div className="p-3 border-t border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#1A2416]">
          <button
            onClick={onClearAll}
            className="w-full py-1.5 text-center text-[11px] font-medium text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            Clear All Conversations
          </button>
        </div>
      )}
    </div>
  );
};
