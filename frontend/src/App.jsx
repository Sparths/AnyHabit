import { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';

// Empty string means "same origin" — all API calls go to /trackers/… on the current host.
// When running via Docker (nginx proxy), this is the correct default.
// For local development set VITE_API_URL=http://localhost:8000 (see README).
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('anyhabit-theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [trackers, setTrackers] = useState([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState(null);
  
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [trackerFormData, setTrackerFormData] = useState({
    id: null, name: '', type: 'quit', unit: '',
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

  const handleTrackerSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!trackerFormData.id;
    const url = isEdit ? `${API_URL}/trackers/${trackerFormData.id}/` : `${API_URL}/trackers/`;
    const method = isEdit ? 'PATCH' : 'POST';

    const payload = {
      name: trackerFormData.name, type: trackerFormData.type, unit: trackerFormData.unit,
      money_saved_amount: parseFloat(trackerFormData.money_saved_amount), money_saved_per: trackerFormData.money_saved_per,
      units_per_amount: parseFloat(trackerFormData.units_per_amount), units_per: trackerFormData.units_per,
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
    if (tracker) {
      setTrackerFormData(tracker);
    } else {
      setTrackerFormData({
        id: null, name: '', type: 'quit', unit: '',
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
  
  const selectedTracker = trackers.find(t => t.id === selectedTrackerId);

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
      if (selectedTracker.type !== 'build') return;
      
      const today = new Date().toDateString();
      const todayLogs = habitLogs.filter(log => {
        const logDate = new Date(log.timestamp.endsWith('Z') ? log.timestamp : `${log.timestamp}Z`);
        return logDate.toDateString() === today;
      });
      
      const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      
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

        <ul className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {trackers.length === 0 ? (
            <li className="text-sm text-gray-400 text-center mt-6">No trackers yet.</li>
          ) : (
            trackers.map((tracker) => (
              <li 
                key={tracker.id} 
                onClick={() => setSelectedTrackerId(tracker.id)}
                className={`group flex flex-col p-3 rounded-xl cursor-pointer transition-all ${
                  selectedTrackerId === tracker.id 
                  ? 'bg-stone-100 text-stone-900 font-medium' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-stone-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">{tracker.name}</span>
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full ${tracker.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                </div>
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
                      {selectedTracker.type === 'quit' ? `Avoid ${selectedTracker.units_per_amount} ${selectedTracker.unit} / ${selectedTracker.units_per}` 
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
                </div>

                {selectedTracker.money_saved_amount > 0 && (
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
              
              {selectedTracker.type === 'build' && habitLogs.length > 0 && (
                <div className="w-full mb-8">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {habitLogs.map(log => (
                      <div key={log.id} className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-4 group transition-all hover:border-gray-200">
                        <div>
                          <div className="font-medium text-stone-800 flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-stone-400" /> 
                            {log.amount} {selectedTracker.unit}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                  <select value={trackerFormData.type} onChange={(e) => setTrackerFormData({...trackerFormData, type: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm">
                    <option value="quit">Quit</option>
                    <option value="build">Build</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Unit</label>
                  <input type="text" required value={trackerFormData.unit} onChange={(e) => setTrackerFormData({...trackerFormData, unit: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-stone-50 text-sm" placeholder="e.g. Pages"/>
                </div>
              </div>

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