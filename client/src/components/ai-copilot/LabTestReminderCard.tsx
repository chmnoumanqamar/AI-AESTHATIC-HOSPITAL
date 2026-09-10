import React from 'react';
import { FlaskConical, AlertCircle, CheckCircle2, UploadCloud, ChevronRight } from 'lucide-react';

interface LabTestReminderCardProps {
  cardData: {
    totalAssigned?: number;
    pendingCount?: number;
    tests?: Array<{
      id: string;
      name: string;
      doctor: string;
      assignedDate: string;
      dueDate: string;
      instructions: string;
      status: string;
    }>;
    primaryTest?: any;
  };
  onActionClick: (prompt: string) => void;
  onOpenUpload?: () => void;
}

export const LabTestReminderCard: React.FC<LabTestReminderCardProps> = ({
  cardData,
  onActionClick,
  onOpenUpload
}) => {
  const tests = cardData.tests || (cardData.primaryTest ? [cardData.primaryTest] : []);
  if (tests.length === 0) return null;

  return (
    <div className="my-2 space-y-2">
      {tests.map(test => {
        const isPending = test.status === 'ASSIGNED' || test.status === 'PENDING_SAMPLE';

        return (
          <div
            key={test.id}
            className="p-3 rounded-2xl bg-white dark:bg-[#1A2518] border border-amber-300 dark:border-amber-800/60 shadow-xs space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-amber-100">
                    {test.name}
                  </h4>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Prescribed by Dr. <strong>{test.doctor}</strong>
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isPending
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
              }`}>
                {isPending ? '⚠️ Test Required' : 'Completed'}
              </span>
            </div>

            {test.instructions && (
              <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 text-[10.5px] text-amber-900 dark:text-amber-200/90 flex items-start gap-1.5 border border-amber-200/60 dark:border-amber-900/40">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>{test.instructions}</span>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-[10.5px] gap-2 flex-wrap">
              <span className="text-slate-400 dark:text-slate-500">
                Due: <strong>{test.dueDate}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                {onOpenUpload && (
                  <button
                    onClick={onOpenUpload}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <UploadCloud className="w-3 h-3" />
                    <span>Upload Report (+)</span>
                  </button>
                )}

                <button
                  onClick={() => onActionClick(`I have completed the ${test.name} test at the lab`)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#23311E] dark:hover:bg-[#2A3B24] text-slate-700 dark:text-emerald-300 font-medium text-[10px] transition-colors cursor-pointer"
                >
                  Mark Done
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
