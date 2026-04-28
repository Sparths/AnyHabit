import TrackerHeader from './tracker/TrackerHeader';
import TrackerStats from './tracker/TrackerStats';
import TrackerCharts from './tracker/TrackerCharts';
import TrackerLeaderboard from './tracker/TrackerLeaderboard';
import JournalSection from './tracker/JournalSection';

function TrackerView({
  selectedTracker,
  dailyProgress,
  currentMath,
  streakStats,
  historicalChartData,
  buildHeatmap,
  shareStats,
  habitLogs,
  deleteLog,
  setIsSidebarOpen,
  setSelectedCategory,
  setIsLogModalOpen,
  setLogFormData,
  onQuickBooleanLog,
  handleResetTracker,
  toggleTrackerStatus,
  openTrackerModal,
  deleteTracker,
  journalFormData,
  setJournalFormData,
  handleJournalSubmit,
  journals,
  deleteJournal
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <TrackerHeader
        selectedTracker={selectedTracker}
        dailyProgress={dailyProgress}
        setIsSidebarOpen={setIsSidebarOpen}
        setSelectedCategory={setSelectedCategory}
        setIsLogModalOpen={setIsLogModalOpen}
        setLogFormData={setLogFormData}
        onQuickBooleanLog={onQuickBooleanLog}
        handleResetTracker={handleResetTracker}
        toggleTrackerStatus={toggleTrackerStatus}
        openTrackerModal={openTrackerModal}
        deleteTracker={deleteTracker}
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
          deleteLog={deleteLog}
        />

        <TrackerLeaderboard shareStats={shareStats} />

        <JournalSection
          journalFormData={journalFormData}
          setJournalFormData={setJournalFormData}
          handleJournalSubmit={handleJournalSubmit}
          journals={journals}
          deleteJournal={deleteJournal}
        />
      </div>
    </div>
  );
}

export default TrackerView;
