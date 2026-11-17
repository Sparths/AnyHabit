import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import CategoryView from './components/CategoryView';
import CommandPalette from './components/CommandPalette';
import Sidebar from './components/Sidebar';
import TrackerView from './components/TrackerView';
import AuthScreen from './components/auth/AuthScreen';
import HomePage from './components/home/HomePage';
import ExportModal from './components/modals/ExportModal';
import GroupManagementModal from './components/modals/GroupManagementModal';
import ImportModal from './components/modals/ImportModal';
import LogModal from './components/modals/LogModal';
import SettingsModal from './components/modals/SettingsModal';
import TrackerModal from './components/modals/TrackerModal';
import ConfirmDialog from './components/ui/ConfirmDialog';
import Toaster from './components/ui/Toaster';
import { useAppState } from './state/appState';

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
  const { selectedTracker, setSelectedTrackerId, setSelectedCategory, isLoadingTrackers } = useAppState();

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

  // Once the tracker list has loaded, a tracker still missing from it is one
  // the user cannot reach — say so rather than spinning forever on a dead link.
  if (!selectedTracker && isLoadingTrackers) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-stone-500">Loading tracker…</div>
    );
  }

  if (!selectedTracker) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold text-stone-700">That tracker could not be found</p>
        <p className="text-sm text-gray-500">It may have been deleted, or the link points somewhere else.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return <TrackerView />;
}

function AppShell() {
  const location = useLocation();
  const {
    toasts,
    dismissToast,
    confirmRequest,
    resolveConfirm,
    isSidebarOpen,
    setIsSidebarOpen
  } = useAppState();

  const isHomeActive = location.pathname === '/';

  return (
    <div className="app-shell flex h-screen w-full bg-[#fcfcfc] font-sans text-stone-800">
      <Toaster toasts={toasts} onDismiss={dismissToast} />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isHomeActive={isHomeActive} />

      <div className="app-main flex flex-1 flex-col overflow-hidden bg-[#fcfcfc]">
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/category/:categoryName" element={<CategoryRoute />} />
          <Route path="/tracker/:trackerId" element={<TrackerRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <CommandPalette />
      <LogModal />
      <TrackerModal />
      <SettingsModal />
      <ExportModal />
      <ImportModal />
      <GroupManagementModal />
      <ConfirmDialog request={confirmRequest} onResolve={resolveConfirm} />
    </div>
  );
}

function App() {
  const {
    isAuthLoading,
    isAuthenticated,
    authError,
    isAuthenticating,
    login,
    register,
    registrationEnabled
  } = useAppState();

  if (isAuthLoading) {
    return (
      <div className="app-boot flex min-h-screen items-center justify-center bg-stone-50 text-stone-500">
        Loading workspace…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={login}
        onRegister={register}
        registrationEnabled={registrationEnabled}
        error={authError}
        isBusy={isAuthenticating}
      />
    );
  }

  return <AppShell />;
}

export default App;
