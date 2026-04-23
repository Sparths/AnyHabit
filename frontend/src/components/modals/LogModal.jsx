function LogModal({ isOpen, setIsLogModalOpen, selectedTracker, logFormData, setLogFormData, handleLogSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="app-modal-card bg-white p-5 md:p-8 rounded-3xl shadow-xl w-[95%] max-w-sm border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h3 className="text-lg font-bold mb-1 text-stone-900">Log Activity</h3>
        <p className="text-sm text-gray-500 mb-5">Record your progress for {selectedTracker?.name}</p>
        <form onSubmit={handleLogSubmit}>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Amount ({selectedTracker?.unit}s)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={logFormData.amount}
              onChange={(e) => setLogFormData({ amount: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-stone-400 bg-stone-50 text-base font-medium text-stone-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogModal;
