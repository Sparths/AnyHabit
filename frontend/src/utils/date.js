export const DAY_MS = 1000 * 60 * 60 * 24;

export const isSamePeriod = (logDate, period) => {
  const d1 = new Date(logDate);
  const now = new Date();

  if (period === 'day') {
    return d1.toDateString() === now.toDateString();
  }
  if (period === 'month') {
    return d1.getMonth() === now.getMonth() && d1.getFullYear() === now.getFullYear();
  }
  if (period === 'year') {
    return d1.getFullYear() === now.getFullYear();
  }
  if (period === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d1 >= startOfWeek && d1 < endOfWeek;
  }
  return false;
};

export const toUtcDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseApiDate = (value) => {
  if (!value) return new Date();
  const normalized = value.endsWith('Z') ? value : `${value}Z`;
  return new Date(normalized);
};

export const formatShortDate = (date) =>
  date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const periodStart = (date, period) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);

  if (period === 'week') {
    const weekday = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - weekday);
    return d;
  }
  if (period === 'month') {
    d.setUTCDate(1);
    return d;
  }
  if (period === 'year') {
    d.setUTCMonth(0, 1);
    return d;
  }
  return d;
};

export const addPeriod = (date, period) => {
  const d = new Date(date);
  if (period === 'week') {
    d.setUTCDate(d.getUTCDate() + 7);
    return d;
  }
  if (period === 'month') {
    d.setUTCMonth(d.getUTCMonth() + 1);
    return d;
  }
  if (period === 'year') {
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    return d;
  }
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
};
