import { useEffect, useState } from 'react';
import { fetchTrackerAnalyticsApi } from '../services/trackerApi';

const DEFAULT_ANALYTICS = {
  currentMath: { mainUnit: '0.0', targetUnit: '0.0', impactValue: '0.00' },
  dailyProgress: { total: 0, target: 0, percentage: 0 },
  historicalChartData: [],
  streakStats: { current: 0, longest: 0, periodLabel: 'days' },
  buildHeatmap: null
};

export function useTrackerAnalytics(selectedTracker, habitLogs, journals) {
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);

  useEffect(() => {
    if (!selectedTracker?.id) {
      setAnalytics(DEFAULT_ANALYTICS);
      return undefined;
    }

    let isCancelled = false;

    const loadAnalytics = async () => {
      try {
        const data = await fetchTrackerAnalyticsApi(selectedTracker.id);
        if (!isCancelled) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          setAnalytics(DEFAULT_ANALYTICS);
        }
      }
    };

    loadAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [selectedTracker?.id, habitLogs, journals]);

  return analytics;
}
