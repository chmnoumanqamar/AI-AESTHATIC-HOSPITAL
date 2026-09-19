import React, { useState, useEffect } from 'react';
import { StructuralRailNav } from './StructuralRailNav';
import { HeaderBar } from './HeaderBar';
import { DockedCopilotDrawer } from '../ai-copilot/DockedCopilotDrawer';
import { Bot, Sparkles, X } from 'lucide-react';
import { getStoredThemeColor, THEME_COLOR_OPTIONS, ThemeColorOption, getCurrentPalette } from '../../utils/themePalette';

interface CommandDeckShellProps {
  currentRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchRole: (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST') => void;
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
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Sync active theme palette for Chatbot FAB
  const [activePalette, setActivePalette] = useState<ThemeColorOption>(getCurrentPalette);

  // Custom OS-Style Window Resizing & Moving State
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem('hospital_copilot_dimensions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.width && parsed.height) {
          return {
            width: Math.min(Math.max(parsed.width, 360), window.innerWidth - 32),
            height: Math.min(Math.max(parsed.height, 420), window.innerHeight - 80)
          };
        }
      }
    } catch {}
    return {
      width: Math.min(440, window.innerWidth - 32),
      height: Math.min(600, window.innerHeight - 100)
    };
  });

  const [position, setPosition] = useState<{ bottom: number; right: number }>(() => {
    try {
      const saved = localStorage.getItem('hospital_copilot_position');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.bottom === 'number' && typeof parsed.right === 'number') {
          return {
            bottom: Math.max(16, Math.min(parsed.bottom, window.innerHeight - 200)),
            right: Math.max(16, Math.min(parsed.right, window.innerWidth - 200))
          };
        }
      }
    } catch {}
    return { bottom: 96, right: 24 };
  });

  // Persist size and position
  useEffect(() => {
    try {
      localStorage.setItem('hospital_copilot_dimensions', JSON.stringify(dimensions));
    } catch {}
  }, [dimensions]);

  useEffect(() => {
    try {
      localStorage.setItem('hospital_copilot_position', JSON.stringify(position));
    } catch {}
  }, [position]);

  // Window resize safety clamp
  useEffect(() => {
    const handleResize = () => {
      setDimensions(prev => ({
        width: Math.min(prev.width, window.innerWidth - 32),
        height: Math.min(prev.height, window.innerHeight - 80)
      }));
      setPosition(prev => ({
        bottom: Math.max(16, Math.min(prev.bottom, window.innerHeight - 200)),
        right: Math.max(16, Math.min(prev.right, window.innerWidth - 200))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, textarea')) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startBottom = position.bottom;
    const startRight = position.right;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const maxBottom = window.innerHeight - dimensions.height - 16;
      const maxRight = window.innerWidth - dimensions.width - 16;

      const newBottom = Math.max(16, Math.min(startBottom - deltaY, maxBottom));
      const newRight = Math.max(16, Math.min(startRight - deltaX, maxRight));

      setPosition({ bottom: newBottom, right: newRight });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

  const handleResizeStart = (direction: ResizeDirection, e: React.PointerEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    const startBottom = position.bottom;
    const startRight = position.right;

    const minWidth = 350;
    const maxWidth = Math.min(window.innerWidth - 32, 1200);
    const minHeight = 400;
    const maxHeight = Math.min(window.innerHeight - 60, 1000);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newBottom = startBottom;
      let newRight = startRight;

      // Vertical resizing
      if (direction.includes('n')) {
        newHeight = Math.min(Math.max(startHeight - deltaY, minHeight), maxHeight);
      } else if (direction.includes('s')) {
        const calculatedHeight = Math.min(Math.max(startHeight + deltaY, minHeight), maxHeight);
        const heightDiff = calculatedHeight - startHeight;
        newBottom = Math.max(16, startBottom - heightDiff);
        newHeight = calculatedHeight;
      }

      // Horizontal resizing
      if (direction.includes('w')) {
        newWidth = Math.min(Math.max(startWidth - deltaX, minWidth), maxWidth);
      } else if (direction.includes('e')) {
        const calculatedWidth = Math.min(Math.max(startWidth + deltaX, minWidth), maxWidth);
        const widthDiff = calculatedWidth - startWidth;
        newRight = Math.max(16, startRight - widthDiff);
        newWidth = calculatedWidth;
      }

      setDimensions({ width: newWidth, height: newHeight });
      setPosition({ bottom: newBottom, right: newRight });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    const handleColorEvent = (e: any) => {
      if (e.detail?.gradientStart) {
        setActivePalette(e.detail);
      }
    };
    window.addEventListener('hospital_theme_color_changed', handleColorEvent);
    return () => window.removeEventListener('hospital_theme_color_changed', handleColorEvent);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden window-canvas-bg bg-[#F8F9FA] dark:bg-[#1A2215]">
      {/* Column 1: Structural Navigation Rail */}
      <StructuralRailNav
        currentRole={currentRole}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isExpanded={isRailExpanded}
        onToggleExpand={() => setIsRailExpanded(!isRailExpanded)}
        onLogout={onLogout}
        currentUser={currentUser}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 window-canvas-bg bg-[#F8F9FA] dark:bg-[#1A2215]">
        <HeaderBar
          currentUser={currentUser}
          currentRole={currentRole}
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          onSwitchRole={onSwitchRole}
          isolatedPort={isolatedPort}
        />

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 max-w-[1720px] mx-auto w-full relative pb-4">
          {children}
        </div>
      </div>

      {/* Floating Chat Window Modal with 4-Edge & 4-Corner OS Resizing */}
      {isCopilotOpen && (
        <div 
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            bottom: `${position.bottom}px`,
            right: `${position.right}px`,
          }}
          className="fixed rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border flex flex-col overflow-hidden border-[#DDE2D5] dark:border-[#2D4026] bg-white dark:bg-[#171F13] z-50 animate-fade-in transition-[box-shadow,border-color]"
        >
          {/* Inner Drawer Content */}
          <div className="flex-1 h-full overflow-hidden">
            <DockedCopilotDrawer
              isDocked={false}
              onToggleDock={() => setIsCopilotOpen(false)}
              currentUser={currentUser}
              onSelectTab={onSelectTab}
              onHeaderMouseDown={handleHeaderMouseDown}
            />
          </div>

          {/* OS-Style Window Resize Handles (All 4 Edges + 4 Corners) */}
          {/* Top Border (North) */}
          <div
            onPointerDown={(e) => handleResizeStart('n', e)}
            className="absolute top-0 left-4 right-4 h-2.5 cursor-ns-resize z-50 hover:bg-emerald-500/25 active:bg-emerald-500/40 transition-colors"
            title="Drag to resize height"
          />
          {/* Bottom Border (South) */}
          <div
            onPointerDown={(e) => handleResizeStart('s', e)}
            className="absolute bottom-0 left-4 right-4 h-2.5 cursor-ns-resize z-50 hover:bg-emerald-500/25 active:bg-emerald-500/40 transition-colors"
            title="Drag to resize height"
          />
          {/* Left Border (West) */}
          <div
            onPointerDown={(e) => handleResizeStart('w', e)}
            className="absolute top-4 bottom-4 left-0 w-2.5 cursor-ew-resize z-50 hover:bg-emerald-500/25 active:bg-emerald-500/40 transition-colors"
            title="Drag to resize width"
          />
          {/* Right Border (East) */}
          <div
            onPointerDown={(e) => handleResizeStart('e', e)}
            className="absolute top-4 bottom-4 right-0 w-2.5 cursor-ew-resize z-50 hover:bg-emerald-500/25 active:bg-emerald-500/40 transition-colors"
            title="Drag to resize width"
          />

          {/* Top-Left Corner (North-West) */}
          <div
            onPointerDown={(e) => handleResizeStart('nw', e)}
            className="absolute top-0 left-0 w-5 h-5 cursor-nwse-resize z-50 hover:bg-emerald-500/35 active:bg-emerald-500/50 rounded-tl-3xl transition-colors"
            title="Drag to resize window"
          />
          {/* Top-Right Corner (North-East) */}
          <div
            onPointerDown={(e) => handleResizeStart('ne', e)}
            className="absolute top-0 right-0 w-5 h-5 cursor-nesw-resize z-50 hover:bg-emerald-500/35 active:bg-emerald-500/50 rounded-tr-3xl transition-colors"
            title="Drag to resize window"
          />
          {/* Bottom-Left Corner (South-West) */}
          <div
            onPointerDown={(e) => handleResizeStart('sw', e)}
            className="absolute bottom-0 left-0 w-5 h-5 cursor-nesw-resize z-50 hover:bg-emerald-500/35 active:bg-emerald-500/50 rounded-bl-3xl transition-colors"
            title="Drag to resize window"
          />
          {/* Bottom-Right Corner (South-East) */}
          <div
            onPointerDown={(e) => handleResizeStart('se', e)}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-50 hover:bg-emerald-500/35 active:bg-emerald-500/50 rounded-br-3xl transition-colors"
            title="Drag to resize window"
          />
        </div>
      )}

      {/* Floating Bottom-Right Chatbot Widget (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        {/* Floating Bot Action Button (FAB) - Prominent Circular ("Gol") Design */}
        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className={`group relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-white shrink-0 chatbot-fab-button ${
            isCopilotOpen ? 'is-open' : ''
          }`}
          style={{
            width: '64px',
            height: '64px',
            minWidth: '64px',
            minHeight: '64px',
            background: isCopilotOpen 
              ? 'linear-gradient(135deg, #1F291E 0%, #111827 100%)' 
              : `linear-gradient(135deg, ${activePalette.gradientStart} 0%, ${activePalette.gradientEnd} 100%)`,
            boxShadow: isCopilotOpen 
              ? '0 10px 30px rgba(0, 0, 0, 0.45)' 
              : `0 10px 30px ${activePalette.gradientStart}66`,
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
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-80" 
                  style={{ backgroundColor: activePalette.hoverStart }}
                />
                <span 
                  className="relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-xs" 
                  style={{ backgroundColor: activePalette.gradientStart }}
                />
              </span>
            </div>
          )}

          {/* Elegant Tooltip on hover */}
          <span 
            className="absolute right-[76px] text-xs font-bold px-3.5 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700/60 backdrop-blur-xs flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: activePalette.hoverStart }} />
            <span>{isCopilotOpen ? 'Close Assistant' : 'AI Clinical Copilot'}</span>
          </span>
        </button>
      </div>
    </div>
  );
};
