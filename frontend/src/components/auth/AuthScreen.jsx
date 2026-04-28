import { useState } from 'react';
import { ArrowRight, Loader, LockKeyhole, Mail, UserRound } from 'lucide-react';

const AUTH_COPY = {
  title: 'Private by default. Shared by choice.',
  subtitle: 'Sign in to your workspace or create a new account to start building private habits and group trackers.',
  note: 'Bootstrap credentials can be configured from the backend environment for first-run migrations.'
};

function AuthScreen({ onLogin, onRegister, error, isBusy }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', identifier: '', password: '' });
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    try {
      if (mode === 'login') {
        await onLogin(form.identifier.trim(), form.password);
      } else {
        await onRegister(form.username.trim(), form.email.trim(), form.password);
      }
    } catch (err) {
      setLocalError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(233,229,216,0.9),_transparent_32%),linear-gradient(135deg,_#f7f2e7_0%,_#fdfdfb_38%,_#eef2f2_100%)] text-stone-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <section className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.10)] p-8 md:p-12 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,rgba(17,24,39,0.02),transparent_40%,rgba(101,67,33,0.04))]" />
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm">
              <LockKeyhole size={16} />
              Account Workspace
            </div>
            <h1 className="mt-8 text-4xl md:text-6xl font-semibold tracking-tight text-stone-950 leading-[0.95]">
              {AUTH_COPY.title}
            </h1>
            <p className="mt-5 text-lg text-stone-600 max-w-2xl leading-8">{AUTH_COPY.subtitle}</p>
            <div className="mt-10 grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <div className="font-semibold text-stone-900">Private first</div>
                <p className="mt-2 text-stone-600">Every user gets isolated trackers, journals, and dashboard state.</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <div className="font-semibold text-stone-900">Shared groups</div>
                <p className="mt-2 text-stone-600">Invite family or friends and compare progress inside a group tracker.</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <div className="font-semibold text-stone-900">Dual streaks</div>
                <p className="mt-2 text-stone-600">Track individual consistency and the full group streak side by side.</p>
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-10 text-xs uppercase tracking-[0.24em] text-stone-400">{AUTH_COPY.note}</p>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] p-6 md:p-8">
          <div className="flex items-center gap-2 rounded-full bg-stone-100 p-1 w-fit mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-500">Username</span>
                <div className="relative">
                  <UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 py-3 text-sm outline-none focus:border-stone-400"
                    placeholder="Your display name"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                {mode === 'login' ? 'Email or username' : 'Email'}
              </span>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  required
                  value={mode === 'login' ? form.identifier : form.email}
                  onChange={(event) =>
                    setForm(mode === 'login' ? { ...form, identifier: event.target.value } : { ...form, email: event.target.value })
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 py-3 text-sm outline-none focus:border-stone-400"
                  placeholder={mode === 'login' ? 'Email or username' : 'you@example.com'}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-500">Password</span>
              <div className="relative">
                <LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 py-3 text-sm outline-none focus:border-stone-400"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {(error || localError) && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-in fade-in">
                {error || localError}
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBusy && <Loader size={16} className="animate-spin" />}
              {isBusy ? 'Loading...' : (mode === 'login' ? 'Enter Workspace' : 'Create Workspace')}
              {!isBusy && <ArrowRight size={16} />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AuthScreen;
