import { useEffect, useMemo, useState } from 'react';
import {
  DAY_MS,
  toUtcDateKey,
  parseApiDate,
  formatShortDate,
  periodStart,
  addPeriod
} from '../utils/date';

const PERIOD_LABELS = {
  day: { singular: 'day', plural: 'days' },
  week: { singular: 'week', plural: 'weeks' },
  month: { singular: 'month', plural: 'months' },
  year: { singular: 'year', plural: 'years' }
};

const getIntervalCount = (tracker) => Math.max(1, Number(tracker?.units_per_interval || 1));

const shiftPeriod = (date, period, amount) => {
  const d = new Date(date);

  if (period === 'week') {
    d.setUTCDate(d.getUTCDate() + amount * 7);
    return d;
  }
  if (period === 'month') {
    d.setUTCMonth(d.getUTCMonth() + amount);
    return d;
  }
  if (period === 'year') {
    d.setUTCFullYear(d.getUTCFullYear() + amount);
    return d;
  }

  d.setUTCDate(d.getUTCDate() + amount);
  return d;
};

const getPeriodsBetween = (startDate, endDate, period) => {
  const start = periodStart(startDate, period);
  const end = periodStart(endDate, period);

  if (period === 'day') {
    return Math.floor((end - start) / DAY_MS);
  }
  if (period === 'week') {
    return Math.floor((end - start) / (DAY_MS * 7));
  }
  if (period === 'month') {
    return (
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth())
    );
  }
  return end.getUTCFullYear() - start.getUTCFullYear();
};

const getWindowDetails = (date, anchor, period, intervalCount) => {
  const baseDate = periodStart(date, period);
  const diffPeriods = getPeriodsBetween(anchor, baseDate, period);
  const windowIndex = Math.floor(diffPeriods / intervalCount);
  const start = shiftPeriod(anchor, period, windowIndex * intervalCount);
  const end = shiftPeriod(start, period, intervalCount);
  return { windowIndex, start, end };
};

const getPeriodLabel = (period, intervalCount) => {
  if (intervalCount === 1) return PERIOD_LABELS[period]?.plural || 'days';
  return `${intervalCount}-${PERIOD_LABELS[period]?.singular || 'day'} windows`;
};

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
      const unitsInterval = getIntervalCount(selectedTracker);
      const timeBasedUnits =
        selectedTracker.units_per_amount *
        (diffMs / (getMsPerPeriod(selectedTracker.units_per) * unitsInterval));

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
            ? selectedTracker.units_per_amount /
              (getMsPerPeriod(selectedTracker.units_per) * unitsInterval)
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

      const periodToCheck = selectedTracker.units_per;
      const intervalCount = getIntervalCount(selectedTracker);
      const anchor = periodStart(parseApiDate(selectedTracker.start_date), periodToCheck);
      const { start, end } = getWindowDetails(new Date(), anchor, periodToCheck, intervalCount);

      const periodLogs = habitLogs.filter((log) => {
        const logDate = parseApiDate(log.timestamp);
        return logDate >= start && logDate < end;
      });

      const windowTotal = periodLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
      const windowTarget =
        selectedTracker.type === 'boolean'
          ? 1
          : Math.max(0, Number(selectedTracker.units_per_amount || 0));

      const percentage = windowTarget > 0 ? Math.min(100, (windowTotal / windowTarget) * 100) : 0;
      setDailyProgress({ total: windowTotal, target: windowTarget, percentage });
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
    const intervalCount = getIntervalCount(selectedTracker);

    const threshold =
      selectedTracker.type === 'boolean'
        ? 1
        : selectedTracker.type === 'build'
          ? Math.max(0, Number(selectedTracker.units_per_amount || 0))
          : 0.0001;

    const trackerStart = periodStart(parseApiDate(selectedTracker.start_date), streakPeriod);
    const totalsByWindow = new Map();

    habitLogs.forEach((log) => {
      const ts = parseApiDate(log.timestamp);
      const { windowIndex } = getWindowDetails(ts, trackerStart, streakPeriod, intervalCount);
      if (windowIndex < 0) return;
      totalsByWindow.set(windowIndex, (totalsByWindow.get(windowIndex) || 0) + Number(log.amount || 0));
    });

    const { windowIndex: currentWindowIndex } = getWindowDetails(
      new Date(),
      trackerStart,
      streakPeriod,
      intervalCount
    );

    let longest = 0;
    let running = 0;
    const completedPeriods = [];

    for (let i = 0; i <= currentWindowIndex; i += 1) {
      const amount = totalsByWindow.get(i) || 0;
      const done = amount >= threshold;
      completedPeriods.push(done);

      if (done) {
        running += 1;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }
    }

    let current = 0;
    for (let i = completedPeriods.length - 1; i >= 0; i -= 1) {
      if (!completedPeriods[i]) break;
      current += 1;
    }

    const periodLabel = getPeriodLabel(streakPeriod, intervalCount);

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
