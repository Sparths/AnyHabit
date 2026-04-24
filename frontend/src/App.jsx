import { useMemo, useRef, useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TrackerView from './components/TrackerView';
import CategoryView from './components/CategoryView';
import EmptyTrackerState from './components/EmptyTrackerState';
import LogModal from './components/modals/LogModal';
import TrackerModal from './components/modals/TrackerModal';
import SettingsModal from './components/modals/SettingsModal';
import { TRACKER_TYPE_OPTIONS } from './constants/tracker';
import { useTheme } from './hooks/useTheme';
import { useOutsideClick } from './hooks/useOutsideClick';
import { useTrackerData } from './hooks/useTrackerData';
import { useTrackerAnalytics } from './hooks/useTrackerAnalytics';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [collapsedCategories, setCollapsedCategories] = useState({});

  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const typeMenuRef = useRef(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const {
    trackers,
    selectedTrackerId,
    setSelectedTrackerId,
    selectedCategory,
    setSelectedCategory,
    selectedTracker,
    journals,
    habitLogs,
    journalFormData,
    setJournalFormData,
    logFormData,
    setLogFormData,
    trackerFormData,
    setTrackerFormData,
    isCreatingCategory,
    setIsCreatingCategory,
    existingCategories,
    sortedCategoryEntries,
    selectedCategoryTrackers,
    activeCategory,
    openTrackerModalData,
    submitTracker,
    deleteTracker,
    toggleTrackerStatus,
    resetTracker,
    submitJournal,
    deleteJournal,
    submitLog,
    quickMarkBooleanDone,
    deleteLog
  } = useTrackerData();

  const { currentMath, dailyProgress, historicalChartData, streakStats, buildHeatmap } = useTrackerAnalytics(
    selectedTracker,
    habitLogs,
    journals
  );

  const outsideClickRefs = useMemo(
    () => [
      { ref: categoryMenuRef, onOutsideClick: () => setIsCategoryMenuOpen(false) },
      { ref: typeMenuRef, onOutsideClick: () => setIsTypeMenuOpen(false) }
    ],
    []
  );
  useOutsideClick(outsideClickRefs);

  const openTrackerModal = (tracker = null) => {
    setIsCategoryMenuOpen(false);
    setIsTypeMenuOpen(false);
    openTrackerModalData(tracker);
    setIsTrackerModalOpen(true);
  };

  const handleTrackerSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitTracker();
      setIsTrackerModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTracker = async (id) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
    try {
      await deleteTracker(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleTrackerStatus = async (tracker) => {
    try {
      await toggleTrackerStatus(tracker);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetTracker = async (trackerId) => {
    if (!confirm('Are you sure you want to log a relapse? This will reset your current streak.')) return;
    try {
      await resetTracker(trackerId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitJournal();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteJournal = async (journalId) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await deleteJournal(journalId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitLog();
      setIsLogModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Delete this activity log?')) return;
    try {
      await deleteLog(logId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickBooleanLog = async () => {
    try {
      await quickMarkBooleanDone();
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
            deleteLog={handleDeleteLog}
            setIsSidebarOpen={setIsSidebarOpen}
            setSelectedCategory={setSelectedCategory}
            setIsLogModalOpen={setIsLogModalOpen}
            setLogFormData={setLogFormData}
            onQuickBooleanLog={handleQuickBooleanLog}
            handleResetTracker={handleResetTracker}
            toggleTrackerStatus={handleToggleTrackerStatus}
            openTrackerModal={openTrackerModal}
            deleteTracker={handleDeleteTracker}
            journalFormData={journalFormData}
            setJournalFormData={setJournalFormData}
            handleJournalSubmit={handleJournalSubmit}
            journals={journals}
            deleteJournal={handleDeleteJournal}
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
        trackerTypeOptions={TRACKER_TYPE_OPTIONS}
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
