import { Plus, Settings, ChevronDown, Home, X, Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';

function Sidebar({ isHomeActive }) {
  const navigate = useNavigate();
  const {
    user,
    isSidebarOpen,
    setIsSidebarOpen,
    trackers,
    sortedCategoryEntries,
    activeCategory,
    collapsedCategories,
    setCollapsedCategories,
    selectedTrackerId,
    openTrackerModal,
    setIsSettingsOpen,
    setIsExportOpen,
    setSelectedCategory,
    setSelectedTrackerId
  } = useAppState();
  const [trackerTab, setTrackerTab] = useState('all');

  const openHome = () => {
    setSelectedTrackerId(null);
    setSelectedCategory(null);
    setIsSidebarOpen(false);
    navigate('/');
  };

  const openCategory = (category) => {
    setSelectedCategory(category);
    setSelectedTrackerId(null);
    setIsSidebarOpen(false);
    navigate(`/category/${encodeURIComponent(category)}`);
  };

  const openTracker = (trackerId, category) => {
    if (category) {
      setSelectedCategory(category);
    }
    setSelectedTrackerId(trackerId);
    setIsSidebarOpen(false);
    navigate(`/tracker/${trackerId}`);
  };

  const privateTrackers = trackers.filter((t) => !t.group_id);
  const groupTrackers = trackers.filter((t) => t.group_id);
  const displayedTrackers = trackerTab === 'private' ? privateTrackers : trackerTab === 'groups' ? groupTrackers : trackers;

  const filteredSortedEntries = sortedCategoryEntries
    .map(([category, items]) => [category, items.filter((item) => displayedTrackers.some((t) => t.id === item.id))])
    .filter(([category, items]) => items.length > 0);

  return (
    <div
      className={`app-sidebar w-72 border-r border-gray-100 p-6 bg-white flex flex-col z-50 fixed inset-y-0 left-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={openHome}
          className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-stone-50 transition-colors"
        >
          <img src="/AnyHabit.png" alt="AnyHabit Logo" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="text-xl font-bold tracking-tight">AnyHabit</h1>
        </button>
        <div className="flex items-center gap-2">
          <button className="md:hidden text-gray-400 hover:text-stone-900" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          openHome();
        }}
        className={`mb-6 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          isHomeActive ? 'bg-stone-100 text-stone-900' : 'text-gray-500 hover:bg-gray-100 hover:text-stone-800'
        }`}
      >
        <Home size={16} />
        <span>Home</span>
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trackers</h2>
        <button
          onClick={() => openTrackerModal()}
          className="text-gray-400 hover:text-stone-900 transition-colors flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>

      {trackers.length > 0 && (
        <div className="flex gap-1 mb-4">
          {['all', 'private', 'groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setTrackerTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                trackerTab === tab
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'private' ? 'Private' : 'Groups'}
              {tab === 'private' && ` (${privateTrackers.length})`}
              {tab === 'groups' && ` (${groupTrackers.length})`}
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-4 flex-1 overflow-y-auto pr-1">
        {displayedTrackers.length === 0 ? (
          <li className="text-sm text-gray-400 text-center mt-6">No trackers yet.</li>
        ) : (
          filteredSortedEntries.map(([category, items]) => (
            <li key={category} className="pb-1">
                <div
                  className={`flex items-center gap-1 mb-2 rounded-lg px-1 py-0.5 transition-colors ${
                    activeCategory === category ? 'bg-stone-50' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      openCategory(category);
                      setCollapsedCategories((prev) => ({ ...prev, [category]: false }));
                    }}
                    className="flex-1 min-w-0 text-left flex items-center justify-between rounded-md px-1.5 py-1.5 hover:bg-stone-100/60 transition-colors"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 truncate">
                      {category}
                    </span>
                    <span className="category-count-badge ml-2 text-[10px] font-medium text-stone-400 rounded-full px-2 py-0.5 bg-stone-100/80">
                      {items.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }))}
                    className="w-7 h-7 rounded-md text-gray-400 hover:text-stone-700 hover:bg-stone-100/70 flex items-center justify-center transition-colors"
                    aria-label={`${collapsedCategories[category] ? 'Expand' : 'Collapse'} ${category}`}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${collapsedCategories[category] ? '-rotate-90' : ''}`}
                    />
                  </button>
                </div>

                {!collapsedCategories[category] && (
                  <ul className="space-y-1 pl-4 pr-1 border-l border-stone-200/70 ml-2">
                    {items.map((tracker) => (
                      <li
                        key={tracker.id}
                        onClick={() => {
                          openTracker(tracker.id, category);
                        }}
                        className={`group flex flex-col px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                          selectedTrackerId === tracker.id
                            ? 'bg-stone-100 text-stone-900 font-medium'
                            : 'text-gray-500 hover:bg-stone-50 hover:text-stone-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate pr-2">{tracker.name}</span>
                          <span
                            className={`flex-shrink-0 w-2 h-2 rounded-full ${
                              tracker.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))
        )}
      </ul>

      <button
        onClick={() => {
          setIsExportOpen(true);
          setIsSidebarOpen(false);
        }}
        className="mb-1 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-stone-800 transition-colors"
      >
        <Download size={16} />
        <span>Export Data</span>
      </button>

      <button
        onClick={() => setIsSettingsOpen(true)}
        className="mt-1 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-stone-800 transition-colors"
      >
        <Settings size={16} />
        <span>Settings</span>
      </button>
    </div>
  );
}

export default Sidebar;
