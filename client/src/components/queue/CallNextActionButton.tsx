import React, { useState } from 'react';
import { Megaphone, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface CallNextActionButtonProps {
  onCallNext: () => Promise<any>;
  disabled?: boolean;
}

export const CallNextActionButton: React.FC<CallNextActionButtonProps> = ({
  onCallNext,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [lastSummoned, setLastSummoned] = useState<{ token: number; name: string } | null>(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await onCallNext();
      if (result) {
        setLastSummoned({
          token: result.tokenNumber,
          name: result.patientName
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="relative group active:scale-[0.98] text-white px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(45, 106, 79, 0.25)' }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white/80" />
        ) : (
          <Megaphone className="w-4 h-4 group-hover:scale-110 transition-transform text-white" />
        )}
        <span>Call Next Patient</span>
      </button>

      {lastSummoned && (
        <div 
          className="flex items-center gap-2 border px-3.5 py-2 rounded-xl text-xs font-medium animate-fade-in shadow-xs"
          style={{ backgroundColor: '#E8F3EB', borderColor: '#A7D7C5', color: '#1B4332' }}
        >
          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
          <span>Summoned: <strong className="font-mono font-bold text-[#1B4332]">#{String(lastSummoned.token).padStart(2, '0')}</strong> ({lastSummoned.name})</span>
        </div>
      )}
    </div>
  );
};
