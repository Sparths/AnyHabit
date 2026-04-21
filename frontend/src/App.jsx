import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Pause, 
  Play, 
  Pencil, 
  Trash2, 
  Sprout, 
  Target, 
  Coins, 
  Calendar,
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
  TrendingUp,
  Activity,
  PlusCircle,
  CheckCircle2,
  Settings,
  ChevronDown
} from 'lucide-react';

// Empty string means "same origin" — all API calls go to /trackers/… on the current host.
// When running via Docker (nginx proxy), this is the correct default.
// For local development set VITE_API_URL=http://localhost:8000 (see README).
const API_URL = import.meta.env.VITE_API_URL || '';

const isSamePeriod = (logDate, period) => {
  const d1 = new Date(logDate);
  const now = new Date();
  
  if (period === 'day') {
    return d1.toDateString() === now.toDateString();
  }
  if (period === 'month') {
    return d1.getMonth() === now.getMonth() && d1.getFullYear() === now.getFullYear();
  }
  if (period === 'year') {
    return d1.getFullYear() === now.getFullYear();
  }
  if (period === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d1 >= startOfWeek && d1 < endOfWeek;
  }
  return false;
};

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('anyhabit-theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [trackers, setTrackers] = useState([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const typeMenuRef = useRef(null);
  const [trackerFormData, setTrackerFormData] = useState({
    id: null, name: '', category: 'General', type: 'quit', unit: '',
    money_saved_amount: 0.0, money_saved_per: 'day',
    units_per_amount: 0.0, units_per: 'day', is_active: true
  });

  const [journals, setJournals] = useState([]);
  const [journalFormData, setJournalFormData] = useState({ id: null, content: '', mood: 3 });

  const [habitLogs, setHabitLogs] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logFormData, setLogFormData] = useState({ amount: 1.0 });

  const fetchTrackers = async () => {
    try {
      const response = await fetch(`${API_URL}/trackers/`);
      const data = await response.json();
      setTrackers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTrackers();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('anyhabit-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target)) {
        setIsTypeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTrackerSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!trackerFormData.id;
    const url = isEdit ? `${API_URL}/trackers/${trackerFormData.id}/` : `${API_URL}/trackers/`;
    const method = isEdit ? 'PATCH' : 'POST';
    const isBoolean = trackerFormData.type === 'boolean';
    const payload = {
      name: trackerFormData.name,
      category: trackerFormData.category.trim() || 'General',
      type: trackerFormData.type,
      unit: isBoolean ? 'Times' :trackerFormData.unit,
      money_saved_amount: isBoolean ? 0.0 : parseFloat(trackerFormData.money_saved_amount), 
      money_saved_per: trackerFormData.money_saved_per,
      units_per_amount: isBoolean ? 1.0 : parseFloat(trackerFormData.units_per_amount), 
      units_per: trackerFormData.units_per,
      is_active: trackerFormData.is_active
    };

    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (response.ok) {
        setIsTrackerModalOpen(false);
        fetchTrackers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTracker = async (id) => {
    if (!confirm("Are you sure you want to delete this tracker?")) return;
    try {
      const response = await fetch(`${API_URL}/trackers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        if (selectedTrackerId === id) setSelectedTrackerId(null);
        fetchTrackers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTrackerStatus = async (tracker) => {
    const action = tracker.is_active ? 'stop' : 'start';
    try {
      const response = await fetch(`${API_URL}/trackers/${tracker.id}/${action}`, { method: 'PUT' });
      if (response.ok) fetchTrackers();
    } catch (error) {
      console.error(error);
    }
  };

  const openTrackerModal = (tracker = null) => {
    setIsCategoryMenuOpen(false);
    setIsTypeMenuOpen(false);
    if (tracker) {
      const normalizedCategory = (tracker.category || 'General').trim() || 'General';
      setIsCreatingCategory(!existingCategories.includes(normalizedCategory));
      setTrackerFormData({ ...tracker, category: normalizedCategory });
    } else {
      setIsCreatingCategory(false);
      setTrackerFormData({
        id: null, name: '', category: 'General', type: 'quit', unit: '',
        money_saved_amount: 0, money_saved_per: 'day',
        units_per_amount: 0, units_per: 'day', is_active: true
      });
    }
    setIsTrackerModalOpen(true);
  };

  const fetchJournals = async (trackerId) => {
    try {
      const response = await fetch(`${API_URL}/trackers/${trackerId}/journal/`);
      const data = await response.json();
      setJournals(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) { console.error(error); }
  };

  const fetchHabitLogs = async (trackerId) => {
    try {
      const response = await fetch(`${API_URL}/trackers/${trackerId}/logs/`);
      if (response.ok) {
        const data = await response.json();
        setHabitLogs(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (selectedTrackerId) {
      fetchJournals(selectedTrackerId);
      fetchHabitLogs(selectedTrackerId);
      setJournalFormData({ id: null, content: '', mood: 3 }); 
    } else {
      setJournals([]);
      setHabitLogs([]);
    }
  }, [selectedTrackerId]);

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrackerId || !journalFormData.content.trim()) return;

    const isEdit = !!journalFormData.id;
    const url = isEdit ? `${API_URL}/trackers/${selectedTrackerId}/journal/${journalFormData.id}` : `${API_URL}/trackers/${selectedTrackerId}/journal/`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: journalFormData.content, mood: parseInt(journalFormData.mood) })
      });
      if (response.ok) {
        setJournalFormData({ id: null, content: '', mood: 3 });
        fetchJournals(selectedTrackerId);
      }
    } catch (error) { console.error(error); }
  };

  const deleteJournal = async (journalId) => {
    if (!confirm("Delete this journal entry?")) return;
    try {
      const response = await fetch(`${API_URL}/trackers/${selectedTrackerId}/journal/${journalId}`, { method: 'DELETE' });
      if (response.ok) fetchJournals(selectedTrackerId);
    } catch (error) { console.error(error); }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrackerId) return;

    try {
      const response = await fetch(`${API_URL}/trackers/${selectedTrackerId}/logs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(logFormData.amount) })
      });
      if (response.ok) {
        setIsLogModalOpen(false);
        setLogFormData({ amount: 1.0 });
        fetchHabitLogs(selectedTrackerId);
      }
    } catch (error) { console.error(error); }
  };

  const deleteLog = async (logId) => {
    if (!confirm("Delete this activity log?")) return;
    try {
      const response = await fetch(`${API_URL}/trackers/${selectedTrackerId}/logs/${logId}`, { method: 'DELETE' });
      if (response.ok) fetchHabitLogs(selectedTrackerId);
    } catch (error) { console.error(error); }
  };

  const [currentMath, setCurrentMath] = useState({ mainUnit: 0, targetUnit: 0, savedMoney: 0 });
  const [dailyProgress, setDailyProgress] = useState({ total: 0, target: 0, percentage: 0 });

  const existingCategories = (() => {
    const categories = trackers.map((tracker) => (tracker.category || 'General').trim() || 'General');
    const uniqueCategories = new Set(['General', ...categories]);
    return [...uniqueCategories].sort((a, b) => a.localeCompare(b));
  })();

  const groupedTrackers = trackers.reduce((groups, tracker) => {
    const category = (tracker.category || 'General').trim() || 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(tracker);
    return groups;
  }, {});

  const sortedCategoryEntries = Object.entries(groupedTrackers)
    .map(([category, items]) => ([
      category,
      [...items].sort((a, b) => a.name.localeCompare(b.name))
    ]))
    .sort(([a], [b]) => a.localeCompare(b));

  const selectedCategoryTrackers = useMemo(() => {
    if (!selectedCategory) return [];
    return trackers
      .filter((tracker) => ((tracker.category || 'General').trim() || 'General') === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [trackers, selectedCategory]);
  
  const selectedTracker = trackers.find(t => t.id === selectedTrackerId);
  const activeCategory = selectedTracker
    ? ((selectedTracker.category || 'General').trim() || 'General')
    : selectedCategory;

  useEffect(() => {
    if (selectedCategory && !groupedTrackers[selectedCategory]) {
      setSelectedCategory(null);
    }
  }, [groupedTrackers, selectedCategory]);

  useEffect(() => {
    if (!selectedTracker) return;

    const calculateSavings = () => {
      const now = new Date();
      const startDateString = selectedTracker.start_date.endsWith('Z') ? selectedTracker.start_date : `${selectedTracker.start_date}Z`;
      const startDate = new Date(startDateString);
      const diffMs = now - startDate;
      
      const msPerDay = 1000 * 60 * 60 * 24;
      const msPerWeek = msPerDay * 7;
      const msPerMonth = msPerDay * 30.44; 
      const msPerYear = msPerDay * 365.25;

      const getMultiplier = (period) => {
        switch(period) {
          case 'day': return diffMs / msPerDay;
          case 'week': return diffMs / msPerWeek;
          case 'month': return diffMs / msPerMonth;
          case 'year': return diffMs / msPerYear;
          default: return 0;
        }
      };

      const timeBasedUnits = selectedTracker.units_per_amount * getMultiplier(selectedTracker.units_per);
      const timeBasedMoney = selectedTracker.money_saved_amount * getMultiplier(selectedTracker.money_saved_per);

      if (selectedTracker.type === 'quit') {
        setCurrentMath({
          mainUnit: Math.max(0, timeBasedUnits).toFixed(1),
          targetUnit: 0,
          savedMoney: Math.max(0, timeBasedMoney).toFixed(2)
        });
      } else {
        const actualLoggedUnits = habitLogs.reduce((sum, log) => sum + log.amount, 0);
        setCurrentMath({
          mainUnit: actualLoggedUnits.toFixed(1),
          targetUnit: Math.max(0, timeBasedUnits).toFixed(1),
          savedMoney: Math.max(0, timeBasedMoney).toFixed(2)
        });
      }
    };

    const calculateDailyProgress = () => {
      if (selectedTracker.type !== 'build' && selectedTracker.type !== 'boolean') return;
      

      const periodToCheck = selectedTracker.type === 'boolean' ? selectedTracker.units_per : 'day';

      const periodLogs = habitLogs.filter(log => {
        const logDate = new Date(log.timestamp.endsWith('Z') ? log.timestamp : `${log.timestamp}Z`);
        return isSamePeriod(logDate, periodToCheck);
      });

      const todayTotal = periodLogs.reduce((sum, log) => sum + log.amount, 0);
      
      let dailyTarget = selectedTracker.units_per_amount;
      if (selectedTracker.units_per === 'week') dailyTarget /= 7;
      if (selectedTracker.units_per === 'month') dailyTarget /= 30.44;
      if (selectedTracker.units_per === 'year') dailyTarget /= 365.25;

      const percentage = dailyTarget > 0 ? Math.min(100, (todayTotal / dailyTarget) * 100) : 0;

      setDailyProgress({
        total: todayTotal,
        target: dailyTarget,
        percentage: percentage
      });
    };

    calculateSavings(); 
    calculateDailyProgress();

    const interval = setInterval(() => {
      calculateSavings();
      calculateDailyProgress();
    }, 1000); 
    
    return () => clearInterval(interval);
  }, [selectedTracker, habitLogs]);

  const getMoodIcon = (moodValue, size = 20) => {
    switch (moodValue) {
      case 1: return <Frown size={size} />;
      case 2: return <Annoyed size={size} />;
      case 3: return <Meh size={size} />;
      case 4: return <Smile size={size} />;
      case 5: return <Laugh size={size} />;
      default: return <Meh size={size} />;
    }
  };

  const trackerTypeOptions = [
    { value: 'quit', label: 'Quit' },
    { value: 'build', label: 'Build' },
    { value: 'boolean', label: 'Yes/No (Boolean)' }
  ];

  const selectedTypeLabel = trackerTypeOptions.find((typeOption) => typeOption.value === trackerFormData.type)?.label || 'Quit';

  return (
    <div className={`app-shell flex h-screen w-full bg-[#fcfcfc] font-sans text-stone-800 ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div className="app-sidebar w-72 border-r border-gray-100 p-6 bg-white flex flex-col z-10">
        <div className="flex items-center gap-3 mb-8">
          <img src="/AnyHabit.png" alt="AnyHabit Logo" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="text-xl font-bold tracking-tight">AnyHabit</h1>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Trackers</h2>
          <button 
            onClick={() => openTrackerModal()}
            className="text-gray-400 hover:text-stone-900 transition-colors flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>

        <ul className="space-y-4 flex-1 overflow-y-auto pr-1">
          {trackers.length === 0 ? (
            <li className="text-sm text-gray-400 text-center mt-6">No trackers yet.</li>
          ) : (
            sortedCategoryEntries.map(([category, items]) => (
              <li key={category} className="pb-1">
                <div className={`flex items-center gap-1 mb-2 rounded-lg px-1 py-0.5 transition-colors ${activeCategory === category ? 'bg-stone-50' : ''}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedTrackerId(null);
                      setCollapsedCategories((prev) => ({ ...prev, [category]: false }));
                    }}
                    className="flex-1 min-w-0 text-left flex items-center justify-between rounded-md px-1.5 py-1.5 hover:bg-stone-100/60 transition-colors"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 truncate">{category}</span>
                    <span className="category-count-badge ml-2 text-[10px] font-medium text-stone-400 rounded-full px-2 py-0.5 bg-stone-100/80">{items.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }))}
                    className="w-7 h-7 rounded-md text-gray-400 hover:text-stone-700 hover:bg-stone-100/70 flex items-center justify-center transition-colors"
                    aria-label={`${collapsedCategories[category] ? 'Expand' : 'Collapse'} ${category}`}
                  >
                    <ChevronDown size={14} className={`transition-transform ${collapsedCategories[category] ? '-rotate-90' : ''}`} />
                  </button>
                </div>

                {!collapsedCategories[category] && (
                  <ul className="space-y-1 pl-4 pr-1 border-l border-stone-200/70 ml-2">
                    {items.map((tracker) => (
                      <li 
                        key={tracker.id} 
                        onClick={() => {
                          setSelectedTrackerId(tracker.id);
                          setSelectedCategory(category);
                        }}
                        className={`group flex flex-col px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                          selectedTrackerId === tracker.id 
                          ? 'bg-stone-100 text-stone-900 font-medium' 
                          : 'text-gray-500 hover:bg-stone-50 hover:text-stone-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate pr-2">{tracker.name}</span>
                          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${tracker.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
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
          onClick={() => setIsSettingsOpen(true)}
          className="mt-5 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-stone-800 transition-colors"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>

      <div className="app-main flex-1 flex flex-col bg-[#fcfcfc] overflow-hidden">
        {selectedTracker ? (
          <>
            <header className="px-10 pt-10 pb-6 flex flex-col shrink-0">
              <div className="flex justify-between items-start w-full">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold tracking-tight">{selectedTracker.name}</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory((selectedTracker.category || 'General').trim() || 'General');
                        setSelectedTrackerId(null);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                    >
                      {(selectedTracker.category || 'General').trim() || 'General'}
                    </button>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedTracker.type === 'quit' ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-600'}`}>
                      {selectedTracker.type}
                    </span>
                    {!selectedTracker.is_active && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">Stopped</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-3">
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Target size={14} /> 
                    {selectedTracker.type === 'boolean' ? `${selectedTracker.units_per.charAt(0).toUpperCase() + selectedTracker.units_per.slice(1)} Habit` :
                    selectedTracker.type === 'quit' ? `Avoid ${selectedTracker.units_per_amount} ${selectedTracker.unit} / ${selectedTracker.units_per}` 
                    :`Goal: ${selectedTracker.units_per_amount} ${selectedTracker.unit} / ${selectedTracker.units_per}`}
                  </p>
                    <p className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} /> 
                      Started: {new Date(selectedTracker.start_date.endsWith('Z') ? selectedTracker.start_date : `${selectedTracker.start_date}Z`).toLocaleDateString()}
                      &ensp;
                      {new Date(selectedTracker.start_date.endsWith('Z') ? selectedTracker.start_date : `${selectedTracker.start_date}Z`).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {selectedTracker.type === 'build' && (
                    <button 
                      onClick={() => { setLogFormData({amount: 1}); setIsLogModalOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-sm font-medium transition-colors mr-2"
                    >
                      <PlusCircle size={16} /> Log Activity
                    </button>
                  )}
                  {selectedTracker.type === 'boolean' && dailyProgress.total < 1 && (
                  <button 
                    onClick={async () => { 
                      await fetch(`${API_URL}/trackers/${selectedTracker.id}/logs/`, {
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
                  <button 
                    onClick={() => toggleTrackerStatus(selectedTracker)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-stone-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
                  >
                    {selectedTracker.is_active ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Resume</>}
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

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    {selectedTracker.type === 'quit' ? <TrendingUp size={16} /> : <Activity size={16} />} 
                    {selectedTracker.type === 'quit' ? 'Avoided' : 'Accomplished'}
                  </div>
                  {selectedTracker.type === 'boolean' ? (
                    <div className="mt-4 flex items-center gap-3">
                      {dailyProgress.total >= 1 ? (
                        <div className="text-emerald-500 flex items-center gap-2 font-medium text-lg">
                          <CheckCircle2 size={24} /> Done for this {selectedTracker.units_per}!                        
                        </div>
                      ) : (
                        <div className="text-gray-400 font-medium text-lg">Not completed yet</div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-end gap-2">
                        <div className="text-4xl font-semibold tracking-tight">
                          {currentMath.mainUnit}
                        </div>
                        <div className="text-lg text-gray-400 mb-1">{selectedTracker.unit}</div>
                      </div>
                      
                      {selectedTracker.type === 'build' && (
                        <div className="mt-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-stone-600">Today's Progress</span>
                            <span className="text-stone-400">{dailyProgress.total.toFixed(1)} / {dailyProgress.target.toFixed(1)}</span>
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

                {selectedTracker.money_saved_amount > 0 && selectedTracker.type !== 'boolean' && (
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <Coins size={16} /> 
                        {selectedTracker.type === 'quit' ? 'Saved' : 'Impact'}
                      </div>
                      <div className="text-4xl font-semibold tracking-tight">
                        ${currentMath.savedMoney}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-4">
                      Rate: ${selectedTracker.money_saved_amount} / {selectedTracker.money_saved_per}
                    </div>
                  </div>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-10 pb-10 flex flex-col">
              
              {(selectedTracker.type === 'build' || selectedTracker.type === 'boolean') && habitLogs.length > 0 && (
                <div className="w-full mb-8">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {habitLogs.map(log => (
                      <div key={log.id} className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-4 group transition-all hover:border-gray-200">
                        <div>
                          <div className="font-medium text-stone-800 flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-stone-400" /> 
                            {selectedTracker.type === 'boolean' ? 'Completed' : `${log.amount} ${selectedTracker.unit}`}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(log.timestamp.endsWith('Z') ? log.timestamp : `${log.timestamp}Z`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <button onClick={() => deleteLog(log.id)} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full bg-white border border-gray-100 rounded-3xl p-5 shadow-sm mb-8 transition-all focus-within:border-gray-300">
                <form onSubmit={handleJournalSubmit}>
                  <textarea 
                    required
                    value={journalFormData.content}
                    onChange={(e) => setJournalFormData({...journalFormData, content: e.target.value})}
                    className="w-full outline-none resize-none text-stone-800 placeholder-gray-400 bg-transparent text-base" 
                    rows="2" 
                    placeholder="Write a journal entry..."
                  ></textarea>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                    <div className="flex gap-1.5">
                      {[1,2,3,4,5].map(m => (
                        <button 
                          key={m} type="button"
                          onClick={() => setJournalFormData({...journalFormData, mood: m})}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${journalFormData.mood === m ? 'bg-stone-900 text-white' : 'bg-transparent text-gray-400 hover:bg-stone-100'}`}
                        >
                          {getMoodIcon(m, 16)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      {journalFormData.id && (
                        <button type="button" onClick={() => setJournalFormData({ id: null, content: '', mood: 3 })} className="text-gray-400 text-sm hover:text-stone-600 px-2">Cancel</button>
                      )}
                      <button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-1.5 rounded-xl text-sm font-medium transition-colors">
                        {journalFormData.id ? 'Update' : 'Post'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="w-full space-y-3 pb-12">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Journal</h3>
                {journals.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">No journal entries yet.</p>
                  </div>
                ) : (
                  journals.map(journal => (
                    <div key={journal.id} className="bg-white border border-gray-100 rounded-3xl p-5 group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3 text-gray-500">
                          <span className="text-stone-400">
                            {getMoodIcon(journal.mood || 3, 16)}
                          </span>
                          <span className="text-xs font-medium">{new Date(journal.timestamp.endsWith('Z') ? journal.timestamp : `${journal.timestamp}Z`).toLocaleString()}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => setJournalFormData(journal)} className="text-gray-400 hover:text-stone-600"><Pencil size={14}/></button>
                          <button onClick={() => deleteJournal(journal.id)} className="text-gray-400 hover:text-rose-500"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{journal.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : selectedCategory ? (
          <div className="flex-1 overflow-y-auto px-10 pt-10 pb-10">
            <div className="mb-7">
              <h2 className="text-3xl font-bold tracking-tight text-stone-900">{selectedCategory}</h2>
              <p className="text-sm text-gray-500 mt-2">
                {selectedCategoryTrackers.length} tracker{selectedCategoryTrackers.length === 1 ? '' : 's'} in this category.
              </p>
            </div>

            {selectedCategoryTrackers.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400">
                No trackers in this category.
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {selectedCategoryTrackers.map((tracker) => (
                    <li
                      key={tracker.id}
                      className="px-5 py-4 hover:bg-stone-50/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-semibold text-stone-900 truncate">{tracker.name}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${tracker.type === 'quit' ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-600'}`}>
                              {tracker.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${tracker.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                              {tracker.is_active ? 'Active' : 'Stopped'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500">
                            <span>
                              {tracker.type === 'boolean' 
                                ? `${tracker.units_per.charAt(0).toUpperCase() + tracker.units_per.slice(1)} Habit`
                                : `${tracker.type === 'quit' ? 'Avoid' : 'Goal'}: ${tracker.units_per_amount} ${tracker.unit} / ${tracker.units_per}`
                              }
                            </span>
                            {tracker.type !== 'boolean' && (
                              <span>Rate: ${tracker.money_saved_amount} / {tracker.money_saved_per}</span>
                            )}
                            <span>Started: {new Date(tracker.start_date.endsWith('Z') ? tracker.start_date : `${tracker.start_date}Z`).toLocaleDateString()}</span>
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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white m-4 rounded-3xl border border-gray-50">
            <Sprout size={48} strokeWidth={1} className="mb-4 text-gray-300" />
            <h2 className="text-lg font-medium text-stone-600">Select a tracker</h2>
            <p className="text-sm mt-1">or create a new one to get started.</p>
          </div>
        )}
      </div>

      {isLogModalOpen && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-modal-card bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-1 text-stone-900">Log Activity</h3>
            <p className="text-sm text-gray-500 mb-5">Record your progress for {selectedTracker?.name}</p>
            <form onSubmit={handleLogSubmit}>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Amount ({selectedTracker?.unit}s)
                </label>
                <input 
                  type="number" step="0.1" required 
                  value={logFormData.amount} 
                  onChange={(e) => setLogFormData({ amount: e.target.value })} 
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-stone-400 bg-stone-50 text-base font-medium text-stone-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTrackerModalOpen && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-modal-card bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <h3 className="text-xl font-bold mb-6 text-stone-900">
              {trackerFormData.id ? 'Edit Tracker' : 'New Tracker'}
            </h3>
            
            <form onSubmit={handleTrackerSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                <input type="text" required value={trackerFormData.name} onChange={(e) => setTrackerFormData({...trackerFormData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                <div className="space-y-2" ref={categoryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm flex items-center justify-between text-stone-800"
                  >
                    <span className="truncate text-left">{isCreatingCategory ? 'Create new category' : (trackerFormData.category || 'General')}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
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
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${trackerFormData.category === category && !isCreatingCategory ? 'bg-stone-100 text-stone-900' : 'text-stone-700 hover:bg-stone-50'}`}
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
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTypeMenuOpen ? 'rotate-180' : ''}`} />
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
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${trackerFormData.type === typeOption.value ? 'bg-stone-100 text-stone-900' : 'text-stone-700 hover:bg-stone-50'}`}
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
                  <input type="text" required value={trackerFormData.unit} onChange={(e) => setTrackerFormData({...trackerFormData, unit: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm" placeholder="e.g. Pages"/>
                </div>
              </div>

              {trackerFormData.type === 'boolean' ? (
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Frequency
                  </label>
                  <select value={trackerFormData.units_per} onChange={(e) => setTrackerFormData({...trackerFormData, units_per: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm">
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {trackerFormData.type === 'quit' ? 'Usage to Avoid' : 'Target Goal'}
                  </label>
                  <div className="flex gap-3">
                    <input type="number" step="0.1" value={trackerFormData.units_per_amount} onChange={(e) => setTrackerFormData({...trackerFormData, units_per_amount: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm"/>
                    <div className="flex items-center text-sm text-gray-400">per</div>
                    <select value={trackerFormData.units_per} onChange={(e) => setTrackerFormData({...trackerFormData, units_per: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm">
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                </div>
              )}
              {trackerFormData.type !== 'boolean' && (
              <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Financial Value
                </label>
                <div className="flex gap-3">
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" step="0.01" value={trackerFormData.money_saved_amount} onChange={(e) => setTrackerFormData({...trackerFormData, money_saved_amount: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 pl-7 outline-none focus:border-stone-400 bg-stone-50 text-sm"/>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">per</div>
                  <select value={trackerFormData.money_saved_per} onChange={(e) => setTrackerFormData({...trackerFormData, money_saved_per: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm">
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              </div>
              )}

              <div className="flex justify-end gap-2 mt-6 pt-2">
                <button type="button" onClick={() => setIsTrackerModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-modal-card bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg border border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-stone-900">Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Personalize your AnyHabit experience.</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            <div className="mb-7">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Theme</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    theme === 'light' ? 'border-stone-800 bg-stone-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-800">Lightmode</p>
                  <p className="text-xs text-gray-500 mt-1">Bright background with soft contrast</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    theme === 'dark' ? 'border-stone-800 bg-stone-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-800">Darkmode</p>
                  <p className="text-xs text-gray-500 mt-1">Dimmed interface for low-light sessions</p>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About This Website</h4>
              <div className="rounded-2xl border border-gray-200 p-4 bg-stone-50">
                <p className="text-sm text-stone-700 leading-relaxed">
                  This is AnyHabit, made by Bebedi as an open source project.
                </p>
                <a
                  href="https://github.com/Sparths/AnyHabit"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-sm font-medium text-stone-900 hover:underline"
                >
                  https://github.com/Sparths/AnyHabit
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App;