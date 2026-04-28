import { Copy, LogIn, Plus, X, Users } from 'lucide-react';
import { useState } from 'react';

function GroupManagementModal({ isOpen, setIsOpen, groups, onCreateGroup, onJoinGroup }) {
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateGroup(groupName.trim());
      setGroupName('');
      setActiveTab('list');
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
      setActiveTab('list');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-[95%] max-w-2xl border border-gray-100 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-stone-100 p-2">
              <Users size={20} className="text-stone-900" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Groups</h3>
              <p className="text-sm text-gray-500">Manage and join groups</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex gap-2 mb-6 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'list' ? 'border-stone-900 text-stone-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Your Groups
              <span className="ml-2 text-xs font-medium bg-stone-100 px-2 py-0.5 rounded-full">{groups.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'create' ? 'border-stone-900 text-stone-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'join' ? 'border-stone-900 text-stone-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Join
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="space-y-3">
              {groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                  <Users size={32} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-sm text-stone-600 mb-1">No groups yet</p>
                  <p className="text-xs text-stone-500">Create or join a group to share trackers</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-stone-900 truncate">{group.name}</h4>
                        <p className="text-xs text-stone-500 mt-1 truncate">
                          <span className="font-medium">{group.member_count}</span> members
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(group.join_code)}
                        className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:bg-white transition-colors flex items-center justify-center"
                        title="Copy join code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-mono tracking-[0.2em] text-stone-600">
                      {group.join_code}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Group Name
                </label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Family, Friends, Team"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-stone-400"
                  required
                />
              </div>
              <p className="text-xs text-stone-500">
                Once created, you'll receive a unique join code to share with group members.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors disabled:opacity-60"
              >
                <Plus size={16} /> Create Group
              </button>
            </form>
          )}

          {activeTab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Join Code
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter the group's join code"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-stone-400 uppercase tracking-[0.18em]"
                  required
                />
              </div>
              <p className="text-xs text-stone-500">
                Ask a group member for the join code to access their group and shared trackers.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors disabled:opacity-60"
              >
                <LogIn size={16} /> Join Group
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupManagementModal;
