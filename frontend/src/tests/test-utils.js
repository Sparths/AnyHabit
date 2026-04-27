import { render } from '@testing-library/react';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    // Add any providers needed for your app here (Context, Redux, etc.)
    return children;
  }
  
  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock tracker data for tests
 */
export const mockTracker = {
  id: 1,
  name: 'Reading',
  category: 'Learning',
  type: 'build',
  unit: 'pages',
  units_per_amount: 2,
  units_per: 'day',
  units_per_interval: 1,
  impact_amount: 5.0,
  impact_per: 'day',
  is_active: true,
  start_date: '2024-03-01T00:00:00',
};

/**
 * Mock analytics data for tests
 */
export const mockAnalytics = {
  currentMath: {
    mainUnit: 45,
    targetUnit: 60,
    impactValue: 11.25,
  },
  dailyProgress: {
    total: 45,
    target: 60,
    percentage: 75,
  },
  streakStats: {
    current: 5,
    longest: 12,
    periodLabel: 'days',
  },
  historicalChartData: [
    { date: '2024-03-10', label: 'Mar 10', value: 30, cumulative: 30 },
    { date: '2024-03-11', label: 'Mar 11', value: 25, cumulative: 55 },
    { date: '2024-03-12', label: 'Mar 12', value: 35, cumulative: 90 },
  ],
  buildHeatmap: {
    columns: [
      [
        { date: '2024-03-03', amount: 20, is_filler: false },
        { date: '2024-03-10', amount: 30, is_filler: false },
      ],
    ],
    maxAmount: 50,
  },
};

/**
 * Mock dashboard summary data
 */
export const mockDashboardSummary = {
  overview: {
    total: 5,
    active: 4,
    paused: 1,
    categories: 3,
    by_type: {
      build: 3,
      quit: 2,
      boolean: 0,
    },
  },
  category_breakdown: [
    { category: 'Learning', count: 3 },
    { category: 'Health', count: 2 },
  ],
  impact_rows: [
    {
      tracker: 'Reading',
      main_amount: 45,
      impact_value: 11.25,
      month_impact: 337.5,
      mode_label: '45 pages',
    },
    {
      tracker: 'Exercise',
      main_amount: 120,
      impact_value: 24,
      month_impact: 720,
      mode_label: '120 minutes',
    },
  ],
  top_impact_rows: [
    {
      tracker: 'Exercise',
      main_amount: 120,
      impact_value: 24,
      month_impact: 720,
      mode_label: '120 minutes',
    },
  ],
};

/**
 * Mock habit logs
 */
export const mockLogs = [
  {
    id: 1,
    tracker_id: 1,
    timestamp: '2024-03-12T00:00:00',
    amount: 25,
  },
  {
    id: 2,
    tracker_id: 1,
    timestamp: '2024-03-11T00:00:00',
    amount: 20,
  },
];

/**
 * Mock journal entries
 */
export const mockJournals = [
  {
    id: 1,
    tracker_id: 1,
    timestamp: '2024-03-12T00:00:00',
    mood: 8,
    content: 'Great reading session!',
    is_relapse: false,
  },
  {
    id: 2,
    tracker_id: 1,
    timestamp: '2024-03-11T00:00:00',
    mood: 7,
    content: 'Productive day',
    is_relapse: false,
  },
];
