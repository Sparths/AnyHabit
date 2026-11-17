import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRACKER_TYPE_OPTIONS } from '../constants/tracker';
import { useAuth } from '../hooks/useAuth';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { useTheme } from '../hooks/useTheme';
import { useToasts } from '../hooks/useToasts';
import { useTrackerAnalytics } from '../hooks/useTrackerAnalytics';
import { useTrackerData } from '../hooks/useTrackerData';
import { AppStateContext } from './appState';

export function AppStateProvider({ children }) {
  const {
    user,
    isLoading: isAuthLoading,
    registrationEnabled,
    error: authError,
    isAuthenticating,
    login,
    register,
    logout,
    updatePreferences,
    changePassword,
    deleteAccount,
    setError: setAuthError
  } = useAuth();

  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { toasts, dismissToast, notify } = useToasts();
  const isAuthenticated = Boolean(user);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);

  const [confirmRequest, setConfirmRequest] = useState(null);
  const confirmResolverRef = useRef(null);

  const categoryMenuRef = useRef(null);
  const typeMenuRef = useRef(null);
  const groupMenuRef = useRef(null);

  /**
   * Promise-based confirmation, so callers keep reading as straight-line code
   * while the user sees a real dialog instead of a browser `confirm()` box.
   */
  const confirm = useCallback(
    (request) =>
      new Promise((resolve) => {
        confirmResolverRef.current = resolve;
        setConfirmRequest(request);
      }),
    []
  );

  const resolveConfirm = useCallback((accepted) => {
    setConfirmRequest(null);
    confirmResolverRef.current?.(accepted);
    confirmResolverRef.current = null;
  }, []);

  const reportError = useCallback(
    (error) => {
      // A 401 means the session lapsed; useAuth already routes the user back to
      // the sign-in screen, so a toast on top of that would just be noise.
      if (error?.status === 401) return;
      notify.error(error?.message || 'Something went wrong');
    },
    [notify]
  );

  const trackerData = useTrackerData(isAuthenticated, reportError);
  const {
    trackers,
    visibleTrackers,
    selectedTracker,
    selectedTrackerId,
    habitLogs,
    journals,
    setTrackerFormData,
    openTrackerModalData
  } = trackerData;

  const analytics = useTrackerAnalytics(selectedTracker, habitLogs, journals, isAuthenticated, reportError);
  const canManageSelectedTracker = Boolean(selectedTracker && user && selectedTracker.owner_id === user.id);

  useOutsideClick([
    { ref: categoryMenuRef, onOutsideClick: () => setIsCategoryMenuOpen(false) },
    { ref: typeMenuRef, onOutsideClick: () => setIsTypeMenuOpen(false) },
    // The group dropdown had a ref but was never registered here, so it was the
    // one menu that stayed open when you clicked away from it.
    { ref: groupMenuRef, onOutsideClick: () => setIsGroupMenuOpen(false) }
  ]);

  const openTrackerModal = (tracker = null) => {
    setIsCategoryMenuOpen(false);
    setIsTypeMenuOpen(false);
    setIsGroupMenuOpen(false);
    openTrackerModalData(tracker);

    if (tracker?.group_id && analytics.shareStats?.trackerParticipants?.length) {
      setTrackerFormData((previous) => ({
        ...previous,
        group_id: tracker.group_id,
        participant_ids: analytics.shareStats.trackerParticipants.map((participant) => participant.user.id)
      }));
    }
    setIsTrackerModalOpen(true);
  };

  /** Run an action, surface its outcome, and swallow the rejection. */
  const runAction = async (action, { success, failure } = {}) => {
    try {
      const result = await action();
      if (success) notify.success(success);
      return result;
    } catch (error) {
      notify.error(error?.message || failure || 'Something went wrong');
      return undefined;
    }
  };

  const handleTrackerSubmit = async (event) => {
    event.preventDefault();
    const isEdit = Boolean(trackerData.trackerFormData.id);

    try {
      const saved = await trackerData.submitTracker();
      setIsTrackerModalOpen(false);
      notify.success(isEdit ? 'Tracker updated' : 'Tracker created');

      // Creating a tracker used to leave you exactly where you were, with no
      // sign of the thing you just made. Open it instead.
      if (!isEdit && saved?.id) {
        trackerData.setSelectedCategory((saved.category || 'General').trim() || 'General');
        trackerData.setSelectedTrackerId(saved.id);
        navigate(`/tracker/${saved.id}`);
      }
    } catch (error) {
      notify.error(error?.message || 'Could not save the tracker');
    }
  };

  const handleDeleteTracker = async (id) => {
    const tracker = trackers.find((item) => item.id === id);
    const accepted = await confirm({
      title: 'Delete this tracker?',
      message: `"${tracker?.name || 'This tracker'}" and all of its logs and journal entries will be permanently removed. To keep the history but hide the tracker, archive it instead.`,
      confirmLabel: 'Delete permanently',
      tone: 'danger'
    });
    if (!accepted) return;

    await runAction(() => trackerData.deleteTracker(id), {
      success: 'Tracker deleted',
      failure: 'Could not delete the tracker'
    });
  };

  const handleArchiveTracker = async (trackerId) =>
    runAction(() => trackerData.archiveTracker(trackerId), {
      success: 'Tracker archived. Its history is kept.',
      failure: 'Could not archive the tracker'
    });

  const handleUnarchiveTracker = async (trackerId) =>
    runAction(() => trackerData.unarchiveTracker(trackerId), {
      success: 'Tracker restored',
      failure: 'Could not restore the tracker'
    });

  const handleToggleTrackerStatus = async (tracker) =>
    runAction(() => trackerData.toggleTrackerStatus(tracker), {
      success: tracker.is_active ? 'Tracker paused' : 'Tracker resumed',
      failure: 'Could not update the tracker'
    });

  const handleResetTracker = async (trackerId) => {
    const accepted = await confirm({
      title: 'Log a relapse?',
      message:
        'This restarts the streak and the totals for this run from zero. Your journal entries and lifetime totals are kept.',
      confirmLabel: 'Log relapse',
      tone: 'danger'
    });
    if (!accepted) return;

    await runAction(() => trackerData.resetTracker(trackerId), {
      success: 'Relapse logged. The counter starts again from here.',
      failure: 'Could not log the relapse'
    });
  };

  const handleJournalSubmit = async (event) => {
    event.preventDefault();
    const isEdit = Boolean(trackerData.journalFormData.id);
    await runAction(() => trackerData.submitJournal(), {
      success: isEdit ? 'Journal entry updated' : 'Journal entry saved',
      failure: 'Could not save the journal entry'
    });
  };

  const handleDeleteJournal = async (journalId) => {
    const accepted = await confirm({
      title: 'Delete this journal entry?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger'
    });
    if (!accepted) return;

    await runAction(() => trackerData.deleteJournal(journalId), {
      success: 'Journal entry deleted',
      failure: 'Could not delete the journal entry'
    });
  };

  const handleLogSubmit = async (event) => {
    event.preventDefault();
    try {
      await trackerData.submitLog();
      setIsLogModalOpen(false);
      notify.success('Activity logged');
    } catch (error) {
      notify.error(error?.message || 'Could not save the log');
    }
  };

  const handleDeleteLog = async (logId) => {
    const accepted = await confirm({
      title: 'Delete this log entry?',
      message: 'Your streak and totals will be recalculated without it.',
      confirmLabel: 'Delete',
      tone: 'danger'
    });
    if (!accepted) return;

    await runAction(() => trackerData.deleteLog(logId), {
      success: 'Log deleted',
      failure: 'Could not delete the log'
    });
  };

  const handleQuickBooleanLog = async () =>
    runAction(() => trackerData.quickMarkBooleanDone(), {
      success: 'Marked as done',
      failure: 'Could not mark this as done'
    });

  const handleUpdatePreferences = async (payload) =>
    runAction(() => updatePreferences(payload), {
      success: 'Preferences saved',
      failure: 'Could not save your preferences'
    });

  // Deliberately not memoised. The previous version hand-maintained a
  // dependency array that had drifted out of sync with the state it exposed —
  // `isExportOpen` was missing, so the Export dialog could never actually open.
  // The provider only re-renders when its own state changes, which is exactly
  // when consumers need to update anyway.
  const value = {
    user,
    isAuthLoading,
    registrationEnabled,
    authError,
    isAuthenticating,
    isAuthenticated,
    login,
    register,
    logout,
    setAuthError,
    updatePreferences: handleUpdatePreferences,
    changePassword,
    deleteAccount,

    toasts,
    dismissToast,
    notify,
    reportError,

    confirm,
    confirmRequest,
    resolveConfirm,

    theme,
    resolvedTheme,
    setTheme,

    ...trackerData,
    trackers,
    visibleTrackers,
    selectedTracker,
    selectedTrackerId,

    ...analytics,
    analytics,
    canManageSelectedTracker,

    isSidebarOpen,
    setIsSidebarOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    isImportOpen,
    setIsImportOpen,
    isGroupManagementOpen,
    setIsGroupManagementOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    collapsedCategories,
    setCollapsedCategories,
    isTrackerModalOpen,
    setIsTrackerModalOpen,
    isCategoryMenuOpen,
    setIsCategoryMenuOpen,
    isTypeMenuOpen,
    setIsTypeMenuOpen,
    isGroupMenuOpen,
    setIsGroupMenuOpen,
    isLogModalOpen,
    setIsLogModalOpen,

    categoryMenuRef,
    typeMenuRef,
    groupMenuRef,
    trackerTypeOptions: TRACKER_TYPE_OPTIONS,

    openTrackerModal,
    handleTrackerSubmit,
    handleDeleteTracker,
    handleArchiveTracker,
    handleUnarchiveTracker,
    handleToggleTrackerStatus,
    handleResetTracker,
    handleJournalSubmit,
    handleDeleteJournal,
    handleLogSubmit,
    handleDeleteLog,
    handleQuickBooleanLog
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
