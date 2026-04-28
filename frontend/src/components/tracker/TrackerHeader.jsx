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

const PERIOD_LABELS = {
  day: { singular: 'day', plural: 'days' },
  week: { singular: 'week', plural: 'weeks' },
  month: { singular: 'month', plural: 'months' },
  year: { singular: 'year', plural: 'years' }
};

const formatScheduleLabel = (tracker) => {
  const interval = Math.max(1, Number(tracker.units_per_interval || 1));
  const period = PERIOD_LABELS[tracker.units_per] || PERIOD_LABELS.day;
  const periodLabel = interval === 1 ? period.singular : period.plural;

  if (tracker.type === 'boolean') {
    return interval === 1
      ? `${period.singular.charAt(0).toUpperCase() + period.singular.slice(1)} Habit`
      : `Habit every ${interval} ${periodLabel}`;
  }

  return `${tracker.units_per_amount} ${tracker.unit} / ${interval} ${periodLabel}`;
};

function TrackerHeader({
  selectedTracker,
  canManageTracker,
  dailyProgress,
  setIsSidebarOpen,
  setSelectedCategory,
  setIsLogModalOpen,
  setLogFormData,
  onQuickBooleanLog,
  handleResetTracker,
  toggleTrackerStatus,
  openTrackerModal,
  deleteTracker
}) {
  const ownerOnlyButtonClass = canManageTracker
    ? 'bg-white border border-gray-200 text-stone-700 hover:bg-gray-50'
    : 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed';

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
              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800"
            >
              {selectedTracker.type}
            </span>
            {selectedTracker.group_id && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                Shared {selectedTracker.participant_count ? `· ${selectedTracker.participant_count} members` : ''}
              </span>
            )}
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
                ? formatScheduleLabel(selectedTracker)
                : selectedTracker.type === 'quit'
                  ? `Avoid ${formatScheduleLabel(selectedTracker)}`
                  : `Goal: ${formatScheduleLabel(selectedTracker)}`}
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
          {selectedTracker.type === 'boolean' && dailyProgress.total < dailyProgress.target && (
            <button
              onClick={onQuickBooleanLog}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors mr-2"
            >
              <CheckCircle2 size={16} /> Mark as Done
            </button>
          )}
          {selectedTracker.type === 'quit' && (
            <button
              onClick={() => handleResetTracker(selectedTracker.id)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors mr-2"
            >
              <RotateCcw size={16} /> Log Relapse
            </button>
          )}
          <button
            onClick={() => {
              if (canManageTracker) {
                toggleTrackerStatus(selectedTracker);
              }
            }}
            disabled={!canManageTracker}
            title={!canManageTracker ? 'Owner only' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${ownerOnlyButtonClass}`}
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
            onClick={() => {
              if (canManageTracker) {
                openTrackerModal(selectedTracker);
              }
            }}
            disabled={!canManageTracker}
            title={!canManageTracker ? 'Owner only' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${ownerOnlyButtonClass}`}
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={() => {
              if (canManageTracker) {
                deleteTracker(selectedTracker.id);
              }
            }}
            disabled={!canManageTracker}
            title={!canManageTracker ? 'Owner only' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              canManageTracker
                ? 'bg-white border border-gray-200 text-stone-900 hover:bg-gray-50'
                : 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </header>
  );
}

export default TrackerHeader;