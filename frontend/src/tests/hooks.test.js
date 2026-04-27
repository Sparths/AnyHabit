import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

describe('Custom Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('useTracker Analytics', () => {
    it('should fetch analytics when tracker id changes', async () => {
      const mockAnalytics = {
        currentMath: {
          mainUnit: 10,
          targetUnit: 20,
          impactValue: 5,
        },
        dailyProgress: {
          total: 15,
          target: 20,
          percentage: 75,
        },
        streakStats: {
          current: 5,
          longest: 10,
          periodLabel: 'days',
        },
        historicalChartData: [],
        buildHeatmap: null,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      });

      const { useTrackerAnalytics } = await import('../../hooks/useTrackerAnalytics.js');
      const mockTracker = { id: 1, name: 'Test' };

      const { result } = renderHook(() => useTrackerAnalytics(mockTracker));

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      expect(result.current).toMatchObject({
        currentMath: expect.any(Object),
        dailyProgress: expect.any(Object),
      });
    });

    it('should return default analytics when no tracker provided', () => {
      const { useTrackerAnalytics } = require('../../hooks/useTrackerAnalytics.js').default;

      const { result } = renderHook(() => useTrackerAnalytics(null));

      expect(result.current).toBeDefined();
      // Should have default shape
      expect(result.current).toHaveProperty('currentMath');
      expect(result.current).toHaveProperty('dailyProgress');
    });
  });
});

describe('useOutsideClick', () => {
  it('should call callback when clicking outside', () => {
    const callback = vi.fn();
    const { useOutsideClick } = require('../../hooks/useOutsideClick.js').default;
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useOutsideClick(ref, callback));

    // Click outside
    document.click();
    expect(callback).toHaveBeenCalled();
  });

  it('should not call callback when clicking inside', () => {
    const callback = vi.fn();
    const { useOutsideClick } = require('../../hooks/useOutsideClick.js').default;
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useOutsideClick(ref, callback));

    // Click inside
    element.click();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useTheme', () => {
  it('should toggle theme', () => {
    const { useTheme } = require('../../hooks/useTheme.js').default;

    const { result } = renderHook(() => useTheme());

    const initialTheme = result.current.theme;
    
    if (result.current.toggleTheme) {
      result.current.toggleTheme();
      expect(result.current.theme).not.toBe(initialTheme);
    }
  });
});
