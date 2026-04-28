import { Copy, LogIn, Plus } from 'lucide-react';
import { useState } from 'react';

function GroupPanel({ groups, onCreateGroup, onJoinGroup }) {
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateGroup(groupName.trim());
      setGroupName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setIsSubmitting(true);
    try {
      await onJoinGroup(joinCode.trim());
      setJoinCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mb-8 rounded-[2rem] border border-stone-200 bg-white/90 shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Groups</h2>
          <p className="mt-2 text-sm text-stone-600 max-w-xl">
            Create a family or friend group, invite members with a join code, and compare progress inside shared trackers.
          </p>
        </div>
        <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{groups.length} joined</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleCreate} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-800 mb-3">
            <Plus size={16} /> Create group
          </div>
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Family, Friends, Sprint Team"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            Create
          </button>
        </form>

        <form onSubmit={handleJoin} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-800 mb-3">
            <LogIn size={16} /> Join group
          </div>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="Enter join code"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400 uppercase tracking-[0.18em]"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-700 border border-stone-200 disabled:opacity-60"
          >
            Join
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 p-5 text-sm text-stone-500 md:col-span-2 xl:col-span-3">
            No groups yet. Create one to start sharing trackers.
          </div>
        ) : (
          groups.map((group) => (
            <article key={group.id} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-stone-900">{group.name}</h3>
                  <p className="mt-1 text-xs text-stone-500">{group.member_count} member{group.member_count === 1 ? '' : 's'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(group.join_code)}
                  className="rounded-full border border-stone-200 p-2 text-stone-500 transition-colors hover:text-stone-900 hover:border-stone-300"
                  title="Copy join code"
                >
                  <Copy size={14} />
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-stone-50 px-3 py-2 text-xs font-mono tracking-[0.2em] text-stone-500">
                {group.join_code}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default GroupPanel;
