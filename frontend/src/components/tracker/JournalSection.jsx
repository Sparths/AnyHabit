import { Pencil, Trash2 } from 'lucide-react';
import MoodIcon from '../MoodIcon';

function JournalSection({
  journalFormData,
  setJournalFormData,
  handleJournalSubmit,
  journals,
  deleteJournal
}) {
  return (
    <>
      <div className="w-full bg-white border border-gray-100 rounded-3xl p-5 shadow-sm mb-8 transition-all focus-within:border-gray-300">
        <form onSubmit={handleJournalSubmit}>
          <textarea
            required
            value={journalFormData.content}
            onChange={(e) => setJournalFormData({ ...journalFormData, content: e.target.value })}
            className="w-full outline-none resize-none text-stone-800 placeholder-gray-400 bg-transparent text-base"
            rows="2"
            placeholder="Write a journal entry..."
          ></textarea>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setJournalFormData({ ...journalFormData, mood })}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    journalFormData.mood === mood
                      ? 'bg-stone-900 text-white'
                      : 'bg-transparent text-gray-400 hover:bg-stone-100'
                  }`}
                >
                  <MoodIcon moodValue={mood} size={16} />
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              {journalFormData.id && (
                <button
                  type="button"
                  onClick={() => setJournalFormData({ id: null, content: '', mood: 3 })}
                  className="text-gray-400 text-sm hover:text-stone-600 px-2"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-1.5 rounded-xl text-sm font-medium transition-colors"
              >
                {journalFormData.id ? 'Update' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="w-full space-y-3 pb-12">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Journal</h3>
        {journals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No journal entries yet.</p>
          </div>
        ) : (
          journals.map((journal) => (
            <div key={journal.id} className="bg-white border border-gray-100 rounded-3xl p-5 group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="text-stone-400">
                    <MoodIcon moodValue={journal.mood || 3} size={16} />
                  </span>
                  <span className="text-xs font-medium">
                    {new Date(
                      journal.timestamp.endsWith('Z') ? journal.timestamp : `${journal.timestamp}Z`
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => setJournalFormData(journal)} className="text-gray-400 hover:text-stone-600">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteJournal(journal.id)} className="text-gray-400 hover:text-rose-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{journal.content}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default JournalSection;
