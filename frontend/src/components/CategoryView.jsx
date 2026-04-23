import { Menu } from 'lucide-react';

function CategoryView({
  selectedCategory,
  selectedCategoryTrackers,
  setIsSidebarOpen,
  setSelectedTrackerId
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-10 pt-6 md:pt-10 pb-10">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-stone-500 hover:text-stone-900">
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">{selectedCategory}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedCategoryTrackers.length} tracker{selectedCategoryTrackers.length === 1 ? '' : 's'} in this category.
          </p>
        </div>
      </div>

      {selectedCategoryTrackers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400">
          No trackers in this category.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {selectedCategoryTrackers.map((tracker) => (
              <li key={tracker.id} className="px-5 py-4 hover:bg-stone-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-stone-900 truncate">{tracker.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                          tracker.type === 'quit' ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {tracker.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                          tracker.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {tracker.is_active ? 'Active' : 'Stopped'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500">
                      <span>
                        {tracker.type === 'boolean'
                          ? `${tracker.units_per.charAt(0).toUpperCase() + tracker.units_per.slice(1)} Habit`
                          : `${tracker.type === 'quit' ? 'Avoid' : 'Goal'}: ${tracker.units_per_amount} ${tracker.unit} / ${tracker.units_per}`}
                      </span>
                      {tracker.type !== 'boolean' && (
                        <span>
                          Rate: {tracker.impact_amount} {tracker.impact_unit || '$'} / {tracker.impact_per}
                        </span>
                      )}
                      <span>
                        Started:{' '}
                        {new Date(
                          tracker.start_date.endsWith('Z') ? tracker.start_date : `${tracker.start_date}Z`
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTrackerId(tracker.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-stone-700 hover:bg-white hover:border-stone-300 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CategoryView;
