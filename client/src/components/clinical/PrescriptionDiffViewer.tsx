import React from 'react';
import { GitCommit, GitBranch, ArrowRight, CheckCircle2, History, AlertCircle } from 'lucide-react';

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PrescriptionVersionView {
  id: string;
  versionNumber: number;
  doctorId: string;
  doctorName?: string;
  medicationsJson: MedicationItem[];
  correctionReason?: string;
  isCurrent: boolean;
  createdAt: string;
}

interface PrescriptionDiffViewerProps {
  versions: PrescriptionVersionView[];
  prescriptionId: string;
}

export const PrescriptionDiffViewer: React.FC<PrescriptionDiffViewerProps> = ({
  versions,
  prescriptionId
}) => {
  // Sort versions by version number ascending
  const sorted = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const currentVersion = sorted.find(v => v.isCurrent) || sorted[sorted.length - 1];
  const previousVersion = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  return (
    <div className="bg-white border border-brand-300 rounded-lg p-5 shadow-subtle-card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-300">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-brand-900" />
          <div>
            <h3 className="operational-sub-header font-extrabold">Prescription Immutable Version Diff</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="operational-metadata-tag bg-brand-100 px-2 py-1 rounded">
            Rx #{prescriptionId.slice(0, 8)}
          </span>
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded border" style={{ backgroundColor: '#EAECE2', borderColor: '#C2C5AA', color: '#333D29' }}>
            Current: v{currentVersion?.versionNumber || 1}
          </span>
        </div>
      </div>

      {/* Mandatory Correction Reason Banner (if revision exists) */}
      {currentVersion?.correctionReason && (
        <div className="bg-brand-50 border border-brand-300 rounded-lg p-3.5 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-brand-900 mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-brand-900 uppercase tracking-wider text-[10px]">
              Clinical Revision Rationale (v{currentVersion.versionNumber})
            </span>
            <p className="text-brand-900 font-medium italic">
              "{currentVersion.correctionReason}"
            </p>
          </div>
        </div>
      )}

      {/* Git-Style Side-by-Side Diff View */}
      {previousVersion ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Previous Version (Superseded with Strikethrough) */}
          <div className="border border-red-200 bg-red-50/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-red-200 text-xs">
              <span className="font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                v{previousVersion.versionNumber} (Superseded)
              </span>
              <span className="text-[11px] text-red-700 font-mono">
                {new Date(previousVersion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="space-y-2">
              {previousVersion.medicationsJson.map((med, idx) => (
                <div key={idx} className="p-2.5 bg-white/80 rounded border border-red-200/80 text-xs line-through text-red-800 opacity-75">
                  <div className="font-bold">{med.name} — {med.dosage}</div>
                  <div className="text-[11px]">{med.frequency} • {med.duration}</div>
                  {med.instructions && <div className="text-[10px] italic">{med.instructions}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Current Version (Active with Highlight) */}
          <div className="border border-emerald-300 bg-emerald-50/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 text-xs">
              <span className="font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                v{currentVersion.versionNumber} (Active Current)
              </span>
              <span className="text-[11px] text-emerald-700 font-mono">
                {new Date(currentVersion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="space-y-2">
              {currentVersion.medicationsJson.map((med, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded border border-emerald-300 text-xs text-brand-900 shadow-sm">
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span>{med.name} — {med.dosage}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">NEW</span>
                  </div>
                  <div className="text-[11px] text-brand-600 font-medium">{med.frequency} • {med.duration}</div>
                  {med.instructions && <div className="text-[10px] text-brand-600 italic mt-0.5">{med.instructions}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Single Version Display (Initial v1) */
        <div className="border border-brand-300 rounded-lg p-4 space-y-3 bg-brand-50/40">
          <div className="flex items-center justify-between pb-2 border-b border-brand-300 text-xs">
            <span className="font-bold text-brand-900 uppercase tracking-wider">
              Version 1 (Initial Issue)
            </span>
            <span className="text-[11px] text-brand-600 font-mono">
              {currentVersion ? new Date(currentVersion.createdAt).toLocaleDateString() : ''}
            </span>
          </div>

          <div className="space-y-2">
            {currentVersion?.medicationsJson.map((med, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded border border-brand-300 text-xs text-brand-900">
                <div className="font-bold">{med.name} — {med.dosage}</div>
                <div className="text-[11px] text-brand-600">{med.frequency} • {med.duration}</div>
                {med.instructions && <div className="text-[10px] text-brand-600 italic">{med.instructions}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
