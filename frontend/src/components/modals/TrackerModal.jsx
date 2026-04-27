import { ChevronDown } from 'lucide-react';

function TrackerModal({
  isOpen,
  setIsTrackerModalOpen,
  trackerFormData,
  setTrackerFormData,
  handleTrackerSubmit,
  categoryMenuRef,
  typeMenuRef,
  isCategoryMenuOpen,
  setIsCategoryMenuOpen,
  isCreatingCategory,
  setIsCreatingCategory,
  existingCategories,
  isTypeMenuOpen,
  setIsTypeMenuOpen,
  trackerTypeOptions
}) {
  if (!isOpen) return null;

  const selectedTypeLabel =
    trackerTypeOptions.find((typeOption) => typeOption.value === trackerFormData.type)?.label || 'Quit';

  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="app-modal-card bg-white p-5 md:p-8 rounded-3xl shadow-xl w-[95%] max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h3 className="text-xl font-bold mb-6 text-stone-900">
          {trackerFormData.id ? 'Edit Tracker' : 'New Tracker'}
        </h3>

        <form onSubmit={handleTrackerSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              required
              value={trackerFormData.name}
              onChange={(e) => setTrackerFormData({ ...trackerFormData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
            <div className="space-y-2" ref={categoryMenuRef}>
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm flex items-center justify-between text-stone-800"
              >
                <span className="truncate text-left">
                  {isCreatingCategory ? 'Create new category' : trackerFormData.category || 'General'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isCategoryMenuOpen && (
                <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <ul className="max-h-48 overflow-y-auto py-1">
                    {existingCategories.map((category) => (
                      <li key={category}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingCategory(false);
                            setTrackerFormData({ ...trackerFormData, category });
                            setIsCategoryMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            trackerFormData.category === category && !isCreatingCategory
                              ? 'bg-stone-100 text-stone-900'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(true);
                          setTrackerFormData({ ...trackerFormData, category: '' });
                          setIsCategoryMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 border-t border-gray-100"
                      >
                        + Create new category
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {isCreatingCategory && (
                <input
                  type="text"
                  required
                  value={trackerFormData.category}
                  onChange={(e) => setTrackerFormData({ ...trackerFormData, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                  placeholder="e.g. Health"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
              <div className="space-y-2" ref={typeMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsTypeMenuOpen((prev) => !prev)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm flex items-center justify-between text-stone-800"
                >
                  <span className="truncate text-left">{selectedTypeLabel}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isTypeMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isTypeMenuOpen && (
                  <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {trackerTypeOptions.map((typeOption) => (
                        <li key={typeOption.value}>
                          <button
                            type="button"
                            onClick={() => {
                              setTrackerFormData({ ...trackerFormData, type: typeOption.value });
                              setIsTypeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              trackerFormData.type === typeOption.value
                                ? 'bg-stone-100 text-stone-900'
                                : 'text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            {typeOption.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Unit</label>
              <input
                type="text"
                required
                value={trackerFormData.unit}
                onChange={(e) => setTrackerFormData({ ...trackerFormData, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                placeholder="e.g. Pages"
              />
            </div>
          </div>

          {trackerFormData.type === 'boolean' ? (
            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Frequency</label>
              <div className="space-y-3">
                <select
                  value={trackerFormData.units_per}
                  onChange={(e) => setTrackerFormData({ ...trackerFormData, units_per: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Every N Periods
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={trackerFormData.units_per_interval}
                    onChange={(e) =>
                      setTrackerFormData({ ...trackerFormData, units_per_interval: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                    placeholder="e.g. 3"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {trackerFormData.type === 'quit' ? 'Usage to Avoid' : 'Target Goal'}
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={trackerFormData.units_per_amount}
                  onChange={(e) => setTrackerFormData({ ...trackerFormData, units_per_amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                />
                <div className="flex items-center text-sm text-gray-400">per</div>
                <select
                  value={trackerFormData.units_per}
                  onChange={(e) => setTrackerFormData({ ...trackerFormData, units_per: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Every N Periods
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={trackerFormData.units_per_interval}
                  onChange={(e) =>
                    setTrackerFormData({ ...trackerFormData, units_per_interval: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                  placeholder="e.g. 3"
                />
              </div>
            </div>
          )}

          {trackerFormData.type !== 'boolean' && (
            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Secondary Impact
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={trackerFormData.impact_amount}
                  onChange={(e) => setTrackerFormData({ ...trackerFormData, impact_amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={trackerFormData.impact_unit}
                  onChange={(e) => setTrackerFormData({ ...trackerFormData, impact_unit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                  placeholder="Unit (e.g. kg CO2)"
                />
                <div className="flex items-center text-sm text-gray-400">per</div>
                <select
                  value={trackerFormData.impact_per}
                  onChange={(e) => setTrackerFormData({ ...trackerFormData, impact_per: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6 pt-2">
            <button
              type="button"
              onClick={() => setIsTrackerModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TrackerModal;
