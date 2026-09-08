import React from 'react';
import { FrontDeskBillingPOS } from '../../components/receptionist/FrontDeskBillingPOS';

export const AdminHospitalLedger: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Embedded POS Ledger */}
      <FrontDeskBillingPOS />
    </div>
  );
};
