import { Medal, Users, Flame } from 'lucide-react';

function TrackerLeaderboard({ shareStats }) {
  if (!shareStats) return null;

  return (
    <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
            <Users size={16} /> Shared Progress
          </div>
          <p className="mt-1 text-xs text-gray-400">Compare the people assigned to this tracker.</p>
        </div>
        {shareStats.groupStreakStats && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Flame size={16} /> Group streak: {shareStats.groupStreakStats.current}
            </div>
            <div className="mt-1 text-xs text-stone-500">Rule: {shareStats.groupStreakStats.ruleLabel}</div>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shareStats.leaderboard.map((entry, index) => (
          <article key={entry.user.id} className="rounded-3xl border border-gray-100 bg-stone-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                  <Medal size={16} className={index === 0 ? 'text-amber-500' : 'text-stone-400'} />
                  {entry.user.username}
                </div>
                <p className="mt-1 text-xs text-stone-500">{entry.user.email}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-stone-900">{entry.streakStats.current}</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-stone-400">{entry.streakStats.periodLabel}</div>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-stone-600">
              <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                <span>Progress</span>
                <span className="font-medium text-stone-900">{entry.dailyProgress.percentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                <span>Completed</span>
                <span className="font-medium text-stone-900">
                  {entry.dailyProgress.total.toFixed(1)} / {entry.dailyProgress.target.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                <span>Impact</span>
                <span className="font-medium text-stone-900">{entry.currentMath.impactValue}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TrackerLeaderboard;
