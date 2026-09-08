import React, { useState } from 'react';
import { ClinicalRecordEditor } from './ClinicalRecordEditor';
import { PrescriptionDiffViewer } from './PrescriptionDiffViewer';
import { FileText, PlusCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ConsultationWorkspaceProps {
  appointment: any;
  patientHistory?: any;
  onFinishConsultation: (recordData: any) => Promise<void>;
  onVersionPrescription?: (prescriptionId: string, medications: any[], reason: string) => Promise<void>;
  onBackToQueue: () => void;
}

export const ConsultationWorkspace: React.FC<ConsultationWorkspaceProps> = ({
  appointment,
  patientHistory,
  onFinishConsultation,
  onVersionPrescription,
  onBackToQueue
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'rx_diff'>('editor');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [newMedications, setNewMedications] = useState([
    { name: '', dosage: '', frequency: 'Once Daily', duration: '14 Days', instructions: '' }
  ]);
  const [revisionReason, setRevisionReason] = useState('');

  const currentPrescription = appointment?.clinicalRecords?.[0]?.prescriptions?.[0];

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-brand-300 shadow-subtle-card">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQueue}
            className="p-1.5 hover:bg-brand-100 rounded text-brand-600 hover:text-brand-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="screen-main-header text-xl">
                Consultation: {appointment.patientName}
              </span>
              <span className="font-mono font-bold text-sm bg-brand-50 text-brand-900 px-2 py-0.5 rounded border border-brand-300">
                Token #{String(appointment.tokenNumber).padStart(2, '0')}
              </span>
            </div>
            <p className="text-xs text-brand-600">
              CNIC: {appointment.patientCnic || '35201-1234567-1'} • Service: {appointment.serviceName}
            </p>
          </div>
        </div>

        {/* Workspace Tab Switcher */}
        <div className="flex items-center gap-1 bg-brand-50 p-1 rounded border border-brand-300 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'editor' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-600 hover:text-brand-900'
            }`}
          >
            Clinical Form
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'history' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-600 hover:text-brand-900'
            }`}
          >
            Past Records ({patientHistory?.records?.length || 0})
          </button>
          {currentPrescription && (
            <button
              onClick={() => setActiveTab('rx_diff')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'rx_diff' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-600 hover:text-brand-900'
              }`}
            >
              Rx Git Diff
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Active Clinical Record Editor */}
      {activeTab === 'editor' && (
        <ClinicalRecordEditor
          appointmentId={appointment.appointmentId || appointment.id}
          patientId={appointment.patientId}
          patientName={appointment.patientName}
          onSave={onFinishConsultation}
        />
      )}

      {/* Tab 2: Permitted Patient Medical History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-brand-300 rounded-lg p-5">
            <h3 className="operational-sub-header font-extrabold mb-4">Permitted Longitudinal History</h3>

            <div className="space-y-4">
              {patientHistory?.records?.map((record: any) => (
                <div key={record.id} className="border border-brand-300/80 rounded-lg p-4 bg-brand-50/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-300/60 font-semibold">
                    <span className="text-brand-900">{record.diagnosis}</span>
                    <span className="text-brand-600 font-mono">{record.createdAt.split('T')[0]}</span>
                  </div>
                  <div><strong>Complaint:</strong> {record.chiefComplaint}</div>
                  <div><strong>Examination:</strong> {record.examinationNotes}</div>
                  <div><strong>Treatment:</strong> {record.treatmentPlan}</div>
                  {record.privateNotes && (
                    <div className="p-2 bg-yellow-50/80 border border-yellow-200 rounded text-brand-900 italic">
                      <strong>Private Note:</strong> {record.privateNotes}
                    </div>
                  )}
                </div>
              ))}

              {(!patientHistory?.records || patientHistory.records.length === 0) && (
                <div className="text-center py-6 text-xs text-brand-600">
                  No prior clinical records recorded for this patient.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Prescription Git-Style Diff */}
      {activeTab === 'rx_diff' && currentPrescription && (
        <PrescriptionDiffViewer
          prescriptionId={currentPrescription.id}
          versions={currentPrescription.versions || []}
        />
      )}
    </div>
  );
};
