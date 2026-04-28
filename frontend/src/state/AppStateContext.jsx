import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { TRACKER_TYPE_OPTIONS } from '../constants/tracker';
import { useAuth } from '../hooks/useAuth';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { useTheme } from '../hooks/useTheme';
import { useTrackerAnalytics } from '../hooks/useTrackerAnalytics';
import { useTrackerData } from '../hooks/useTrackerData';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
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
    deleteLog,
    createGroup,
    joinGroup
  } = useTrackerData(isAuthenticated, user?.id);

  const { currentMath, dailyProgress, historicalChartData, streakStats, buildHeatmap, memberProgress, shareStats } =
    useTrackerAnalytics(selectedTracker, habitLogs, journals, isAuthenticated);
  const canManageSelectedTracker = Boolean(selectedTracker && user && selectedTracker.owner_id === user.id);

  useOutsideClick([
    { ref: categoryMenuRef, onOutsideClick: () => setIsCategoryMenuOpen(false) },
    { ref: typeMenuRef, onOutsideClick: () => setIsTypeMenuOpen(false) }
  ]);

  const visibleError = isAuthenticated && authError ? authError : '';

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

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      authError,
      visibleError,
      isAuthenticating,
      isAuthenticated,
      login,
      register,
      logout,
      setAuthError,
      dismissVisibleError,
      theme,
      setTheme,
      trackers,
      groups,
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
      currentMath,
      dailyProgress,
      historicalChartData,
      streakStats,
      buildHeatmap,
      memberProgress,
      shareStats,
      canManageSelectedTracker,
      isSidebarOpen,
      setIsSidebarOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      isGroupManagementOpen,
      setIsGroupManagementOpen,
      collapsedCategories,
      setCollapsedCategories,
      isTrackerModalOpen,
      setIsTrackerModalOpen,
      isCategoryMenuOpen,
      setIsCategoryMenuOpen,
      isTypeMenuOpen,
      setIsTypeMenuOpen,
      isLogModalOpen,
      setIsLogModalOpen,
      categoryMenuRef,
      typeMenuRef,
      trackerTypeOptions: TRACKER_TYPE_OPTIONS,
      openTrackerModal,
      handleTrackerSubmit,
      handleDeleteTracker,
      handleToggleTrackerStatus,
      handleResetTracker,
      handleJournalSubmit,
      handleDeleteJournal,
      handleLogSubmit,
      handleDeleteLog,
      handleQuickBooleanLog,
      createGroup,
      joinGroup
    }),
    [
      user,
      isAuthLoading,
      authError,
      visibleError,
      isAuthenticating,
      isAuthenticated,
      login,
      register,
      logout,
      theme,
      setTheme,
      trackers,
      groups,
      selectedTrackerId,
      selectedCategory,
      selectedTracker,
      journals,
      habitLogs,
      journalFormData,
      logFormData,
      trackerFormData,
      isCreatingCategory,
      existingCategories,
      sortedCategoryEntries,
      selectedCategoryTrackers,
      activeCategory,
      currentMath,
      dailyProgress,
      historicalChartData,
      streakStats,
      buildHeatmap,
      memberProgress,
      shareStats,
      canManageSelectedTracker,
      isSidebarOpen,
      isSettingsOpen,
      isGroupManagementOpen,
      collapsedCategories,
      isTrackerModalOpen,
      isCategoryMenuOpen,
      isTypeMenuOpen,
      isLogModalOpen,
      createGroup,
      joinGroup
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
