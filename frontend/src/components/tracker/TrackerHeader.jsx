import {
  Target,
  Calendar,
  PlusCircle,
  CheckCircle2,
  RotateCcw,
  Pause,
  Play,
  Pencil,
  Trash2,
  Menu
} from 'lucide-react';

function TrackerHeader({
  selectedTracker,
  dailyProgress,
  setIsSidebarOpen,
  setSelectedCategory,
  setIsLogModalOpen,
  setLogFormData,
  API_URL,
  fetchHabitLogs,
  handleResetTracker,
  toggleTrackerStatus,
  openTrackerModal,
  deleteTracker
}) {
  return (
    <header className="px-4 md:px-10 pt-6 md:pt-10 pb-6 flex flex-col">
      <div className="flex flex-col xl:flex-row justify-between items-start w-full gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-stone-500 hover:text-stone-900 mr-1">
              <Menu size={24} />
            </button>

            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedTracker.name}</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory((selectedTracker.category || 'General').trim() || 'General');
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              {(selectedTracker.category || 'General').trim() || 'General'}
            </button>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                selectedTracker.type === 'quit' ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {selectedTracker.type}
            </span>
            {!selectedTracker.is_active && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">
                Stopped
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-3">
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Target size={14} />
              {selectedTracker.type === 'boolean'
                ? `${selectedTracker.units_per.charAt(0).toUpperCase() + selectedTracker.units_per.slice(1)} Habit`
                : selectedTracker.type === 'quit'
                  ? `Avoid ${selectedTracker.units_per_amount} ${selectedTracker.unit} / ${selectedTracker.units_per}`
                  : `Goal: ${selectedTracker.units_per_amount} ${selectedTracker.unit} / ${selectedTracker.units_per}`}
            </p>
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              Started:{' '}
              {new Date(
                selectedTracker.start_date.endsWith('Z')
                  ? selectedTracker.start_date
                  : `${selectedTracker.start_date}Z`
              ).toLocaleDateString()}
              &ensp;
              {new Date(
                selectedTracker.start_date.endsWith('Z')
                  ? selectedTracker.start_date
                  : `${selectedTracker.start_date}Z`
              ).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {selectedTracker.type === 'build' && (
            <button
              onClick={() => {
                setLogFormData({ amount: 1, timestamp: new Date().toISOString() });
                setIsLogModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors mr-2"
            >
              <PlusCircle size={16} /> Log Activity
            </button>
          )}
          {selectedTracker.type === 'boolean' && dailyProgress.total < 1 && (
            <button
              onClick={async () => {
                const timestamp = new Date().toISOString();
                await fetch(`${API_URL}/trackers/${selectedTracker.id}/logs/?timestamp=${encodeURIComponent(timestamp)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ amount: 1.0 })
                });
                fetchHabitLogs(selectedTracker.id);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors mr-2"
            >
              <CheckCircle2 size={16} /> Mark as Done
            </button>
          )}
          {selectedTracker.type === 'quit' && (
            <button
              onClick={() => handleResetTracker(selectedTracker.id)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-sm font-medium transition-colors mr-2"
            >
              <RotateCcw size={16} /> Log Relapse
            </button>
          )}
          <button
            onClick={() => toggleTrackerStatus(selectedTracker)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-stone-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
          >
            {selectedTracker.is_active ? (
              <>
                <Pause size={16} /> Pause
              </>
            ) : (
              <>
                <Play size={16} /> Resume
              </>
            )}
          </button>
          <button
            onClick={() => openTrackerModal(selectedTracker)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-stone-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={() => deleteTracker(selectedTracker.id)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </header>
  );
}

export default TrackerHeader;
