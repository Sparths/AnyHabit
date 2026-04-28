import { LogOut } from 'lucide-react';

function SettingsModal({ isOpen, setIsSettingsOpen, theme, setTheme, user, onLogout }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="app-modal-card bg-white p-5 md:p-8 rounded-3xl shadow-xl w-[95%] max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-stone-900">Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Personalize your AnyHabit experience.</p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {user && (
          <div className="mb-7">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</h4>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 mb-4">
              <div className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-1">Signed in as</div>
              <div className="text-sm font-semibold text-stone-900 mb-1 truncate">{user.username}</div>
              <div className="text-xs text-stone-500 mb-4 truncate">{user.email}</div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setIsSettingsOpen(false);
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 hover:text-rose-600 transition-colors"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </div>
        )}

        <div className="mb-7">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Theme</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                theme === 'light' ? 'border-stone-800 bg-stone-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-semibold text-stone-800">Lightmode</p>
              <p className="text-xs text-gray-500 mt-1">Bright background with soft contrast</p>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                theme === 'dark' ? 'border-stone-800 bg-stone-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-semibold text-stone-800">Darkmode</p>
              <p className="text-xs text-gray-500 mt-1">Dimmed interface for low-light sessions</p>
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About This Website</h4>
          <div className="rounded-2xl border border-gray-200 p-4 bg-stone-50">
            <p className="text-sm text-stone-700 leading-relaxed">
              This is AnyHabit, made by Bebedi as an open source project.
            </p>
            <a
              href="https://github.com/Sparths/AnyHabit"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 text-sm font-medium text-stone-900 hover:underline"
            >
              https://github.com/Sparths/AnyHabit
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
