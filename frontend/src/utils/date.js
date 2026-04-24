export const DAY_MS = 1000 * 60 * 60 * 24;

export const isSamePeriod = (logDate, period) => {
  const logStart = periodStart(logDate, period);
  const nowStart = periodStart(new Date(), period);
  return logStart.getTime() === nowStart.getTime();
};

export const toUtcDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseApiDate = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) return new Date(value);

  const raw = String(value).trim();
  if (!raw) return new Date();

  
  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
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
