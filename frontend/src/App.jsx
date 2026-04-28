import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TrackerView from './components/TrackerView';
import CategoryView from './components/CategoryView';
import HomePage from './components/home/HomePage';
import LogModal from './components/modals/LogModal';
import TrackerModal from './components/modals/TrackerModal';
import SettingsModal from './components/modals/SettingsModal';
import GroupManagementModal from './components/modals/GroupManagementModal';
import AuthScreen from './components/auth/AuthScreen';
import { TRACKER_TYPE_OPTIONS } from './constants/tracker';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useOutsideClick } from './hooks/useOutsideClick';
import { useTrackerAnalytics } from './hooks/useTrackerAnalytics';
import { useTrackerData } from './hooks/useTrackerData';

function App() {
  const {
    user,
    isLoading: isAuthLoading,
    error: authError,
    isAuthenticating,
    login,
    register,
    logout,
    setError: setAuthError
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const isAuthenticated = Boolean(user);
  const visibleError = isAuthenticated && authError ? authError : '';

  const [currentView, setCurrentView] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const categoryMenuRef = useRef(null);
  const typeMenuRef = useRef(null);

  const {
    trackers,
    groups,
    selectedTrackerId,
    setSelectedTrackerId: setSelectedTrackerIdState,
    selectedCategory,
    setSelectedCategory: setSelectedCategoryState,
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
    deleteLog,
    createGroup,
    joinGroup
  } = useTrackerData(isAuthenticated, user?.id);

  const { currentMath, dailyProgress, historicalChartData, streakStats, buildHeatmap, memberProgress, shareStats } =
    useTrackerAnalytics(selectedTracker, habitLogs, journals, isAuthenticated);
  const canManageSelectedTracker = Boolean(selectedTracker && user && selectedTracker.owner_id === user.id);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('home');
      setSelectedTrackerIdState(null);
      setSelectedCategoryState(null);
      setIsSidebarOpen(false);
    }
  }, [isAuthenticated, setSelectedCategoryState, setSelectedTrackerIdState]);

  const outsideClickRefs = useMemo(
    () => [
      { ref: categoryMenuRef, onOutsideClick: () => setIsCategoryMenuOpen(false) },
      { ref: typeMenuRef, onOutsideClick: () => setIsTypeMenuOpen(false) }
    ], []
  );
  useOutsideClick(outsideClickRefs);

  const dismissVisibleError = () => setAuthError('');

  const openTrackerModal = (tracker = null) => {
    setIsCategoryMenuOpen(false);
    setIsTypeMenuOpen(false);
    openTrackerModalData(tracker);
    if (tracker?.group_id && shareStats?.trackerParticipants) {
      setTrackerFormData((previous) => ({
        ...previous,
        group_id: tracker.group_id,
        participant_ids: shareStats.trackerParticipants.map((participant) => participant.user.id)
      }));
    }
    setIsTrackerModalOpen(true);
  };

  const handleTrackerSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitTracker();
      setIsTrackerModalOpen(false);
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to save tracker');
    }
  };

  const handleDeleteTracker = async (id) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
    try {
      await deleteTracker(id);
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to delete tracker');
    }
  };

  const handleToggleTrackerStatus = async (tracker) => {
    try {
      await toggleTrackerStatus(tracker);
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to update tracker status');
    }
  };

  const handleResetTracker = async (trackerId) => {
    if (!confirm('Are you sure you want to log a relapse? This will reset your current streak.')) return;
    try {
      await resetTracker(trackerId);
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to reset tracker');
    }
  };

  const handleJournalSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitJournal();
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to save journal entry');
    }
  };

  const handleDeleteJournal = async (journalId) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await deleteJournal(journalId);
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to delete journal entry');
    }
  };

  const handleLogSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitLog();
      setIsLogModalOpen(false);
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to save log');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Delete this activity log?')) return;
    try {
      await deleteLog(logId);
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to delete log');
    }
  };

  const handleQuickBooleanLog = async () => {
    try {
      await quickMarkBooleanDone();
    } catch (error) {
      console.error(error);
      setAuthError(error.message || 'Failed to mark tracker complete');
    }
  };

  const openHome = () => {
    setSelectedTrackerIdState(null);
    setSelectedCategoryState(null);
    setCurrentView('home');
    setIsSidebarOpen(false);
  };

  const handleSelectCategory = (nextCategory) => {
    const resolvedCategory = typeof nextCategory === 'function' ? nextCategory(selectedCategory) : nextCategory;

    if (!resolvedCategory) {
      setSelectedTrackerIdState(null);
      setSelectedCategoryState(null);
      setCurrentView('home');
      return;
    }

    setSelectedCategoryState(resolvedCategory);
    setSelectedTrackerIdState(null);
    setCurrentView('category');
  };

  const handleSelectTracker = (trackerId, category) => {
    if (!trackerId) {
      setSelectedTrackerIdState(null);
      setCurrentView(selectedCategory ? 'category' : 'home');
      return;
    }

    if (category) {
      setSelectedCategoryState(category);
    }
    setSelectedTrackerIdState(trackerId);
    setCurrentView('tracker');
  };

  const shouldShowHome = currentView === 'home' || (!selectedTracker && !selectedCategory);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        Loading workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={login}
        onRegister={register}
        error={authError}
        isBusy={isAuthenticating}
      />
    );
  }

  return (
    <div
      className={`app-shell flex h-screen w-full bg-[#fcfcfc] font-sans text-stone-800 ${theme === 'dark' ? 'theme-dark' : ''}`}
    >
      {visibleError && (
        <div className="fixed top-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p className="leading-6">{visibleError}</p>
            <button
              type="button"
              onClick={dismissVisibleError}
              className="shrink-0 rounded-lg px-2 py-1 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        trackers={trackers}
        groups={groups}
        sortedCategoryEntries={sortedCategoryEntries}
        activeCategory={activeCategory}
        collapsedCategories={collapsedCategories}
        setCollapsedCategories={setCollapsedCategories}
        onHomeClick={openHome}
        isHomeActive={shouldShowHome}
        onSelectCategory={handleSelectCategory}
        onSelectTracker={handleSelectTracker}
        selectedTrackerId={selectedTrackerId}
        openTrackerModal={openTrackerModal}
        setIsSettingsOpen={setIsSettingsOpen}
        onLogout={logout}
      />

      <div className="app-main flex-1 flex flex-col bg-[#fcfcfc] overflow-hidden">
        {shouldShowHome ? (
          <HomePage
            trackers={trackers}
            groups={groups}
            setIsSidebarOpen={setIsSidebarOpen}
            onSelectTracker={handleSelectTracker}
            onSelectCategory={handleSelectCategory}
            openTrackerModal={openTrackerModal}
            setIsGroupManagementOpen={setIsGroupManagementOpen}
          />
        ) : selectedTracker ? (
          <TrackerView
            selectedTracker={selectedTracker}
            canManageTracker={canManageSelectedTracker}
            dailyProgress={dailyProgress}
            currentMath={currentMath}
            streakStats={streakStats}
            historicalChartData={historicalChartData}
            buildHeatmap={buildHeatmap}
            shareStats={shareStats}
            memberProgress={memberProgress}
            habitLogs={habitLogs}
            deleteLog={handleDeleteLog}
            setIsSidebarOpen={setIsSidebarOpen}
            setSelectedCategory={handleSelectCategory}
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
            onSelectTracker={handleSelectTracker}
          />
        ) : (
          <HomePage
            trackers={trackers}
            groups={groups}
            setIsSidebarOpen={setIsSidebarOpen}
            onSelectTracker={handleSelectTracker}
            onSelectCategory={handleSelectCategory}
            openTrackerModal={openTrackerModal}
            setIsGroupManagementOpen={setIsGroupManagementOpen}
          />
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
        currentUser={user}
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
        groups={groups}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        theme={theme}
        setTheme={setTheme}
        onLogout={logout}
        user={user}
      />

      <GroupManagementModal
        isOpen={isGroupManagementOpen}
        setIsOpen={setIsGroupManagementOpen}
        groups={groups}
        onCreateGroup={createGroup}
        onJoinGroup={joinGroup}
      />
    </div>
  );
}

export default App;
