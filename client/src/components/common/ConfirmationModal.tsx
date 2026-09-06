import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border border-brand-300 rounded-lg shadow-modal-pop overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-300 bg-brand-50">
          <div className="flex items-center gap-2 text-brand-900 font-semibold text-base">
            <AlertTriangle className={`w-5 h-5 ${isDestructive ? 'text-semantic-emergency' : 'text-brand-900'}`} />
            <span>{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-brand-600 hover:text-brand-900 p-1 rounded hover:bg-brand-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-brand-900 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3.5 bg-brand-50 border-t border-brand-300">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-600 hover:text-brand-900 hover:bg-brand-100 border border-brand-300 rounded transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white rounded transition-all shadow-sm ${
              isDestructive
                ? 'bg-semantic-emergency hover:bg-red-700'
                : 'bg-brand-900 hover:bg-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
