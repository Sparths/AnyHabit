import { Menu, Sprout } from 'lucide-react';

function EmptyTrackerState({ setIsSidebarOpen }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white m-4 rounded-3xl border border-gray-50 relative">
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-6 left-6 md:hidden text-stone-500 hover:text-stone-900"
      >
        <Menu size={24} />
      </button>
      <Sprout size={48} strokeWidth={1} className="mb-4 text-gray-300" />
      <h2 className="text-lg font-medium text-stone-600">Select a tracker</h2>
      <p className="text-sm mt-1">or create a new one to get started.</p>
    </div>
  );
}

export default EmptyTrackerState;
