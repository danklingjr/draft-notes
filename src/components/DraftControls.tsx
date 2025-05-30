import React, { useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { exportRosterToCSV } from '../services/exportService';

const DraftControls: React.FC = () => {
  const { clearDraft, myDraftedPlayers } = useDraft();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    if (showConfirm) {
      clearDraft();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  const handleExport = () => {
    exportRosterToCSV(myDraftedPlayers);
  };

  return (
    <div className="flex justify-end gap-2 p-2 bg-white border-b border-gray-200">
      <button
        onClick={handleExport}
        className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        Export
      </button>
      <button
        onClick={handleClear}
        className={`px-3 py-1 text-sm rounded ${
          showConfirm
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {showConfirm ? 'Confirm' : 'Clear'}
      </button>
    </div>
  );
};

export default DraftControls; 