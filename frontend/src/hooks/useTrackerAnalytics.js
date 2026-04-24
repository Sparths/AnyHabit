import { useEffect, useMemo, useState } from 'react';
import {
  isSamePeriod,
  DAY_MS,
  toUtcDateKey,
  parseApiDate,
  formatShortDate,
  periodStart,
  addPeriod
} from '../utils/date';

export function useTrackerAnalytics(selectedTracker, habitLogs, journals) {
  const [currentMath, setCurrentMath] = useState({ mainUnit: 0, targetUnit: 0, impactValue: 0 });
  const [dailyProgress, setDailyProgress] = useState({ total: 0, target: 0, percentage: 0 });

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

  const dailyLogMap = useMemo(() => {
    const map = new Map();
    habitLogs.forEach((log) => {
      const timestamp = parseApiDate(log.timestamp);
      const key = toUtcDateKey(timestamp);
      map.set(key, (map.get(key) || 0) + Number(log.amount || 0));
    });
    return map;
  }, [habitLogs]);

  const relapseDayKeys = useMemo(() => {
    const keys = new Set();
    journals
      .filter((entry) => entry.is_relapse === true)
      .forEach((entry) => {
        const ts = parseApiDate(entry.timestamp);
        keys.add(toUtcDateKey(periodStart(ts, 'day')));
      });
    return keys;
  }, [journals]);

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
      let runningStreak = 0;
      for (let i = 0; i < lookbackDays; i += 1) {
        const cursor = new Date(startDate);
        cursor.setUTCDate(startDate.getUTCDate() + i);
        const key = toUtcDateKey(cursor);

        if (cursor < trackerStart) {
          runningStreak = 0;
        } else if (relapseDayKeys.has(key)) {
          runningStreak = 0;
        } else {
          runningStreak += 1;
        }

        points.push({
          date: key,
          label: formatShortDate(cursor),
          value: runningStreak
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
  }, [selectedTracker, dailyLogMap, relapseDayKeys]);

  const streakStats = useMemo(() => {
    if (!selectedTracker) {
      return { current: 0, longest: 0, periodLabel: 'days' };
    }

    if (selectedTracker.type === 'quit') {
      const today = periodStart(new Date(), 'day');
      const trackerStartDay = periodStart(parseApiDate(selectedTracker.start_date), 'day');

      const relapseDayValues = new Set(
        journals
          .filter((entry) => entry.is_relapse === true)
          .map((entry) => periodStart(parseApiDate(entry.timestamp), 'day').getTime())
      );

      const relapseMoments = [...relapseDayValues]
        .map((timeValue) => new Date(timeValue))
        .sort((a, b) => a - b);

      let segmentStart = trackerStartDay;
      let longest = 0;
      relapseMoments.forEach((relapseDay) => {
        const spanDays = Math.max(0, Math.floor((relapseDay - segmentStart) / DAY_MS));
        longest = Math.max(longest, spanDays);
        segmentStart = addPeriod(relapseDay, 'day');
      });

      let current = 0;
      if (today >= segmentStart) {
        current = Math.floor((today - segmentStart) / DAY_MS) + 1;
      }

      longest = Math.max(longest, current);

      return { current, longest, periodLabel: 'days' };
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

  return {
    currentMath,
    dailyProgress,
    historicalChartData,
    streakStats,
    buildHeatmap
  };
}
