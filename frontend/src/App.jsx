import { useState, useEffect } from 'react'

const API_URL = 'https://supreme-potato-j9wqvgxxrj4246j-8000.app.github.dev';

function App() {
  const [trackers, setTrackers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'quit',
    unit: 'Vape'
  });

  const fetchTrackers = () => {
    fetch(`${API_URL}/trackers/`)
      .then(response => response.json())
      .then(data => setTrackers(data))
      .catch(error => console.error("Error while loading:", error));
  };

  useEffect(() => {
    fetchTrackers();
  }, []);

  const handleCreateTracker = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/trackers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          unit: formData.unit,
          money_saved_amount: 0.0,
          money_saved_per: "day",
          units_per_amount: 0.0,
          units_per: "day",
          is_active: true
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', type: 'quit', unit: 'Vape' });
        fetchTrackers();
      }
    } catch (error) {
      console.error("Error while creating:", error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-stone-50">
      
      {/* SIDEBAR */}
      <div className="w-64 border-r border-gray-200 p-6 bg-white flex flex-col">
        <h1 className="text-xl font-bold mb-8">AnyHabit</h1>
        
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Tracker</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded p-1 transition-colors"
          >
            ➕
          </button>
        </div>

        <ul className="space-y-2 text-gray-600 flex-1 overflow-y-auto">
          {trackers.length === 0 ? (
            <li className="text-sm italic text-gray-400">No Trackers Found.</li>
          ) : (
            trackers.map((tracker) => (
              <li 
                key={tracker.id} 
                className="font-medium text-gray-700 hover:bg-gray-100 p-2 rounded-md cursor-pointer transition-colors flex justify-between items-center"
              >
                {tracker.name}
                <span className={`inline-block w-2 h-2 rounded-full ${tracker.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
          <textarea 
            className="w-full outline-none resize-none text-gray-700 placeholder-gray-400 bg-transparent" 
            rows="3" 
            placeholder="Wie fühlst du dich heute?"
          ></textarea>
          <div className="flex justify-between items-center mt-2">
            <button className="text-gray-400 hover:text-gray-600">📎</button>
            <button className="bg-stone-500 hover:bg-stone-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (POP-UP) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-96 border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Create new Tracker</h3>
            
            <form onSubmit={handleCreateTracker} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name (E.g Nicotine)</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-stone-400"
                >
                  <option value="quit">Quit</option>
                  <option value="build">Build</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Unit (E.g Vapes)</label>
                <input 
                  type="text" 
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-stone-400"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-stone-600 hover:bg-stone-700 rounded-lg shadow-sm transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default App