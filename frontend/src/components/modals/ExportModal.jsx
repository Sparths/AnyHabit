import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { exportDataApi } from '../../services/exportApi';

function ExportModal({ isOpen, setIsExportOpen, trackers }) {
  const [selectedTrackers, setSelectedTrackers] = useState([]);
  const [dataType, setDataType] = useState('all');
  const [exportFormat, setExportFormat] = useState('json');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleTrackerToggle = (trackerId) => {
    setSelectedTrackers((prev) =>
      prev.includes(trackerId) ? prev.filter((id) => id !== trackerId) : [...prev, trackerId]
    );
  };

  const handleSelectAllTrackers = () => {
    if (selectedTrackers.length === trackers.length) {
      setSelectedTrackers([]);
    } else {
      setSelectedTrackers(trackers.map((t) => t.id));
    }
  };

  const handleExport = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const trackerIds = dataType === 'specific' ? selectedTrackers : dataType === 'journals_only' ? [] : null;

      const data = await exportDataApi({
        data_type: dataType,
        format: exportFormat,
        tracker_ids: trackerIds
      });

      // Create blob and download
      const blob = new Blob([data], {
        type: exportFormat === 'json' ? 'application/json' : 'text/csv'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anyhabit-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to export data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const canExport = dataType !== 'specific' || selectedTrackers.length > 0;

  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="app-modal-card bg-white p-5 md:p-8 rounded-3xl shadow-xl w-[95%] max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-stone-900">Export Your Data</h3>
            <p className="text-sm text-gray-500 mt-1">Download your tracker data in your preferred format.</p>
          </div>
          <button
            onClick={() => setIsExportOpen(false)}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Data Type Selection */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What to Export</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="dataType"
                  value="all"
                  checked={dataType === 'all'}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-stone-900">All Data</span>
                <span className="text-xs text-gray-500 ml-auto">All trackers with logs & journals</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="dataType"
                  value="trackers_only"
                  checked={dataType === 'trackers_only'}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-stone-900">Trackers Only</span>
                <span className="text-xs text-gray-500 ml-auto">Tracker settings & logs</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="dataType"
                  value="journals_only"
                  checked={dataType === 'journals_only'}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-stone-900">Journals Only</span>
                <span className="text-xs text-gray-500 ml-auto">All journal entries</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="dataType"
                  value="specific"
                  checked={dataType === 'specific'}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-stone-900">Specific Trackers</span>
                <span className="text-xs text-gray-500 ml-auto">Choose which trackers</span>
              </label>
            </div>
          </div>

          {/* Tracker Selection */}
          {dataType === 'specific' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Trackers</h4>
              <button
                type="button"
                onClick={handleSelectAllTrackers}
                className="mb-3 text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
              >
                {selectedTrackers.length === trackers.length ? 'Deselect All' : 'Select All'} ({selectedTrackers.length}/{trackers.length})
              </button>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {trackers.map((tracker) => (
                  <label key={tracker.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedTrackers.includes(tracker.id)}
                      onChange={() => handleTrackerToggle(tracker.id)}
                      className="w-4 h-4"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate">{tracker.name}</p>
                      <p className="text-xs text-gray-500">{tracker.category}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Export Format</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900">JSON</p>
                  <p className="text-xs text-gray-500">Structured format, best for backup or re-import</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900">CSV</p>
                  <p className="text-xs text-gray-500">Spreadsheet format, good for analysis</p>
                </div>
              </label>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsExportOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport || isLoading}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                canExport && !isLoading
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download size={16} />
              {isLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
