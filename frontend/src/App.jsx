import { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TrackerView from './components/TrackerView';
import CategoryView from './components/CategoryView';
import EmptyTrackerState from './components/EmptyTrackerState';
import LogModal from './components/modals/LogModal';
import TrackerModal from './components/modals/TrackerModal';
import SettingsModal from './components/modals/SettingsModal';
import {
  isSamePeriod,
  DAY_MS,
  toUtcDateKey,
  parseApiDate,
  formatShortDate,
  periodStart,
  addPeriod
} from './utils/date';

// Empty string means "same origin" - all API calls go to /trackers/... on the current host.
// When running via Docker (nginx proxy), this is the correct default.
// For local development set VITE_API_URL=http://localhost:8000 (see README).
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    id: null,
    name: '',
    category: 'General',
    type: 'quit',
    unit: '',
    impact_amount: 0.0,
    impact_unit: '$',
    impact_per: 'day',
    units_per_amount: 0.0,
    units_per: 'day',
    is_active: true
  });

  const [journals, setJournals] = useState([]);
  const [journalFormData, setJournalFormData] = useState({ id: null, content: '', mood: 3 });

  const [habitLogs, setHabitLogs] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logFormData, setLogFormData] = useState({ amount: 1.0, timestamp: new Date().toISOString() });

  const [currentMath, setCurrentMath] = useState({ mainUnit: 0, targetUnit: 0, impactValue: 0 });
  const [dailyProgress, setDailyProgress] = useState({ total: 0, target: 0, percentage: 0 });

  const trackerTypeOptions = [
    { value: 'quit', label: 'Quit' },
    { value: 'build', label: 'Build' },
    { value: 'boolean', label: 'Yes/No (Boolean)' }
  ];

  const fetchTrackers = async () => {
    try {
      const response = await fetch(`${API_URL}/trackers/`);
      const data = await response.json();
      setTrackers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchJournals = async (trackerId) => {
    try {
      const response = await fetch(`${API_URL}/trackers/${trackerId}/journal/`);
      const data = await response.json();
      setJournals(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHabitLogs = async (trackerId) => {
    try {
      const response = await fetch(`${API_URL}/trackers/${trackerId}/logs/`);
      if (response.ok) {
        const data = await response.json();
        setHabitLogs(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
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

  const selectedTracker = trackers.find((tracker) => tracker.id === selectedTrackerId);

  useEffect(() => {
    if (!selectedTracker) return;

    const calculateSavings = () => {
      const now = new Date();
      const startDate = parseApiDate(selectedTracker.start_date);
      if (Number.isNaN(startDate.getTime())) {
        setCurrentMath({ mainUnit: '0.0', targetUnit: '0.0', impactValue: '0.00' });
        return;
      }
      const diffMs = now - startDate;

      const msPerDay = 1000 * 60 * 60 * 24;
      const msPerWeek = msPerDay * 7;
      const msPerMonth = msPerDay * 30.44;
      const msPerYear = msPerDay * 365.25;

      const getMsPerPeriod = (period) => {
        switch (period) {
          case 'day':
            return msPerDay;
          case 'week':
            return msPerWeek;
          case 'month':
            return msPerMonth;
          case 'year':
            return msPerYear;
          default:
            return msPerDay;
        }
      };

      const getMultiplier = (period) => diffMs / getMsPerPeriod(period);
      const timeBasedUnits = selectedTracker.units_per_amount * getMultiplier(selectedTracker.units_per);

      if (selectedTracker.type === 'quit') {
        const timeBasedImpact = selectedTracker.impact_amount * getMultiplier(selectedTracker.impact_per);
        setCurrentMath({
          mainUnit: Math.max(0, timeBasedUnits).toFixed(1),
          targetUnit: 0,
          impactValue: Math.max(0, timeBasedImpact).toFixed(2)
        });
      } else {
        const actualLoggedUnits = habitLogs.reduce((sum, log) => sum + log.amount, 0);
        const impactPerMs = selectedTracker.impact_amount / getMsPerPeriod(selectedTracker.impact_per);
        const unitsPerMs =
          selectedTracker.units_per_amount > 0
            ? selectedTracker.units_per_amount / getMsPerPeriod(selectedTracker.units_per)
            : 0;

        const impactPerUnit = unitsPerMs > 0 ? impactPerMs / unitsPerMs : 0;
        const actualImpact = actualLoggedUnits * impactPerUnit;

        setCurrentMath({
          mainUnit: actualLoggedUnits.toFixed(1),
          targetUnit: Math.max(0, timeBasedUnits).toFixed(1),
          impactValue: Math.max(0, actualImpact).toFixed(2)
        });
      }
    };

    const calculateDailyProgress = () => {
      if (selectedTracker.type !== 'build' && selectedTracker.type !== 'boolean') return;

      const periodToCheck = selectedTracker.type === 'boolean' ? selectedTracker.units_per : 'day';
      const periodLogs = habitLogs.filter((log) => {
        const logDate = parseApiDate(log.timestamp);
        return isSamePeriod(logDate, periodToCheck);
      });

      const todayTotal = periodLogs.reduce((sum, log) => sum + log.amount, 0);

      let dailyTarget = selectedTracker.units_per_amount;
      if (selectedTracker.units_per === 'week') dailyTarget /= 7;
      if (selectedTracker.units_per === 'month') dailyTarget /= 30.44;
      if (selectedTracker.units_per === 'year') dailyTarget /= 365.25;

      const percentage = dailyTarget > 0 ? Math.min(100, (todayTotal / dailyTarget) * 100) : 0;
      setDailyProgress({ total: todayTotal, target: dailyTarget, percentage });
    };

    calculateSavings();
    calculateDailyProgress();

    const interval = setInterval(() => {
      calculateSavings();
      calculateDailyProgress();
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedTracker, habitLogs]);

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
    .map(([category, items]) => [category, [...items].sort((a, b) => a.name.localeCompare(b.name))])
    .sort(([a], [b]) => a.localeCompare(b));

  const selectedCategoryTrackers = useMemo(() => {
    if (!selectedCategory) return [];
    return trackers
      .filter((tracker) => ((tracker.category || 'General').trim() || 'General') === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [trackers, selectedCategory]);

  const activeCategory = selectedTracker
    ? (selectedTracker.category || 'General').trim() || 'General'
    : selectedCategory;

  useEffect(() => {
    if (selectedCategory && !groupedTrackers[selectedCategory]) {
      setSelectedCategory(null);
    }
  }, [groupedTrackers, selectedCategory]);

  const dailyLogMap = useMemo(() => {
    const map = new Map();
    habitLogs.forEach((log) => {
      const timestamp = parseApiDate(log.timestamp);
      const key = toUtcDateKey(timestamp);
      map.set(key, (map.get(key) || 0) + Number(log.amount || 0));
    });
    return map;
  }, [habitLogs]);

  const historicalChartData = useMemo(() => {
    if (!selectedTracker) return [];

    const now = new Date();
    const lookbackDays = 120;
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() - (lookbackDays - 1));
    startDate.setUTCHours(0, 0, 0, 0);

    if (selectedTracker.type === 'quit') {
      const trackerStart = parseApiDate(selectedTracker.start_date);
      trackerStart.setUTCHours(0, 0, 0, 0);

      const points = [];
      for (let i = 0; i < lookbackDays; i += 1) {
        const cursor = new Date(startDate);
        cursor.setUTCDate(startDate.getUTCDate() + i);

        const daysSinceStart = Math.floor((cursor - trackerStart) / DAY_MS);
        const streakDays = Math.max(0, daysSinceStart + 1);

        points.push({
          date: toUtcDateKey(cursor),
          label: formatShortDate(cursor),
          value: cursor >= trackerStart ? streakDays : 0
        });
      }
      return points;
    }

    let runningTotal = 0;
    const points = [];
    for (let i = 0; i < lookbackDays; i += 1) {
      const cursor = new Date(startDate);
      cursor.setUTCDate(startDate.getUTCDate() + i);
      const key = toUtcDateKey(cursor);
      const dailyAmount = dailyLogMap.get(key) || 0;
      runningTotal += dailyAmount;

      points.push({
        date: key,
        label: formatShortDate(cursor),
        value: dailyAmount,
        cumulative: Number(runningTotal.toFixed(2))
      });
    }
    return points;
  }, [selectedTracker, dailyLogMap]);

  const streakStats = useMemo(() => {
    if (!selectedTracker) {
      return { current: 0, longest: 0, periodLabel: 'days' };
    }

    if (selectedTracker.type === 'quit') {
      const today = periodStart(new Date(), 'day');
      const trackerStartDay = periodStart(parseApiDate(selectedTracker.start_date), 'day');
      const current = Math.max(0, Math.floor((today - trackerStartDay) / DAY_MS) + 1);

      const relapseMoments = journals
        .filter((entry) => (entry.content || '').toLowerCase().includes('relapse'))
        .map((entry) => parseApiDate(entry.timestamp))
        .sort((a, b) => a - b);

      let longest = current;
      for (let i = 1; i < relapseMoments.length; i += 1) {
        const spanDays = Math.floor((relapseMoments[i] - relapseMoments[i - 1]) / DAY_MS);
        longest = Math.max(longest, spanDays);
      }

      return { current, longest, periodLabel: 'days smoke-free' };
    }

    const streakPeriod =
      selectedTracker.type === 'boolean' || selectedTracker.type === 'build'
        ? selectedTracker.units_per
        : 'day';

    const threshold =
      selectedTracker.type === 'boolean'
        ? 1
        : selectedTracker.type === 'build'
          ? Math.max(0, Number(selectedTracker.units_per_amount || 0))
          : 0.0001;

    const byPeriod = new Map();
    habitLogs.forEach((log) => {
      const ts = parseApiDate(log.timestamp);
      const key = toUtcDateKey(periodStart(ts, streakPeriod));
      byPeriod.set(key, (byPeriod.get(key) || 0) + Number(log.amount || 0));
    });

    const trackerStart = periodStart(parseApiDate(selectedTracker.start_date), streakPeriod);
    const firstLoggedPeriod = habitLogs.reduce((earliest, log) => {
      const candidate = periodStart(parseApiDate(log.timestamp), streakPeriod);
      if (!earliest || candidate < earliest) return candidate;
      return earliest;
    }, null);

    const scanStart =
      firstLoggedPeriod && firstLoggedPeriod < trackerStart ? firstLoggedPeriod : trackerStart;
    const todayPeriod = periodStart(new Date(), streakPeriod);

    let cursor = new Date(scanStart);
    let longest = 0;
    let running = 0;
    const completedPeriods = [];

    while (cursor <= todayPeriod) {
      const key = toUtcDateKey(cursor);
      const amount = byPeriod.get(key) || 0;
      const done = amount >= threshold;
      completedPeriods.push(done);

      if (done) {
        running += 1;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }

      cursor = addPeriod(cursor, streakPeriod);
    }

    let current = 0;
    for (let i = completedPeriods.length - 1; i >= 0; i -= 1) {
      if (!completedPeriods[i]) break;
      current += 1;
    }

    const periodLabel =
      streakPeriod === 'day'
        ? 'days'
        : streakPeriod === 'week'
          ? 'weeks'
          : streakPeriod === 'month'
            ? 'months'
            : 'years';

    return { current, longest, periodLabel };
  }, [selectedTracker, habitLogs, journals]);

  const buildHeatmap = useMemo(() => {
    if (!selectedTracker || selectedTracker.type !== 'build') return null;

    const days = 168;
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const alignedStart = new Date(start);
    alignedStart.setUTCDate(start.getUTCDate() - start.getUTCDay());

    const cells = [];
    let cursor = new Date(alignedStart);
    while (cursor <= end) {
      const key = toUtcDateKey(cursor);
      const amount = cursor < start ? 0 : dailyLogMap.get(key) || 0;
      cells.push({ date: key, amount, isFiller: cursor < start });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const maxAmount = Math.max(0, ...cells.map((cell) => cell.amount));
    const columns = [];
    for (let i = 0; i < cells.length; i += 7) {
      columns.push(cells.slice(i, i + 7));
    }

    return { columns, maxAmount };
  }, [selectedTracker, dailyLogMap]);

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
      unit: isBoolean ? 'Times' : trackerFormData.unit,
      impact_amount: isBoolean ? 0.0 : parseFloat(trackerFormData.impact_amount) || 0.0,
      impact_unit: isBoolean ? '$' : ((trackerFormData.impact_unit || '$').trim() || '$'),
      impact_per: trackerFormData.impact_per,
      units_per_amount: isBoolean ? 1.0 : parseFloat(trackerFormData.units_per_amount) || 0.0,
      units_per: trackerFormData.units_per,
      is_active: trackerFormData.is_active
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setIsTrackerModalOpen(false);
        fetchTrackers();
      }
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
        id: null,
        name: '',
        category: 'General',
        type: 'quit',
        unit: '',
        impact_amount: 0,
        impact_unit: '$',
        impact_per: 'day',
        units_per_amount: 0,
        units_per: 'day',
        is_active: true
      });
    }

    setIsTrackerModalOpen(true);
  };

  const deleteTracker = async (id) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
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

  const handleResetTracker = async (trackerId) => {
    if (!confirm('Are you sure you want to log a relapse? This will reset your streak and savings to zero.')) return;
    try {
      const response = await fetch(`${API_URL}/trackers/${trackerId}/reset`, { method: 'POST' });
      if (response.ok) {
        fetchTrackers();
        fetchJournals(trackerId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrackerId || !journalFormData.content.trim()) return;

    const isEdit = !!journalFormData.id;
    const url = isEdit
      ? `${API_URL}/trackers/${selectedTrackerId}/journal/${journalFormData.id}`
      : `${API_URL}/trackers/${selectedTrackerId}/journal/`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: journalFormData.content, mood: parseInt(journalFormData.mood, 10) })
      });
      if (response.ok) {
        setJournalFormData({ id: null, content: '', mood: 3 });
        fetchJournals(selectedTrackerId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteJournal = async (journalId) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      const response = await fetch(`${API_URL}/trackers/${selectedTrackerId}/journal/${journalId}`, {
        method: 'DELETE'
      });
      if (response.ok) fetchJournals(selectedTrackerId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrackerId) return;

    const timestamp = logFormData.timestamp || new Date().toISOString();

    try {
      const response = await fetch(
        `${API_URL}/trackers/${selectedTrackerId}/logs/?timestamp=${encodeURIComponent(timestamp)}`,
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(logFormData.amount) })
        }
      );
      if (response.ok) {
        setIsLogModalOpen(false);
        setLogFormData({ amount: 1.0, timestamp: new Date().toISOString() });
        fetchHabitLogs(selectedTrackerId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteLog = async (logId) => {
    if (!confirm('Delete this activity log?')) return;
    try {
      const response = await fetch(`${API_URL}/trackers/${selectedTrackerId}/logs/${logId}`, {
        method: 'DELETE'
      });
      if (response.ok) fetchHabitLogs(selectedTrackerId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={`app-shell flex h-screen w-full bg-[#fcfcfc] font-sans text-stone-800 ${
        theme === 'dark' ? 'theme-dark' : ''
      }`}
    >
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        trackers={trackers}
        sortedCategoryEntries={sortedCategoryEntries}
        activeCategory={activeCategory}
        collapsedCategories={collapsedCategories}
        setCollapsedCategories={setCollapsedCategories}
        setSelectedCategory={setSelectedCategory}
        setSelectedTrackerId={setSelectedTrackerId}
        selectedTrackerId={selectedTrackerId}
        openTrackerModal={openTrackerModal}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      <div className="app-main flex-1 flex flex-col bg-[#fcfcfc] overflow-hidden">
        {selectedTracker ? (
          <TrackerView
            selectedTracker={selectedTracker}
            dailyProgress={dailyProgress}
            currentMath={currentMath}
            streakStats={streakStats}
            historicalChartData={historicalChartData}
            buildHeatmap={buildHeatmap}
            habitLogs={habitLogs}
            deleteLog={deleteLog}
            setIsSidebarOpen={setIsSidebarOpen}
            setSelectedCategory={setSelectedCategory}
            setIsLogModalOpen={setIsLogModalOpen}
            setLogFormData={setLogFormData}
            API_URL={API_URL}
            fetchHabitLogs={fetchHabitLogs}
            handleResetTracker={handleResetTracker}
            toggleTrackerStatus={toggleTrackerStatus}
            openTrackerModal={openTrackerModal}
            deleteTracker={deleteTracker}
            journalFormData={journalFormData}
            setJournalFormData={setJournalFormData}
            handleJournalSubmit={handleJournalSubmit}
            journals={journals}
            deleteJournal={deleteJournal}
          />
        ) : selectedCategory ? (
          <CategoryView
            selectedCategory={selectedCategory}
            selectedCategoryTrackers={selectedCategoryTrackers}
            setIsSidebarOpen={setIsSidebarOpen}
            setSelectedTrackerId={setSelectedTrackerId}
          />
        ) : (
          <EmptyTrackerState setIsSidebarOpen={setIsSidebarOpen} />
        )}
      </div>

      <LogModal
        isOpen={isLogModalOpen}
        setIsLogModalOpen={setIsLogModalOpen}
        selectedTracker={selectedTracker}
        logFormData={logFormData}
        setLogFormData={setLogFormData}
        handleLogSubmit={handleLogSubmit}
      />

      <TrackerModal
        isOpen={isTrackerModalOpen}
        setIsTrackerModalOpen={setIsTrackerModalOpen}
        trackerFormData={trackerFormData}
        setTrackerFormData={setTrackerFormData}
        handleTrackerSubmit={handleTrackerSubmit}
        categoryMenuRef={categoryMenuRef}
        typeMenuRef={typeMenuRef}
        isCategoryMenuOpen={isCategoryMenuOpen}
        setIsCategoryMenuOpen={setIsCategoryMenuOpen}
        isCreatingCategory={isCreatingCategory}
        setIsCreatingCategory={setIsCreatingCategory}
        existingCategories={existingCategories}
        isTypeMenuOpen={isTypeMenuOpen}
        setIsTypeMenuOpen={setIsTypeMenuOpen}
        trackerTypeOptions={trackerTypeOptions}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}

export default App;
