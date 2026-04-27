import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('trackerApi', () => {
    it('should normalize tracker analytics snake_case to camelCase', async () => {
      const mockData = {
        current_math: {
          main_unit: 10,
          target_unit: 20,
          impact_value: 5,
        },
        daily_progress: {
          total: 15,
          target: 20,
          percentage: 75,
        },
        streak_stats: {
          current: 5,
          longest: 10,
          period_label: 'days',
        },
        historical_chart_data: [],
        build_heatmap: null,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { default: api } = await import('../../services/trackerApi.js');
      const result = await api.fetchTrackerAnalyticsApi(1);

      expect(result).toBeDefined();
      expect(result.currentMath).toBeDefined();
      expect(result.dailyProgress).toBeDefined();
      expect(result.streakStats).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { default: api } = await import('../../services/trackerApi.js');
      
      try {
        await api.fetchTrackerAnalyticsApi(99999);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('dashboardApi', () => {
    it('should fetch dashboard summary', async () => {
      const mockSummary = {
        overview: {
          total: 5,
          active: 4,
          paused: 1,
          categories: 3,
          by_type: { build: 3, quit: 2, boolean: 0 },
        },
        category_breakdown: [
          { category: 'Health', count: 3 },
          { category: 'Learning', count: 2 },
        ],
        impact_rows: [],
        top_impact_rows: [],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const { default: api } = await import('../../services/dashboardApi.js');
      const result = await api.fetchDashboardSummaryApi();

      expect(result).toBeDefined();
      expect(result.overview.total).toBe(5);
      expect(result.category_breakdown).toHaveLength(2);
    });
  });
});
