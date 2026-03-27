import { useEffect, useMemo, useState } from 'react'
import { Layout, Terminal, Globe, Plus, Search, CheckCircle2, Circle, Send, RefreshCw, FolderSearch, FileText } from 'lucide-react'

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
}

interface Project {
  id: number;
  name: string;
  slug: string;
  rootPath: string;
  repoType: string;
  projectType: string;
  primaryLanguage: string | null;
  framework: string | null;
  packageManager: string | null;
  hasGit: boolean;
  planningStatus: 'none' | 'partial' | 'structured';
  artifactCount: number;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'http://localhost:3001'
const DEFAULT_SCAN_ROOT = 'C:/Users/lweis/Documents'

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [scanInFlight, setScanInFlight] = useState(false)

  const loadProjects = async () => {
    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`)
      if (!res.ok) throw new Error('Failed to fetch projects')
      const data: Project[] = await res.json()
      setProjects(data)

      if (selectedProject) {
        const refreshedSelectedProject = data.find((project) => project.id === selectedProject.id) ?? null
        setSelectedProject(refreshedSelectedProject)
      }
    } catch (error) {
      console.error('Failed to load projects', error)
      setProjects([])
      setProjectsError("Bridge is down! Run 'node server.js'")
    } finally {
      setProjectsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (!selectedProject) return

    fetch(`${API_BASE_URL}/api/tasks/${selectedProject.name.toLowerCase()}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data)
        document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' })
      })
      .catch(err => {
        console.error("Bridge is down! Run 'node server.js'", err)
        setTasks([])
      })
  }, [selectedProject])

  const handleScanWorkspace = async () => {
    setScanInFlight(true)
    setProjectsError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roots: [DEFAULT_SCAN_ROOT] }),
      })

      if (!res.ok) {
        throw new Error('Failed to scan workspace')
      }

      await loadProjects()
    } catch (error) {
      console.error('Failed to scan workspace', error)
      setProjectsError('Workspace scan failed. Check the bridge and try again.')
    } finally {
      setScanInFlight(false)
    }
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    console.log(`Adding "${newTask}" to ${selectedProject?.name}`)
    setNewTask('')
  }

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return projects

    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.rootPath,
        project.projectType,
        project.framework ?? '',
        project.primaryLanguage ?? '',
        project.packageManager ?? '',
        project.planningStatus,
      ].join(' ').toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [projects, searchQuery])

  const getProjectBadgeLabel = (project: Project) => {
    if (project.projectType === 'web_node') return 'Web/Node'
    if (project.projectType === 'python') return 'Python'
    if (project.projectType === 'general') return 'General'
    return 'Unknown'
  }

  const getProjectIcon = (project: Project) => {
    return project.projectType === 'web_node' ? Globe : Terminal
  }

  const getPlanningStatusLabel = (status: Project['planningStatus']) => {
    if (status === 'structured') return 'Structured'
    if (status === 'partial') return 'Partial'
    return 'None'
  }

  const getPlanningStatusClassName = (status: Project['planningStatus']) => {
    if (status === 'structured') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    if (status === 'partial') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    return 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
  }

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden">
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

      <main className="flex-1 overflow-y-auto p-12 bg-gradient-to-br from-[#0b0f1a] to-[#0f172a]">
        <header className="flex justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">Project Hub</h2>
            <p className="text-slate-400 mt-3 font-mono text-sm tracking-widest uppercase opacity-70">
              {projectsLoading ? 'Loading workspace...' : `${projects.length} Environments Discovered`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleScanWorkspace}
              disabled={scanInFlight}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={scanInFlight ? 'animate-spin' : ''} />
              {scanInFlight ? 'Scanning...' : 'Scan Workspace'}
            </button>
            <button className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95">
              <Plus size={20} /> New Project
            </button>
          </div>
        </header>

        <div className="relative mb-6 group max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={22} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER PROJECTS..."
            className="w-full bg-[#111827] border border-slate-800 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-wider text-sm shadow-inner"
          />
        </div>

        {projectsError ? (
          <div className="mb-8 rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-sm font-bold uppercase tracking-wide text-red-300">
            {projectsError}
          </div>
        ) : null}

        {projectsLoading ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading discovered projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const Icon = getProjectIcon(project)
              const typeLabel = getProjectBadgeLabel(project)

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`group p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer ${
                    selectedProject?.id === project.id
                      ? 'bg-[#1e293b] border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.15)] scale-[1.02]'
                      : 'bg-[#111827] border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-8 gap-4">
                    <div className={`p-4 rounded-2xl ${project.projectType === 'web_node' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      <Icon size={32} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                        {typeLabel}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getPlanningStatusClassName(project.planningStatus)}`}>
                        {getPlanningStatusLabel(project.planningStatus)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tighter leading-none mb-3">
                    {project.name}
                  </h3>

                  <p className="text-xs text-slate-500 font-mono truncate lowercase tracking-tight opacity-50 mb-5">
                    {project.rootPath}
                  </p>

                  <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                    <div className="flex items-center gap-2">
                      <FileText size={14} />
                      <span>{project.artifactCount} Sources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderSearch size={14} />
                      <span>{project.hasGit ? 'Git Repo' : 'Local Folder'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-4">
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
              {projects.length === 0 ? 'No Projects Discovered Yet' : 'No Projects Match Current Filter'}
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleScanWorkspace}
                disabled={scanInFlight}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={scanInFlight ? 'animate-spin' : ''} />
                {scanInFlight ? 'Scanning...' : 'Scan Workspace'}
              </button>
            </div>
          </div>
        )}

        <div id="roadmap-section" className="mt-16 pb-20">
          {selectedProject ? (
            <div className="p-10 bg-[#111827]/80 backdrop-blur-md rounded-[2.5rem] border-2 border-slate-800 shadow-2xl">
              <div className="flex justify-between items-start mb-10 gap-6">
                <div>
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    {selectedProject.name} Roadmap
                  </h3>
                  <p className="text-blue-500 font-mono text-xs uppercase tracking-[0.2em] mt-2 font-bold">
                    Planning Status: {getPlanningStatusLabel(selectedProject.planningStatus)}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                    {selectedProject.artifactCount} Sources Detected
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedProject.framework ?? selectedProject.projectType}
                  </p>
                </div>
              </div>

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
                      task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : task.status === 'In-Progress' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                )) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
                    <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Legacy Roadmap Tasks Found in SQLite</p>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
                      Discovery is now live. Milestone and slice import comes next.
                    </p>
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
