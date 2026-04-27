import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Check,
  Coins,
  GripHorizontal,
  Layers,
  Menu,
  Plus,
  RefreshCcw,
  Settings,
  X
} from 'lucide-react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { fetchHomeDashboardApi, saveHomeDashboardApi } from '../../services/dashboardApi';
import { fetchHabitLogsApi } from '../../services/trackerApi';
import { DAY_MS, parseApiDate } from '../../utils/date';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GRID_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
};

const GRID_COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
};

const PERIOD_MS = {
  day: DAY_MS,
  week: DAY_MS * 7,
  month: DAY_MS * 30.44,
  year: DAY_MS * 365.25
};

const WIDGET_DEFINITIONS = {
  impactSummary: {
    label: 'Impact Totals',
    icon: Coins,
    description: 'Aggregate all impact units from selected trackers.',
    defaultSize: { w: 7, h: 10, minW: 4, minH: 6 },
    defaultConfig: { autoSelect: true, selectedTrackerIds: [] }
  },
  trackerOverview: {
    label: 'Tracker Overview',
    icon: Activity,
    description: 'See active tracker stats at a glance.',
    defaultSize: { w: 5, h: 6, minW: 3, minH: 5 },
    defaultConfig: {}
  },
  categoryBreakdown: {
    label: 'Category Breakdown',
    icon: Layers,
    description: 'View tracker distribution by category.',
    defaultSize: { w: 5, h: 6, minW: 3, minH: 4 },
    defaultConfig: {}
  },
  topImpact: {
    label: 'Top Impact Rates',
    icon: BarChart3,
    description: 'Trackers ranked by estimated monthly impact rate.',
    defaultSize: { w: 6, h: 6, minW: 3, minH: 4 },
    defaultConfig: {}
  }
};

const WIDGET_TYPE_ALIASES = {
  finance: 'impactSummary'
};

const WIDGET_TYPES = Object.keys(WIDGET_DEFINITIONS);

const EMPTY_LAYOUTS = Object.keys(GRID_COLS).reduce((acc, breakpoint) => {
  acc[breakpoint] = [];
  return acc;
}, {});

const normalizeCategory = (value) => (value || 'General').trim() || 'General';

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatImpact = (value) =>
  toSafeNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatValue = (value, decimals = 1) =>
  toSafeNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

const getPeriodMs = (period) => PERIOD_MS[period] || DAY_MS;

const createWidgetId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeImpactConfig = (config) => {
  const base = config && typeof config === 'object' ? config : {};

  return {
    autoSelect: base.autoSelect !== false,
    selectedTrackerIds: Array.isArray(base.selectedTrackerIds)
      ? [...new Set(base.selectedTrackerIds.map((id) => toSafeNumber(id)).filter((id) => id > 0))]
      : []
  };
};

const normalizeWidget = (rawWidget) => {
  if (!rawWidget || typeof rawWidget !== 'object') return null;

  const rawType = typeof rawWidget.type === 'string' ? rawWidget.type : '';
  const resolvedType = WIDGET_TYPE_ALIASES[rawType] || rawType;
  const definition = WIDGET_DEFINITIONS[resolvedType];
  if (!definition) return null;

  const id = typeof rawWidget.id === 'string' && rawWidget.id.trim() ? rawWidget.id : `${resolvedType}-${createWidgetId()}`;
  const title =
    typeof rawWidget.title === 'string' && rawWidget.title.trim() ? rawWidget.title.trim() : definition.label;

  const config =
    resolvedType === 'impactSummary'
      ? normalizeImpactConfig(rawWidget.config)
      : rawWidget.config && typeof rawWidget.config === 'object'
        ? { ...rawWidget.config }
        : { ...definition.defaultConfig };

  return {
    id,
    type: resolvedType,
    title,
    config
  };
};

const normalizeWidgets = (rawWidgets) => {
  if (!Array.isArray(rawWidgets)) return [];

  return rawWidgets
    .map(normalizeWidget)
    .filter(Boolean)
    .map((widget, index) => {
      if (index === 0) return widget;
      return {
        ...widget,
        id: widget.id || `${widget.type}-${createWidgetId()}`
      };
    });
};

const buildLayoutItem = (widget, breakpoint, index) => {
  const definition = WIDGET_DEFINITIONS[widget.type] || WIDGET_DEFINITIONS.trackerOverview;
  const { defaultSize } = definition;
  const cols = GRID_COLS[breakpoint];

  const width = Math.max(1, Math.min(toSafeNumber(defaultSize.w) || 1, cols));
  const height = Math.max(2, toSafeNumber(defaultSize.h) || 2);
  const minW = Math.max(1, Math.min(toSafeNumber(defaultSize.minW) || 1, width));
  const minH = Math.max(2, toSafeNumber(defaultSize.minH) || 2);

  const itemsPerRow = Math.max(1, Math.floor(cols / width));
  const x = (index % itemsPerRow) * width;
  const y = Math.floor(index / itemsPerRow) * height;

  return {
    i: widget.id,
    x,
    y,
    w: width,
    h: height,
    minW,
    minH
  };
};

const normalizeLayoutItem = (item, cols, fallback) => {
  const width = Math.max(1, Math.min(toSafeNumber(item.w) || fallback.w, cols));
  const minW = Math.max(1, Math.min(toSafeNumber(item.minW) || fallback.minW, width));
  const minH = Math.max(2, toSafeNumber(item.minH) || fallback.minH);
  const height = Math.max(minH, toSafeNumber(item.h) || fallback.h);

  const maxX = Math.max(0, cols - width);
  const x = Math.max(0, Math.min(Math.floor(toSafeNumber(item.x)), maxX));
  const y = Math.max(0, Math.floor(toSafeNumber(item.y)));

  return {
    i: fallback.i,
    x,
    y,
    w: width,
    h: height,
    minW,
    minH
  };
};

const ensureLayouts = (widgets, rawLayouts = {}) => {
  const sourceLayouts = rawLayouts && typeof rawLayouts === 'object' ? rawLayouts : {};

  return Object.keys(GRID_COLS).reduce((acc, breakpoint) => {
    const cols = GRID_COLS[breakpoint];
    const entries = Array.isArray(sourceLayouts[breakpoint]) ? sourceLayouts[breakpoint] : [];

    const layoutById = new Map(
      entries
        .filter((entry) => entry && typeof entry.i === 'string')
        .map((entry) => [entry.i, entry])
    );

    acc[breakpoint] = widgets.map((widget, index) => {
      const fallback = buildLayoutItem(widget, breakpoint, index);
      const existing = layoutById.get(widget.id);

      if (!existing) return fallback;
      return normalizeLayoutItem(existing, cols, fallback);
    });

    return acc;
  }, {});
};

const appendWidgetToLayouts = (currentLayouts, existingWidgets, nextWidget) => {
  const normalizedLayouts = ensureLayouts(existingWidgets, currentLayouts);

  return Object.keys(GRID_COLS).reduce((acc, breakpoint) => {
    const breakpointLayout = normalizedLayouts[breakpoint] || [];
    const baseItem = buildLayoutItem(nextWidget, breakpoint, breakpointLayout.length);
    const nextY = breakpointLayout.reduce((maxY, item) => Math.max(maxY, item.y + item.h), 0);

    acc[breakpoint] = [
      ...breakpointLayout,
      {
        ...baseItem,
        x: 0,
        y: nextY
      }
    ];

    return acc;
  }, {});
};

const getSelectedImpactTrackerIds = (widget, trackerMap, candidateIds) => {
  const config = normalizeImpactConfig(widget.config);

  if (config.autoSelect) {
    return candidateIds;
  }

  return config.selectedTrackerIds.filter((trackerId) => !!trackerMap[trackerId]);
};

const getImpactPerDay = (tracker) => {
  const impactAmount = toSafeNumber(tracker.impact_amount);
  if (impactAmount <= 0 || tracker.type === 'boolean') return 0;

  return (impactAmount / getPeriodMs(tracker.impact_per)) * DAY_MS;
};

const getImpactContribution = (tracker, logs = []) => {
  const trackerType = tracker.type;
  const interval = Math.max(1, toSafeNumber(tracker.units_per_interval) || 1);
  const impactAmount = toSafeNumber(tracker.impact_amount);

  if (trackerType === 'boolean' || impactAmount <= 0) {
    return {
      impactValue: 0,
      mainAmount: 0,
      modeLabel: 'No impact configured'
    };
  }

  if (trackerType === 'quit') {
    const startDate = parseApiDate(tracker.start_date);
    const diffMs = Math.max(0, Date.now() - startDate.getTime());

    const avoidedUnits =
      toSafeNumber(tracker.units_per_amount) * (diffMs / (getPeriodMs(tracker.units_per) * interval));

    const impactValue = impactAmount * (diffMs / getPeriodMs(tracker.impact_per));

    return {
      impactValue: Math.max(0, impactValue),
      mainAmount: Math.max(0, avoidedUnits),
      modeLabel: 'Time based'
    };
  }

  const totalLogged = logs.reduce((sum, log) => sum + toSafeNumber(log.amount), 0);
  const impactPerMs = impactAmount / getPeriodMs(tracker.impact_per);
  const unitsPerMs =
    toSafeNumber(tracker.units_per_amount) > 0
      ? toSafeNumber(tracker.units_per_amount) / (getPeriodMs(tracker.units_per) * interval)
      : 0;

  const impactPerUnit = unitsPerMs > 0 ? impactPerMs / unitsPerMs : 0;
  const impactValue = totalLogged * impactPerUnit;

  return {
    impactValue: Math.max(0, impactValue),
    mainAmount: Math.max(0, totalLogged),
    modeLabel: 'From logs'
  };
};

function HomePage({ trackers, setIsSidebarOpen, onSelectTracker, onSelectCategory, openTrackerModal }) {
  const {
    width: gridWidth,
    mounted: isGridMounted,
    containerRef: gridContainerRef
  } = useContainerWidth({ measureBeforeMount: true, initialWidth: 1280 });

  const [widgets, setWidgets] = useState([]);
  const [layouts, setLayouts] = useState({ ...EMPTY_LAYOUTS });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardLoadError, setDashboardLoadError] = useState('');
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [dashboardSaveError, setDashboardSaveError] = useState('');

  const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);
  const [activeWidgetSettingsId, setActiveWidgetSettingsId] = useState(null);

  const [logsByTrackerId, setLogsByTrackerId] = useState({});
  const [isRefreshingImpactWidget, setIsRefreshingImpactWidget] = useState({});

  const saveRequestIdRef = useRef(0);

  const trackerMap = useMemo(
    () =>
      trackers.reduce((acc, tracker) => {
        acc[tracker.id] = tracker;
        return acc;
      }, {}),
    [trackers]
  );

  const impactCandidates = useMemo(
    () =>
      trackers
        .filter((tracker) => tracker.type !== 'boolean' && toSafeNumber(tracker.impact_amount) > 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [trackers]
  );

  const impactCandidateIds = useMemo(() => impactCandidates.map((tracker) => tracker.id), [impactCandidates]);

  const selectedImpactBuildTrackerIds = useMemo(() => {
    const selectedIds = new Set();

    widgets
      .filter((widget) => widget.type === 'impactSummary')
      .forEach((widget) => {
        getSelectedImpactTrackerIds(widget, trackerMap, impactCandidateIds).forEach((trackerId) => {
          if (trackerMap[trackerId]?.type === 'build') {
            selectedIds.add(trackerId);
          }
        });
      });

    return [...selectedIds];
  }, [widgets, trackerMap, impactCandidateIds]);

  const activeWidgetForSettings = useMemo(
    () => widgets.find((widget) => widget.id === activeWidgetSettingsId) || null,
    [widgets, activeWidgetSettingsId]
  );

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoadingDashboard(true);
      setDashboardLoadError('');

      try {
        const response = await fetchHomeDashboardApi();
        if (cancelled) return;

        const loadedWidgets = normalizeWidgets(response.widgets);
        setWidgets(loadedWidgets);
        setLayouts(ensureLayouts(loadedWidgets, response.layouts));
      } catch (error) {
        console.error(error);
        if (cancelled) return;

        setDashboardLoadError('Could not load your dashboard.');
        setWidgets([]);
        setLayouts({ ...EMPTY_LAYOUTS });
      } finally {
        if (!cancelled) {
          setIsLoadingDashboard(false);
          setIsHydrated(true);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const currentRequestId = ++saveRequestIdRef.current;

    const timer = setTimeout(async () => {
      setDashboardSaveError('');
      setIsSavingDashboard(true);

      try {
        await saveHomeDashboardApi({ widgets, layouts });

        if (saveRequestIdRef.current === currentRequestId) {
          setIsSavingDashboard(false);
        }
      } catch (error) {
        console.error(error);

        if (saveRequestIdRef.current === currentRequestId) {
          setDashboardSaveError('Could not save dashboard changes.');
          setIsSavingDashboard(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [widgets, layouts, isHydrated]);

  useEffect(() => {
    if (!selectedImpactBuildTrackerIds.length) return;

    const missingIds = selectedImpactBuildTrackerIds.filter((trackerId) => !Array.isArray(logsByTrackerId[trackerId]));
    if (!missingIds.length) return;

    let cancelled = false;

    const fetchLogs = async () => {
      try {
        const entries = await Promise.all(
          missingIds.map(async (trackerId) => {
            const logs = await fetchHabitLogsApi(trackerId);
            return [trackerId, logs];
          })
        );

        if (cancelled) return;

        setLogsByTrackerId((prev) => {
          const next = { ...prev };
          entries.forEach(([trackerId, logs]) => {
            next[trackerId] = logs;
          });
          return next;
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [selectedImpactBuildTrackerIds, logsByTrackerId]);

  const handleAddWidget = (widgetType) => {
    const definition = WIDGET_DEFINITIONS[widgetType];
    if (!definition) return;

    const nextWidget = {
      id: `${widgetType}-${createWidgetId()}`,
      type: widgetType,
      title: definition.label,
      config: { ...definition.defaultConfig }
    };

    setWidgets((prevWidgets) => {
      const updatedWidgets = [...prevWidgets, nextWidget];
      setLayouts((prevLayouts) => appendWidgetToLayouts(prevLayouts, prevWidgets, nextWidget));
      return updatedWidgets;
    });

    setIsWidgetPickerOpen(false);
  };

  const handleRemoveWidget = (widgetId) => {
    setWidgets((prevWidgets) => {
      const updatedWidgets = prevWidgets.filter((widget) => widget.id !== widgetId);
      setLayouts((prevLayouts) => ensureLayouts(updatedWidgets, prevLayouts));
      return updatedWidgets;
    });

    setActiveWidgetSettingsId((prev) => (prev === widgetId ? null : prev));
  };

  const handleClearDashboard = () => {
    setWidgets([]);
    setLayouts({ ...EMPTY_LAYOUTS });
    setActiveWidgetSettingsId(null);
  };

  const updateWidget = (widgetId, patch) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => {
        if (widget.id !== widgetId) return widget;
        return { ...widget, ...patch };
      })
    );
  };

  const updateWidgetTitle = (widgetId, nextTitle) => {
    updateWidget(widgetId, {
      title: String(nextTitle ?? '').slice(0, 80)
    });
  };

  const updateWidgetConfig = (widgetId, patch) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => {
        if (widget.id !== widgetId) return widget;

        return {
          ...widget,
          config: {
            ...(widget.config || {}),
            ...patch
          }
        };
      })
    );
  };

  const refreshImpactWidget = async (widgetId, trackerIds) => {
    const buildTrackerIds = trackerIds.filter((trackerId) => trackerMap[trackerId]?.type === 'build');
    if (!buildTrackerIds.length) return;

    setIsRefreshingImpactWidget((prev) => ({ ...prev, [widgetId]: true }));

    try {
      const entries = await Promise.all(
        buildTrackerIds.map(async (trackerId) => {
          const logs = await fetchHabitLogsApi(trackerId);
          return [trackerId, logs];
        })
      );

      setLogsByTrackerId((prev) => {
        const next = { ...prev };
        entries.forEach(([trackerId, logs]) => {
          next[trackerId] = logs;
        });
        return next;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshingImpactWidget((prev) => ({ ...prev, [widgetId]: false }));
    }
  };

  return (
    <div className="home-page flex-1 flex flex-col overflow-hidden bg-[#fcfcfc]">
      <div className="px-4 md:px-10 pt-6 md:pt-10 pb-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-stone-500 hover:text-stone-900">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">Home</h2>
              <p className="text-sm text-gray-500 mt-1">Build your own dashboard with custom widgets.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openTrackerModal()}
              className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Create Tracker
            </button>

            <button
              type="button"
              onClick={() => setIsWidgetPickerOpen(true)}
              className="px-3 py-2 text-sm font-medium rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add Widget
            </button>

            <button
              type="button"
              onClick={handleClearDashboard}
              className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCcw size={14} />
              Clear Dashboard
            </button>
          </div>
        </div>

        <div className="mt-3 min-h-5 text-xs text-gray-500 flex items-center gap-2">
          {isSavingDashboard && <span>Saving changes...</span>}
          {!isSavingDashboard && dashboardSaveError && <span className="text-rose-600">{dashboardSaveError}</span>}
          {!isSavingDashboard && !dashboardSaveError && isHydrated && <span>All changes saved to server.</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6" ref={gridContainerRef}>
        {isLoadingDashboard ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center text-gray-500">Loading dashboard...</div>
        ) : dashboardLoadError ? (
          <div className="bg-white border border-rose-100 rounded-3xl p-10 text-center text-rose-600">
            <p className="font-semibold">{dashboardLoadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        ) : widgets.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-10 text-center text-gray-500">
            <p className="text-lg font-semibold text-stone-800">Your dashboard is empty</p>
            <p className="text-sm mt-1">Add widgets to start building your personalized home screen.</p>
            <button
              type="button"
              onClick={() => setIsWidgetPickerOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Add your first widget
            </button>
          </div>
        ) : (
          !isGridMounted ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center text-gray-500">Preparing layout...</div>
          ) : (
            <ResponsiveGridLayout
              className="home-grid"
              width={gridWidth}
              layouts={ensureLayouts(widgets, layouts)}
              breakpoints={GRID_BREAKPOINTS}
              cols={GRID_COLS}
              rowHeight={28}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              isDraggable={true}
              isResizable={true}
              draggableHandle=".widget-drag-handle"
              compactType={null}
              preventCollision={false}
              onLayoutChange={(_, allLayouts) => {
                setLayouts(ensureLayouts(widgets, allLayouts));
              }}
            >
              {widgets.map((widget) => {
                const definition = WIDGET_DEFINITIONS[widget.type];
                if (!definition) return null;

                const Icon = definition.icon;
                const isImpactWidget = widget.type === 'impactSummary';
                const impactConfig = isImpactWidget ? normalizeImpactConfig(widget.config) : null;
                const selectedTrackerIds = isImpactWidget
                  ? getSelectedImpactTrackerIds(widget, trackerMap, impactCandidateIds)
                  : [];
                const impactSourceLabel = isImpactWidget
                  ? impactConfig?.autoSelect
                    ? `Source: all impact-enabled trackers (${selectedTrackerIds.length})`
                    : `Source: ${selectedTrackerIds.length} selected tracker${selectedTrackerIds.length === 1 ? '' : 's'}`
                  : '';

                return (
                  <div key={widget.id}>
                    <div className="home-widget-card h-full bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                      <div className="widget-drag-handle px-4 py-3 border-b border-gray-100 bg-white/90 cursor-grab flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <GripHorizontal size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="rounded-md p-1.5 bg-stone-100 text-stone-700 flex-shrink-0">
                            <Icon size={14} />
                          </span>
                          <span className="text-sm font-semibold text-stone-900 truncate">
                            {widget.title || definition.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveWidgetSettingsId((prev) => (prev === widget.id ? null : widget.id))}
                            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-center transition-colors"
                            aria-label="Edit widget"
                          >
                            <Settings size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWidget(widget.id)}
                            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                            aria-label="Remove widget"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto p-4">
                        {widget.type === 'impactSummary' && (
                          <ImpactSummaryWidget
                            selectedTrackers={selectedTrackerIds.map((trackerId) => trackerMap[trackerId]).filter(Boolean)}
                            logsByTrackerId={logsByTrackerId}
                            isRefreshing={!!isRefreshingImpactWidget[widget.id]}
                            onRefresh={() => refreshImpactWidget(widget.id, selectedTrackerIds)}
                            onOpenTracker={(tracker) => onSelectTracker(tracker.id, normalizeCategory(tracker.category))}
                            sourceLabel={impactSourceLabel}
                          />
                        )}

                        {widget.type === 'trackerOverview' && <TrackerOverviewWidget trackers={trackers} />}

                        {widget.type === 'categoryBreakdown' && (
                          <CategoryBreakdownWidget
                            trackers={trackers}
                            onOpenCategory={(category) => onSelectCategory(category)}
                          />
                        )}

                        {widget.type === 'topImpact' && (
                          <TopImpactWidget
                            trackers={trackers}
                            onOpenTracker={(tracker) => onSelectTracker(tracker.id, normalizeCategory(tracker.category))}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </ResponsiveGridLayout>
          )
        )}
      </div>

      {activeWidgetForSettings && (
        <div className="fixed inset-0 z-[72] px-4 py-8 md:py-14" onClick={() => setActiveWidgetSettingsId(null)}>
          <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]" />

          <div
            className="relative max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl shadow-2xl p-4 md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-stone-900">Widget Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Customize title and widget-specific options.</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveWidgetSettingsId(null)}
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-center transition-colors"
                aria-label="Close widget settings"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4">
              <WidgetSettingsPanel
                key={activeWidgetForSettings.id}
                widget={activeWidgetForSettings}
                definition={WIDGET_DEFINITIONS[activeWidgetForSettings.type]}
                trackerMap={trackerMap}
                impactCandidates={impactCandidates}
                onTitleChange={(nextTitle) => updateWidgetTitle(activeWidgetForSettings.id, nextTitle)}
                onConfigChange={(patch) => updateWidgetConfig(activeWidgetForSettings.id, patch)}
              />
            </div>
          </div>
        </div>
      )}

      {isWidgetPickerOpen && (
        <div className="fixed inset-0 z-[70] px-4 py-8 md:py-14" onClick={() => setIsWidgetPickerOpen(false)}>
          <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]" />

          <div
            className="relative max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl shadow-2xl p-4 md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-stone-900">Add Widget</h3>
                <p className="text-sm text-gray-500 mt-1">Choose the widget you want to add to your home dashboard.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsWidgetPickerOpen(false)}
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {WIDGET_TYPES.map((widgetType) => {
                const definition = WIDGET_DEFINITIONS[widgetType];
                const Icon = definition.icon;

                return (
                  <button
                    key={widgetType}
                    type="button"
                    onClick={() => handleAddWidget(widgetType)}
                    className="text-left w-full rounded-2xl border border-gray-200 px-4 py-3 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-md p-1.5 bg-stone-100 text-stone-700">
                        <Icon size={14} />
                      </span>

                      <span className="block min-w-0">
                        <span className="block text-sm font-semibold text-stone-900">{definition.label}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{definition.description}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetSettingsPanel({
  widget,
  definition,
  trackerMap,
  impactCandidates,
  onTitleChange,
  onConfigChange
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Widget title</label>
          <button
            type="button"
            onClick={() => onTitleChange(definition.label)}
            className="text-xs font-medium text-gray-500 hover:text-stone-800"
          >
            Reset
          </button>
        </div>

        <input
          type="text"
          value={widget.title ?? ''}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={definition.label}
          className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-stone-400 bg-white text-sm text-stone-800"
          maxLength={80}
        />

        <p className="text-xs text-gray-500">This title is only visible on your dashboard.</p>
      </div>

      {widget.type === 'impactSummary' && (
        <ImpactTrackerSourceSettings
          widget={widget}
          trackerMap={trackerMap}
          impactCandidates={impactCandidates}
          onConfigChange={onConfigChange}
        />
      )}
    </div>
  );
}

function ImpactTrackerSourceSettings({ widget, trackerMap, impactCandidates, onConfigChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const config = normalizeImpactConfig(widget.config);
  const selectedTrackerIds = config.selectedTrackerIds.filter((trackerId) => !!trackerMap[trackerId]);

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return impactCandidates;

    return impactCandidates.filter((tracker) => {
      const name = tracker.name.toLowerCase();
      const category = normalizeCategory(tracker.category).toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }, [impactCandidates, searchTerm]);

  const enableAutoMode = () => {
    onConfigChange({ autoSelect: true, selectedTrackerIds: [] });
  };

  const enableManualMode = () => {
    onConfigChange({
      autoSelect: false,
      selectedTrackerIds: selectedTrackerIds.length ? selectedTrackerIds : impactCandidates.map((tracker) => tracker.id)
    });
  };

  const toggleTrackerSelection = (trackerId) => {
    const nextSelection = selectedTrackerIds.includes(trackerId)
      ? selectedTrackerIds.filter((id) => id !== trackerId)
      : [...selectedTrackerIds, trackerId];

    onConfigChange({ autoSelect: false, selectedTrackerIds: nextSelection });
  };

  const selectAllTrackers = () => {
    onConfigChange({
      autoSelect: false,
      selectedTrackerIds: impactCandidates.map((tracker) => tracker.id)
    });
  };

  const clearSelectedTrackers = () => {
    onConfigChange({ autoSelect: false, selectedTrackerIds: [] });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tracker source</p>
        <p className="text-xs text-gray-500 mt-1">Choose which trackers should contribute to this widget.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
            type="button"
            onClick={enableAutoMode}
            className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                config.autoSelect
                ? 'bg-stone-100 border-stone-300 text-stone-900 shadow-sm'
                : 'bg-white border-gray-200 text-stone-700 hover:bg-stone-50'
            }`}
            >
            All trackers
        </button>

        <button
            type="button"
            onClick={enableManualMode}
            className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                !config.autoSelect
                ? 'bg-stone-100 border-stone-300 text-stone-900 shadow-sm'
                : 'bg-white border-gray-200 text-stone-700 hover:bg-stone-50'
            }`}
            >
            Pick trackers
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {config.autoSelect
          ? `Using all impact-enabled trackers (${impactCandidates.length}).`
          : `Using ${selectedTrackerIds.length} selected tracker${selectedTrackerIds.length === 1 ? '' : 's'}.`}
      </p>

      {!config.autoSelect && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tracker"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-stone-400 bg-white text-sm text-stone-800"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllTrackers}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-stone-800 hover:bg-white"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearSelectedTrackers}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-stone-800 hover:bg-white"
            >
              Clear
            </button>
          </div>

          {impactCandidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-500">
              No impact-enabled trackers available.
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-500">
              No tracker matches your search.
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-1">
              {filteredCandidates.map((tracker) => {
                const isSelected = selectedTrackerIds.includes(tracker.id);

                return (
                <button
                    key={tracker.id}
                    type="button"
                    onClick={() => toggleTrackerSelection(tracker.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-all flex items-center justify-between gap-3 ${
                        isSelected
                        ? 'bg-stone-50 border-stone-400 text-stone-900 shadow-sm ring-1 ring-stone-400/20'
                        : 'bg-white border-gray-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                    }`}
                    >
                    <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">{tracker.name}</span>
                        <span className={`block text-xs truncate ${isSelected ? 'text-stone-500' : 'text-gray-500'}`}>
                        {normalizeCategory(tracker.category)}
                        </span>
                    </span>

                    <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected ? 'border-stone-900 bg-stone-900 text-white' : 'bg-white text-transparent'
                        }`}
                    >
                        {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                    </span>
                    </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ImpactSummaryWidget({
  selectedTrackers,
  logsByTrackerId,
  isRefreshing,
  onRefresh,
  onOpenTracker,
  sourceLabel
}) {
  const rows = useMemo(
    () =>
      selectedTrackers.map((tracker) => {
        const hasLogsLoaded = Array.isArray(logsByTrackerId[tracker.id]);
        const logs = hasLogsLoaded ? logsByTrackerId[tracker.id] : [];
        const impact = getImpactContribution(tracker, logs);

        return {
          tracker,
          hasLogsLoaded,
          ...impact
        };
      }),
    [selectedTrackers, logsByTrackerId]
  );

  const totalsByUnit = useMemo(
    () =>
      rows.reduce((acc, row) => {
        const impactUnit = (row.tracker.impact_unit || '$').trim() || '$';
        acc[impactUnit] = (acc[impactUnit] || 0) + row.impactValue;
        return acc;
      }, {}),
    [rows]
  );

  if (!selectedTrackers.length) {
    return (
      <div className="h-full flex items-center justify-center text-center text-gray-500 px-4">
        <div>
          <p className="font-medium text-stone-700">No trackers selected</p>
          <p className="text-sm mt-1">Open widget settings and choose which trackers to include.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {sourceLabel && <p className="text-xs text-gray-500">{sourceLabel}</p>}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {Object.entries(totalsByUnit).map(([unit, value]) => (
            <div key={unit} className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-800 text-sm font-medium">
              Total: {formatImpact(value)} {unit}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-1"
        >
          <RefreshCcw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => {
          const impactUnit = row.tracker.impact_unit || '$';
          const showLoadingState = row.tracker.type === 'build' && !row.hasLogsLoaded;

          return (
            <button
              key={row.tracker.id}
              type="button"
              onClick={() => onOpenTracker(row.tracker)}
              className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-stone-300 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{row.tracker.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {normalizeCategory(row.tracker.category)} · {row.modeLabel}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {showLoadingState
                      ? 'Loading log data...'
                      : `Basis: ${formatValue(row.mainAmount)} ${row.tracker.unit}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-900">
                    {formatImpact(row.impactValue)} {impactUnit}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Total impact</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrackerOverviewWidget({ trackers }) {
  const total = trackers.length;
  const active = trackers.filter((tracker) => tracker.is_active).length;
  const stopped = Math.max(0, total - active);
  const categoryCount = new Set(trackers.map((tracker) => normalizeCategory(tracker.category))).size;

  const byType = trackers.reduce(
    (acc, tracker) => {
      const type = tracker.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    { quit: 0, build: 0, boolean: 0 }
  );

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Total" value={total} />
        <StatTile label="Active" value={active} />
        <StatTile label="Paused" value={stopped} />
        <StatTile label="Categories" value={categoryCount} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-stone-50 p-3 text-sm text-stone-700 space-y-1">
        <p>Quit: {byType.quit || 0}</p>
        <p>Build: {byType.build || 0}</p>
        <p>Boolean: {byType.boolean || 0}</p>
      </div>
    </div>
  );
}

function CategoryBreakdownWidget({ trackers, onOpenCategory }) {
  const rows = useMemo(() => {
    const grouped = trackers.reduce((acc, tracker) => {
      const category = normalizeCategory(tracker.category);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [trackers]);

  if (!rows.length) {
    return <div className="h-full flex items-center justify-center text-sm text-gray-500">No categories yet.</div>;
  }

  const maxCount = Math.max(...rows.map((row) => row.count));

  return (
    <div className="h-full flex flex-col gap-2">
      {rows.map((row) => (
        <button
          key={row.category}
          type="button"
          onClick={() => onOpenCategory(row.category)}
          className="w-full text-left rounded-xl border border-gray-200 px-3 py-2 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center justify-between text-sm text-stone-700">
            <span className="font-medium truncate">{row.category}</span>
            <span className="text-xs text-gray-500">{row.count}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-stone-700"
              style={{ width: `${Math.max(8, (row.count / maxCount) * 100)}%` }}
            ></div>
          </div>
        </button>
      ))}
    </div>
  );
}

function TopImpactWidget({ trackers, onOpenTracker }) {
  const rows = useMemo(
    () =>
      trackers
        .filter((tracker) => tracker.type !== 'boolean' && toSafeNumber(tracker.impact_amount) > 0)
        .map((tracker) => {
          const dayImpact = getImpactPerDay(tracker);
          return {
            tracker,
            dayImpact,
            monthImpact: dayImpact * 30
          };
        })
        .sort((a, b) => b.monthImpact - a.monthImpact)
        .slice(0, 6),
    [trackers]
  );

  if (!rows.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">No impact settings configured yet.</div>
    );
  }

  return (
    <div className="h-full space-y-2">
      {rows.map((row, index) => (
        <button
          key={row.tracker.id}
          type="button"
          onClick={() => onOpenTracker(row.tracker)}
          className="w-full text-left rounded-xl border border-gray-200 px-3 py-2 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">
                #{index + 1} {row.tracker.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{normalizeCategory(row.tracker.category)}</p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-stone-900">
                {formatImpact(row.monthImpact)} {row.tracker.impact_unit || '$'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">per month estimate</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-stone-50 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className="text-2xl font-semibold text-stone-900 mt-1">{value}</p>
    </div>
  );
}

export default HomePage;
