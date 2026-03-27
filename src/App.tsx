import { useState, useEffect } from 'react'
import projectsData from './projects-seed.json'
import { Layout, Terminal, Globe, Plus, Search, CheckCircle2, Circle, Send } from 'lucide-react'

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
}

function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')

  // 1. Fetch tasks when a project is clicked
  useEffect(() => {
    if (selectedProject) {
      const projectName = selectedProject.toLowerCase();
      fetch(`http://localhost:3001/api/tasks/${projectName}`)
        .then(res => res.json())
        .then(data => {
          setTasks(data);
          document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(err => {
          console.error("Bridge is down! Run 'node server.js'", err);
          setTasks([]);
        });
    }
  }, [selectedProject]);

  // 2. Simple function to handle adding a new task (placeholder logic)
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    console.log(`Adding "${newTask}" to ${selectedProject}`);
    // In the next step, we can add the POST request here to save to SQLite
    setNewTask('');
  };

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#111827] border-r border-slate-800 p-8 flex flex-col shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 px-3 py-1 rounded-lg font-black text-white text-xl uppercase tracking-tighter text-center min-w-[45px]">LW</div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Command</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 px-2">Main Menu</p>
          <button className="flex items-center gap-3 w-full p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 font-bold">
            <Layout size={20} /> Dashboard
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase text-center">L.W. Hub v1.0.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-12 bg-gradient-to-br from-[#0b0f1a] to-[#0f172a]">
        
        {/* HEADER */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">Project Hub</h2>
            <p className="text-slate-400 mt-3 font-mono text-sm tracking-widest uppercase opacity-70">
              {projectsData.length} Environments Discovered
            </p>
          </div>
          <button className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95">
            <Plus size={20} /> New Project
          </button>
        </header>

        {/* SEARCH BAR */}
        <div className="relative mb-12 group max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="FILTER PROJECTS..." 
            className="w-full bg-[#111827] border border-slate-800 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-wider text-sm shadow-inner"
          />
        </div>

        {/* PROJECT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsData.map((project) => (
            <div 
              key={project.name}
              onClick={() => setSelectedProject(project.name)}
              className={`group p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer ${
                selectedProject === project.name 
                ? 'bg-[#1e293b] border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.15)] scale-[1.02]' 
                : 'bg-[#111827] border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl ${project.type === 'Web/Node' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {project.type === 'Web/Node' ? <Globe size={32} /> : <Terminal size={32} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                  {project.type}
                </span>
              </div>
              <h3 className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tighter leading-none mb-3">
                {project.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono truncate lowercase tracking-tight opacity-50">
                {project.path}
              </p>
            </div>
          ))}
        </div>

        {/* ROADMAP / TASK PANEL */}
        <div id="roadmap-section" className="mt-16 pb-20">
          {selectedProject ? (
            <div className="p-10 bg-[#111827]/80 backdrop-blur-md rounded-[2.5rem] border-2 border-slate-800 shadow-2xl">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    {selectedProject} Roadmap
                  </h3>
                  <p className="text-blue-500 font-mono text-xs uppercase tracking-[0.2em] mt-2 font-bold">Mission Status: Active</p>
                </div>
              </div>

              {/* QUICK LOG INPUT */}
              <form onSubmit={handleAddTask} className="mb-8 flex gap-3">
                <input 
                  type="text" 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="LOG NEW TASK OR MILESTONE..."
                  className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all font-bold text-sm uppercase tracking-wider"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl transition-all shadow-lg active:scale-95">
                  <Send size={20} />
                </button>
              </form>

              {/* TASKS LIST */}
              <div className="grid gap-4">
                {tasks.length > 0 ? tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-6 bg-[#1e293b]/30 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group/task"
                  >
                    <div className="flex items-center gap-5">
                      {task.status === 'Done' ? (
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      ) : (
                        <Circle className="text-slate-600 group-hover/task:text-blue-500 transition-colors" size={24} />
                      )}
                      <div>
                        <span className={`text-xl font-bold tracking-tight ${task.status === 'Done' ? 'text-slate-600 line-through' : 'text-slate-100'}`}>
                          {task.title}
                        </span>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-500 uppercase tracking-tighter">
                             {task.category}
                           </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${
                      task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                      task.status === 'In-Progress' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                )) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Roadmap Data Found in SQLite</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center border-t border-slate-800/30">
               <p className="text-slate-700 font-black uppercase tracking-[0.4em] text-[10px]">Select Project to Initialize Command View</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App