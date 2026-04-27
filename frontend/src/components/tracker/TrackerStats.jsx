import { TrendingUp, Activity, CheckCircle2, Flame, Coins } from 'lucide-react';

const PERIOD_LABELS = {
  day: { singular: 'day', plural: 'days' },
  week: { singular: 'week', plural: 'weeks' },
  month: { singular: 'month', plural: 'months' },
  year: { singular: 'year', plural: 'years' }
};

const formatWindowLabel = (tracker) => {
  const interval = Math.max(1, Number(tracker.units_per_interval || 1));
  const period = PERIOD_LABELS[tracker.units_per] || PERIOD_LABELS.day;
  const label = interval === 1 ? period.singular : period.plural;
  return interval === 1 ? `this ${label}` : `this ${interval} ${label}`;
};

function TrackerStats({ selectedTracker, dailyProgress, currentMath, streakStats }) {
  return (
    <div className="px-4 md:px-10 pb-10 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
            {selectedTracker.type === 'quit' ? <TrendingUp size={16} /> : <Activity size={16} />}
            {selectedTracker.type === 'quit' ? 'Avoided' : 'Accomplished'}
          </div>
          {selectedTracker.type === 'boolean' ? (
            <div className="mt-4 flex items-center gap-3">
              {dailyProgress.total >= dailyProgress.target ? (
                <div className="text-emerald-500 flex items-center gap-2 font-medium text-lg">
                  <CheckCircle2 size={24} /> Done for {formatWindowLabel(selectedTracker)}!
                </div>
              ) : (
                <div className="text-gray-400 font-medium text-lg">Not completed yet</div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-semibold tracking-tight">{currentMath.mainUnit}</div>
                <div className="text-lg text-gray-400 mb-1">{selectedTracker.unit}</div>
              </div>

              {selectedTracker.type === 'build' && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-stone-600">Current Window Progress</span>
                    <span className="text-stone-400">
                      {dailyProgress.total.toFixed(1)} / {dailyProgress.target.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-900 transition-all duration-500 ease-out"
                      style={{ width: `${dailyProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
            <Flame size={16} />
            Streaks
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="rounded-2xl bg-stone-50 border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wider font-semibold text-gray-400">Current</div>
              <div className="text-3xl font-semibold text-stone-900 mt-1">{streakStats.current}</div>
              <div className="text-xs text-gray-500 mt-1">{streakStats.periodLabel}</div>
            </div>
            <div className="rounded-2xl bg-stone-50 border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-wider font-semibold text-gray-400">Longest</div>
              <div className="text-3xl font-semibold text-stone-900 mt-1">{streakStats.longest}</div>
              <div className="text-xs text-gray-500 mt-1">{streakStats.periodLabel}</div>
            </div>
          </div>
        </div>

        {selectedTracker.impact_amount > 0 && selectedTracker.type !== 'boolean' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Coins size={16} />
                {selectedTracker.type === 'quit' ? 'Saved' : 'Impact'}
              </div>
              <div className="text-4xl font-semibold tracking-tight">
                {currentMath.impactValue} {selectedTracker.impact_unit || '$'}
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-4">
              Rate: {selectedTracker.impact_amount} {selectedTracker.impact_unit || '$'} / {selectedTracker.impact_per}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackerStats;
