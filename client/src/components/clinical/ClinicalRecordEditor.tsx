import React, { useState } from 'react';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { MedicationItem } from './PrescriptionDiffViewer';

interface ClinicalRecordEditorProps {
  appointmentId: string;
  patientId: string;
  patientName: string;
  initialDiagnosis?: string;
  initialChiefComplaint?: string;
  initialExamination?: string;
  initialTreatment?: string;
  initialPrivateNotes?: string;
  isEditMode?: boolean;
  onSave: (recordData: any) => Promise<void>;
}

export const ClinicalRecordEditor: React.FC<ClinicalRecordEditorProps> = ({
  appointmentId,
  patientId,
  patientName,
  initialDiagnosis = '',
  initialChiefComplaint = '',
  initialExamination = '',
  initialTreatment = '',
  initialPrivateNotes = '',
  isEditMode = false,
  onSave
}) => {
  const [chiefComplaint, setChiefComplaint] = useState(initialChiefComplaint);
  const [examinationNotes, setExaminationNotes] = useState(initialExamination);
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
  const [treatmentPlan, setTreatmentPlan] = useState(initialTreatment);
  const [privateNotes, setPrivateNotes] = useState(initialPrivateNotes);
  const [editReason, setEditReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Medications state
  const [medications, setMedications] = useState<MedicationItem[]>([
    { name: '', dosage: '', frequency: 'Once Daily', duration: '7 Days', instructions: '' }
  ]);

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      { name: '', dosage: '', frequency: 'Once Daily', duration: '7 Days', instructions: '' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof MedicationItem, value: string) => {
    setMedications(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && !editReason.trim()) {
      alert('Mandatory Rule: Reason for clinical modification is required for immutable audit capture.');
      return;
    }

    setLoading(true);
    try {
      const validMeds = medications
        .filter(m => m.name && m.name.trim() !== '')
        .map(m => ({
          name: m.name.trim(),
          dosage: m.dosage?.trim() || 'As directed',
          frequency: m.frequency?.trim() || 'Once Daily',
          duration: m.duration?.trim() || '7 Days',
          instructions: m.instructions?.trim() || ''
        }));

      await onSave({
        appointmentId: appointmentId || undefined,
        patientId,
        chiefComplaint: chiefComplaint?.trim() || 'General clinical consultation',
        examinationNotes: examinationNotes?.trim() || 'Routine examination completed',
        diagnosis: diagnosis?.trim() || 'Clinical evaluation',
        treatmentPlan: treatmentPlan?.trim() || 'Follow prescribed medical advice',
        privateNotes,
        editReason: isEditMode ? editReason : undefined,
        medications: validMeds
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-brand-300 rounded-lg p-5 shadow-subtle-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-brand-300">
        <div>
          <h3 className="operational-sub-header">
            {isEditMode ? 'Modify Clinical Record' : 'Active Consultation Clinical Entry'}
          </h3>
          <p className="text-xs text-brand-600">Patient: <strong className="text-brand-900">{patientName}</strong></p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="clinical-button-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving to Vault...' : isEditMode ? 'Commit Revision' : 'Save & Issue Rx'}</span>
        </button>
      </div>

      {isEditMode && (
        <div className="bg-red-50 border border-red-200 p-3 rounded text-xs space-y-1">
          <label className="font-bold text-red-900 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Mandatory Clinical Edit Rationale (Captured into Immutable Audit Log)
          </label>
          <input
            type="text"
            required
            value={editReason}
            onChange={e => setEditReason(e.target.value)}
            placeholder="e.g. Corrected BP reading following post-exercise resting interval"
            className="w-full clinical-input text-xs"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="operational-metadata-tag block mb-1">Chief Complaint</label>
          <textarea
            required
            rows={3}
            value={chiefComplaint}
            onChange={e => setChiefComplaint(e.target.value)}
            placeholder="Primary symptoms and duration reported by patient..."
            className="w-full clinical-input"
          />
        </div>

        <div>
          <label className="operational-metadata-tag block mb-1">Examination Findings</label>
          <textarea
            required
            rows={3}
            value={examinationNotes}
            onChange={e => setExaminationNotes(e.target.value)}
            placeholder="Vitals, physical auscultation, dermoscopy, etc..."
            className="w-full clinical-input"
          />
        </div>

        <div>
          <label className="operational-metadata-tag block mb-1">Clinical Diagnosis</label>
          <textarea
            required
            rows={3}
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="Primary diagnostic assessment..."
            className="w-full clinical-input"
          />
        </div>

        <div>
          <label className="operational-metadata-tag block mb-1">Treatment Plan & Directives</label>
          <textarea
            required
            rows={3}
            value={treatmentPlan}
            onChange={e => setTreatmentPlan(e.target.value)}
            placeholder="Therapeutic plan, follow-up timeline..."
            className="w-full clinical-input"
          />
        </div>
      </div>

      {/* Doctor Private Notes (Redacted at API layer) */}
      <div className="bg-brand-50 border border-brand-300 p-3.5 rounded-lg">
        <div className="flex items-center justify-between mb-1.5">
          <label className="operational-metadata-tag flex items-center gap-1.5">
            <span>Doctor Internal / Private Notes</span>
            <span className="bg-brand-300/50 text-brand-900 px-1.5 py-0.2 rounded text-[10px]">
              API-REDACTED FROM PATIENT & RECEPTIONIST
            </span>
          </label>
        </div>
        <textarea
          rows={2}
          value={privateNotes}
          onChange={e => setPrivateNotes(e.target.value)}
          placeholder="Confidential observations, differential hypotheses, or sensitive psychological flags..."
          className="w-full clinical-input bg-white text-xs"
        />
      </div>

      {/* Medication Prescriptions Builder */}
      {!isEditMode && (
        <div className="border border-brand-300 rounded-lg p-4 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="operational-metadata-tag">Prescription Builder (Generates Version 1)</span>
            <button
              type="button"
              onClick={handleAddMedication}
              className="text-xs font-semibold text-brand-900 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medication
            </button>
          </div>

          <div className="space-y-2.5">
            {medications.map((med, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-brand-50 p-2.5 rounded border border-brand-300 text-xs">
                <input
                  type="text"
                  placeholder="Drug Name (e.g. Lisinopril)"
                  value={med.name}
                  onChange={e => handleMedChange(idx, 'name', e.target.value)}
                  className="col-span-3 clinical-input text-xs py-1"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 10mg)"
                  value={med.dosage}
                  onChange={e => handleMedChange(idx, 'dosage', e.target.value)}
                  className="col-span-2 clinical-input text-xs py-1"
                />
                <input
                  type="text"
                  placeholder="Freq (e.g. Once Daily)"
                  value={med.frequency}
                  onChange={e => handleMedChange(idx, 'frequency', e.target.value)}
                  className="col-span-3 clinical-input text-xs py-1"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 30 Days)"
                  value={med.duration}
                  onChange={e => handleMedChange(idx, 'duration', e.target.value)}
                  className="col-span-3 clinical-input text-xs py-1"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedication(idx)}
                  className="col-span-1 text-red-600 hover:text-red-900 flex justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};
