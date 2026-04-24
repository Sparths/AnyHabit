import { CheckCircle2, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function TrackerCharts({
  selectedTracker,
  historicalChartData,
  buildHeatmap,
  habitLogs,
  deleteLog
}) {
  return (
    <>
      <div className="w-full mb-8 bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-4">
          <h3 className="text-sm font-semibold text-stone-700">Historical Progress</h3>
          <p className="text-xs text-gray-400">Last 120 days</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {selectedTracker.type === 'quit' ? (
              <LineChart data={historicalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" minTickGap={35} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#111827"
                  strokeWidth={2.5}
                  dot={false}
                  name="Streak Days"
                />
              </LineChart>
            ) : (
              <AreaChart data={historicalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" minTickGap={35} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#111827"
                  fill="url(#progressArea)"
                  strokeWidth={2.2}
                  name="Daily Amount"
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#6b7280"
                  strokeWidth={1.4}
                  dot={false}
                  name="Cumulative"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {selectedTracker.type === 'build' && buildHeatmap && (
        <div className="w-full mb-8 bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm overflow-x-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-4">
            <h3 className="text-sm font-semibold text-stone-700">Consistency Heatmap</h3>
            <p className="text-xs text-gray-400">Last 24 weeks</p>
          </div>

          <div className="flex gap-[3px] min-w-max">
            {buildHeatmap.columns.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="flex flex-col gap-[3px]">
                {week.map((cell) => {
                  const intensity = buildHeatmap.maxAmount > 0 ? cell.amount / buildHeatmap.maxAmount : 0;
                  const shade =
                    intensity === 0
                      ? 'bg-stone-100'
                      : intensity < 0.25
                        ? 'bg-emerald-100'
                        : intensity < 0.5
                          ? 'bg-emerald-200'
                          : intensity < 0.75
                            ? 'bg-emerald-300'
                            : 'bg-emerald-500';

                  return (
                    <div
                      key={cell.date}
                      title={`${cell.date}: ${cell.amount.toFixed(1)} ${selectedTracker.unit}`}
                      className={`w-3.5 h-3.5 rounded-[3px] border border-white/60 ${cell.isFiller ? 'opacity-0' : shade}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
            <span>Less</span>
            <span className="w-3.5 h-3.5 rounded-[3px] bg-stone-100 border border-white/60" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-100 border border-white/60" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-200 border border-white/60" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-300 border border-white/60" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-500 border border-white/60" />
            <span>More</span>
          </div>
        </div>
      )}

      {(selectedTracker.type === 'build' || selectedTracker.type === 'boolean') && habitLogs.length > 0 && (
        <div className="w-full mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {habitLogs.map((log) => (
              <div
                key={log.id}
                className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-4 group transition-all hover:border-gray-200"
              >
                <div>
                  <div className="font-medium text-stone-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-stone-400" />
                    {selectedTracker.type === 'boolean' ? 'Completed' : `${log.amount} ${selectedTracker.unit}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.timestamp.endsWith('Z') ? log.timestamp : `${log.timestamp}Z`).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default TrackerCharts;
