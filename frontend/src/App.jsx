import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import CategoryView from './components/CategoryView';
import Sidebar from './components/Sidebar';
import TrackerView from './components/TrackerView';
import AuthScreen from './components/auth/AuthScreen';
import HomePage from './components/home/HomePage';
import ExportModal from './components/modals/ExportModal';
import GroupManagementModal from './components/modals/GroupManagementModal';
import LogModal from './components/modals/LogModal';
import SettingsModal from './components/modals/SettingsModal';
import TrackerModal from './components/modals/TrackerModal';
import { useAppState } from './state/AppStateContext';

function HomeRoute() {
  const { setSelectedTrackerId, setSelectedCategory } = useAppState();

  useEffect(() => {
    setSelectedTrackerId(null);
    setSelectedCategory(null);
  }, [setSelectedCategory, setSelectedTrackerId]);

  return <HomePage />;
}

function CategoryRoute() {
  const { categoryName } = useParams();
  const { setSelectedTrackerId, setSelectedCategory } = useAppState();

  useEffect(() => {
    setSelectedTrackerId(null);
    setSelectedCategory(categoryName ? decodeURIComponent(categoryName) : null);
  }, [categoryName, setSelectedCategory, setSelectedTrackerId]);

  return <CategoryView />;
}

function TrackerRoute() {
  const { trackerId } = useParams();
  const navigate = useNavigate();
  const { selectedTracker, setSelectedTrackerId, setSelectedCategory } = useAppState();

  useEffect(() => {
    const nextId = Number(trackerId);
    if (!Number.isFinite(nextId) || nextId <= 0) {
      navigate('/', { replace: true });
      return;
    }
    setSelectedTrackerId(nextId);
  }, [navigate, setSelectedTrackerId, trackerId]);

  useEffect(() => {
    if (selectedTracker) {
      setSelectedCategory((selectedTracker.category || 'General').trim() || 'General');
    }
  }, [selectedTracker, setSelectedCategory]);

  if (!selectedTracker && trackerId) {
    return <div className="px-4 md:px-10 pt-8 text-sm text-stone-500">Loading tracker...</div>;
  }

  return <TrackerView />;
}

function AppShell() {
  const location = useLocation();
  const {
    visibleError,
    dismissVisibleError,
    theme,
    isSidebarOpen,
    setIsSidebarOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    isGroupManagementOpen,
    setIsGroupManagementOpen,
    isLogModalOpen,
    setIsLogModalOpen,
    isTrackerModalOpen,
    setIsTrackerModalOpen,
    selectedTracker,
    logFormData,
    setLogFormData,
    trackerFormData,
    setTrackerFormData,
    trackerTypeOptions,
    categoryMenuRef,
    typeMenuRef,
    isCategoryMenuOpen,
    setIsCategoryMenuOpen,
    isCreatingCategory,
    setIsCreatingCategory,
    existingCategories,
    isTypeMenuOpen,
    setIsTypeMenuOpen,
    groups,
    trackers,
    handleLogSubmit,
    handleTrackerSubmit,
    user,
    setTheme,
    logout,
    createGroup,
    joinGroup
  } = useAppState();

  const isHomeActive = location.pathname === '/';

  return (
    <div
      className={`app-shell flex h-screen w-full bg-[#fcfcfc] font-sans text-stone-800 ${theme === 'dark' ? 'theme-dark' : ''}`}
    >
      {visibleError && (
        <div className="fixed top-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p className="leading-6">{visibleError}</p>
            <button
              type="button"
              onClick={dismissVisibleError}
              className="shrink-0 rounded-lg px-2 py-1 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isHomeActive={isHomeActive} />

      <div className="app-main flex-1 flex flex-col bg-[#fcfcfc] overflow-hidden">
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/category/:categoryName" element={<CategoryRoute />} />
          <Route path="/tracker/:trackerId" element={<TrackerRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <LogModal
        isOpen={isLogModalOpen}
        setIsLogModalOpen={setIsLogModalOpen}
        selectedTracker={selectedTracker}
        logFormData={logFormData}
        setLogFormData={setLogFormData}
        handleLogSubmit={handleLogSubmit}
      />

      <TrackerModal
        isOpen={isTrackerModalOpen}
        setIsTrackerModalOpen={setIsTrackerModalOpen}
        currentUser={user}
        trackerFormData={trackerFormData}
        setTrackerFormData={setTrackerFormData}
        handleTrackerSubmit={handleTrackerSubmit}
        categoryMenuRef={categoryMenuRef}
        typeMenuRef={typeMenuRef}
        isCategoryMenuOpen={isCategoryMenuOpen}
        setIsCategoryMenuOpen={setIsCategoryMenuOpen}
        isCreatingCategory={isCreatingCategory}
        setIsCreatingCategory={setIsCreatingCategory}
        existingCategories={existingCategories}
        isTypeMenuOpen={isTypeMenuOpen}
        setIsTypeMenuOpen={setIsTypeMenuOpen}
        trackerTypeOptions={trackerTypeOptions}
        groups={groups}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        theme={theme}
        setTheme={setTheme}
        onLogout={logout}
        user={user}
      />

      <ExportModal
        isOpen={isExportOpen}
        setIsExportOpen={setIsExportOpen}
        trackers={trackers}
      />

      <GroupManagementModal
        isOpen={isGroupManagementOpen}
        setIsOpen={setIsGroupManagementOpen}
        groups={groups}
        onCreateGroup={createGroup}
        onJoinGroup={joinGroup}
      />
    </div>
  );
}

function App() {
  const { isAuthLoading, isAuthenticated, authError, isAuthenticating, login, register } = useAppState();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        Loading workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={login} onRegister={register} error={authError} isBusy={isAuthenticating} />;
  }

  return <AppShell />;
}

export default App;
