function App() {
  return (
    <div className="flex h-screen w-full">
      
      {/* SIDEBAR (Links) */}
      <div className="w-64 border-r border-gray-200 p-6 bg-white">
        <h1 className="text-xl font-bold mb-8">AnyHabit</h1>
        <ul className="space-y-3 text-gray-600">
          <li className="font-medium text-gray-900 bg-gray-100 p-2 rounded-md cursor-pointer">🚬 Nikotinfrei</li>
          <li className="p-2 hover:bg-gray-100 rounded-md cursor-pointer">☕ Kaffeeverzicht</li>
        </ul>
      </div>

      {/* HAUPTBEREICH (Rechts) */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center">
        
        {/* Eine Memos-ähnliche Eingabebox */}
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
    </div>
  )
}

export default App