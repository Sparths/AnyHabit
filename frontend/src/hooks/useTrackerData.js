import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_JOURNAL_FORM,
  DEFAULT_LOG_FORM,
  DEFAULT_TRACKER_FORM
} from '../constants/tracker';
import {
  createBooleanLogApi,
  createLogApi,
  deleteJournalApi,
  deleteLogApi,
  deleteTrackerApi,
  fetchHabitLogsApi,
  fetchJournalsApi,
  fetchTrackersApi,
  resetTrackerApi,
  saveJournalApi,
  saveTrackerApi,
  toggleTrackerStatusApi
} from '../services/trackerApi';

export function useTrackerData() {
  const [trackers, setTrackers] = useState([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [journals, setJournals] = useState([]);
  const [journalFormData, setJournalFormData] = useState(DEFAULT_JOURNAL_FORM);

  const [habitLogs, setHabitLogs] = useState([]);
  const [logFormData, setLogFormData] = useState(DEFAULT_LOG_FORM);

  const [trackerFormData, setTrackerFormData] = useState(DEFAULT_TRACKER_FORM);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const fetchTrackers = async () => {
    try {
      const data = await fetchTrackersApi();
      const normalizedTrackers = data.map((tracker) => ({
        ...tracker,
        units_per_interval: Math.max(1, Number(tracker.units_per_interval || 1))
      }));
      setTrackers(normalizedTrackers);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchJournals = async (trackerId) => {
    try {
      const data = await fetchJournalsApi(trackerId);
      setJournals(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHabitLogs = async (trackerId) => {
    try {
      const data = await fetchHabitLogsApi(trackerId);
      setHabitLogs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTrackers();
  }, []);

  useEffect(() => {
    if (selectedTrackerId) {
      fetchJournals(selectedTrackerId);
      fetchHabitLogs(selectedTrackerId);
      setJournalFormData(DEFAULT_JOURNAL_FORM);
    } else {
      setJournals([]);
      setHabitLogs([]);
    }
  }, [selectedTrackerId]);

  const selectedTracker = useMemo(
    () => trackers.find((tracker) => tracker.id === selectedTrackerId),
    [trackers, selectedTrackerId]
  );

  const existingCategories = useMemo(() => {
    const categories = trackers.map((tracker) => (tracker.category || 'General').trim() || 'General');
    const uniqueCategories = new Set(['General', ...categories]);
    return [...uniqueCategories].sort((a, b) => a.localeCompare(b));
  }, [trackers]);

  const groupedTrackers = useMemo(
    () =>
      trackers.reduce((groups, tracker) => {
        const category = (tracker.category || 'General').trim() || 'General';
        if (!groups[category]) groups[category] = [];
        groups[category].push(tracker);
        return groups;
      }, {}),
    [trackers]
  );

  const sortedCategoryEntries = useMemo(
    () =>
      Object.entries(groupedTrackers)
        .map(([category, items]) => [category, [...items].sort((a, b) => a.name.localeCompare(b.name))])
        .sort(([a], [b]) => a.localeCompare(b)),
    [groupedTrackers]
  );

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

  const openTrackerModalData = (tracker = null) => {
    if (tracker) {
      const normalizedCategory = (tracker.category || 'General').trim() || 'General';
      setIsCreatingCategory(!existingCategories.includes(normalizedCategory));
      setTrackerFormData({
        ...tracker,
        category: normalizedCategory,
        units_per_interval: Math.max(1, Number(tracker.units_per_interval || 1))
      });
      return;
    }

    setIsCreatingCategory(false);
    setTrackerFormData({ ...DEFAULT_TRACKER_FORM });
  };

  const submitTracker = async () => {
    await saveTrackerApi(trackerFormData);
    await fetchTrackers();
  };

  const deleteTracker = async (id) => {
    await deleteTrackerApi(id);
    if (selectedTrackerId === id) setSelectedTrackerId(null);
    await fetchTrackers();
  };

  const toggleTrackerStatus = async (tracker) => {
    await toggleTrackerStatusApi(tracker);
    await fetchTrackers();
  };

  const resetTracker = async (trackerId) => {
    await resetTrackerApi(trackerId);
    await fetchTrackers();
    await fetchJournals(trackerId);
  };

  const submitJournal = async () => {
    if (!selectedTrackerId || !journalFormData.content.trim()) return;
    await saveJournalApi(selectedTrackerId, journalFormData);
    setJournalFormData(DEFAULT_JOURNAL_FORM);
    await fetchJournals(selectedTrackerId);
  };

  const deleteJournal = async (journalId) => {
    if (!selectedTrackerId) return;
    await deleteJournalApi(selectedTrackerId, journalId);
    await fetchJournals(selectedTrackerId);
  };

  const submitLog = async () => {
    if (!selectedTrackerId) return;
    await createLogApi(selectedTrackerId, logFormData);
    setLogFormData({ ...DEFAULT_LOG_FORM, timestamp: new Date().toISOString() });
    await fetchHabitLogs(selectedTrackerId);
  };

  const quickMarkBooleanDone = async () => {
    if (!selectedTrackerId) return;
    await createBooleanLogApi(selectedTrackerId);
    await fetchHabitLogs(selectedTrackerId);
  };

  const deleteLog = async (logId) => {
    if (!selectedTrackerId) return;
    await deleteLogApi(selectedTrackerId, logId);
    await fetchHabitLogs(selectedTrackerId);
  };

  return {
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
    fetchHabitLogs,
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
  };
}
