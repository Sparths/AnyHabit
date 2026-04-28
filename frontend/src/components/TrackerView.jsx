import TrackerHeader from './tracker/TrackerHeader';
import TrackerStats from './tracker/TrackerStats';
import TrackerCharts from './tracker/TrackerCharts';
import TrackerLeaderboard from './tracker/TrackerLeaderboard';
import JournalSection from './tracker/JournalSection';
import { useAppState } from '../state/AppStateContext';

function TrackerView() {
  const {
    selectedTracker,
    canManageSelectedTracker,
    dailyProgress,
    currentMath,
    streakStats,
    historicalChartData,
    buildHeatmap,
    shareStats,
    habitLogs,
    handleDeleteLog,
    setIsSidebarOpen,
    setSelectedCategory,
    setIsLogModalOpen,
    setLogFormData,
    handleQuickBooleanLog,
    handleResetTracker,
    handleToggleTrackerStatus,
    openTrackerModal,
    handleDeleteTracker,
    journalFormData,
    setJournalFormData,
    handleJournalSubmit,
    journals,
    handleDeleteJournal
  } = useAppState();

  if (!selectedTracker) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <TrackerHeader
        selectedTracker={selectedTracker}
        canManageTracker={canManageSelectedTracker}
        dailyProgress={dailyProgress}
        setIsSidebarOpen={setIsSidebarOpen}
        setSelectedCategory={setSelectedCategory}
        setIsLogModalOpen={setIsLogModalOpen}
        setLogFormData={setLogFormData}
        onQuickBooleanLog={handleQuickBooleanLog}
        handleResetTracker={handleResetTracker}
        toggleTrackerStatus={handleToggleTrackerStatus}
        openTrackerModal={openTrackerModal}
        deleteTracker={handleDeleteTracker}
      />

      <TrackerStats
        selectedTracker={selectedTracker}
        dailyProgress={dailyProgress}
        currentMath={currentMath}
        streakStats={streakStats}
        shareStats={shareStats}
      />

      <div className="px-4 md:px-10 pb-10 flex flex-col">
        <TrackerCharts
          selectedTracker={selectedTracker}
          historicalChartData={historicalChartData}
          buildHeatmap={buildHeatmap}
          habitLogs={habitLogs}
          deleteLog={handleDeleteLog}
        />

        <TrackerLeaderboard shareStats={shareStats} />

        <JournalSection
          journalFormData={journalFormData}
          setJournalFormData={setJournalFormData}
          handleJournalSubmit={handleJournalSubmit}
          journals={journals}
          deleteJournal={handleDeleteJournal}
        />
      </div>
    </div>
  );
}

export default TrackerView;
