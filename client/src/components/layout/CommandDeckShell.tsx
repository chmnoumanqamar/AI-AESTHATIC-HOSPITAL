import React, { useState } from 'react';
import { StructuralRailNav } from './StructuralRailNav';
import { HeaderBar } from './HeaderBar';
import { DockedCopilotDrawer } from '../ai-copilot/DockedCopilotDrawer';
import { Bot, Sparkles, X } from 'lucide-react';

interface CommandDeckShellProps {
  currentRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchRole: (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') => void;
  currentUser?: any;
  onLogout: () => void;
  isolatedPort?: string | null;
  children: React.ReactNode;
}

export const CommandDeckShell: React.FC<CommandDeckShellProps> = ({
  currentRole,
  currentTab,
  onSelectTab,
  onSwitchRole,
  currentUser,
  onLogout,
  isolatedPort,
  children
}) => {
  const [isRailExpanded, setIsRailExpanded] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] dark:bg-[#1A2215]">
      {/* Column 1: Structural Navigation Rail */}
      <StructuralRailNav
        currentRole={currentRole}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isExpanded={isRailExpanded}
        onToggleExpand={() => setIsRailExpanded(!isRailExpanded)}
        onLogout={onLogout}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#F8F9FA] dark:bg-[#1A2215]">
        <HeaderBar
          currentUser={currentUser}
          currentRole={currentRole}
          onSwitchRole={onSwitchRole}
          isolatedPort={isolatedPort}
        />

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full relative">
          {children}
        </div>
      </div>

      {/* Floating Bottom-Right Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Floating Chat Window Modal */}
        {isCopilotOpen && (
          <div 
            className="w-[370px] sm:w-[430px] h-[550px] max-h-[82vh] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border flex flex-col overflow-hidden animate-fade-in transition-all duration-300 border-[#DDE2D5] dark:border-[#2D4026] bg-white dark:bg-[#171F13] z-50"
          >
            <DockedCopilotDrawer
              isDocked={false}
              onToggleDock={() => setIsCopilotOpen(false)}
              currentUser={currentUser}
              onSelectTab={onSelectTab}
            />
          </div>
        )}

        {/* Floating Bot Action Button (FAB) - Prominent Circular ("Gol") Design */}
        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className="group relative flex items-center justify-center rounded-full shadow-2xl hover:shadow-[0_12px_36px_rgba(45,106,79,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-white shrink-0"
          style={{
            width: '64px',
            height: '64px',
            minWidth: '64px',
            minHeight: '64px',
            background: isCopilotOpen 
              ? 'linear-gradient(135deg, #1F291E 0%, #111827 100%)' 
              : 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
            boxShadow: '0 10px 30px rgba(45, 106, 79, 0.45)',
            border: '2.5px solid rgba(255, 255, 255, 0.35)'
          }}
          title={isCopilotOpen ? 'Close AI Chatbot' : 'Open AI Chatbot'}
          aria-label={isCopilotOpen ? 'Close AI Chatbot' : 'Open AI Chatbot'}
        >
          {isCopilotOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-200" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-80" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white shadow-xs" />
              </span>
            </div>
          )}

          {/* Elegant Tooltip on hover */}
          <span 
            className="absolute right-[76px] text-xs font-bold px-3.5 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700/60 backdrop-blur-xs flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isCopilotOpen ? 'Close Assistant' : 'AI Clinical Copilot'}</span>
          </span>
        </button>
      </div>
    </div>
  );
};
