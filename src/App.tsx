import { useEffect, useMemo, useState } from 'react'
import { Layout, Terminal, Globe, Plus, Search, CheckCircle2, Circle, Send, RefreshCw, FolderSearch, FileText, Flag, AlertCircle } from 'lucide-react'

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

interface Milestone {
  id: number;
  projectId: number;
  externalKey: string | null;
  title: string;
  description: string | null;
  status: 'planned' | 'active' | 'blocked' | 'done' | 'draft';
  origin: string;
  confidence: number;
  needsReview: boolean;
  sortOrder: number;
  sourceArtifactId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Requirement {
  id: number;
  projectId: number;
  externalKey: string | null;
  title: string;
  description: string;
  status: string;
  validation: string | null;
  notes: string | null;
  primaryOwner: string | null;
  supportingSlices: string | null;
  sourceArtifactId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Decision {
  id: number;
  projectId: number;
  externalKey: string | null;
  scope: string | null;
  decision: string;
  choice: string | null;
  rationale: string | null;
  revisable: string | null;
  whenContext: string | null;
  sourceArtifactId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ImportRun {
  id: number;
  projectId: number;
  status: 'running' | 'success' | 'partial' | 'failed';
  strategy: string;
  artifactType: string;
  startedAt: string;
  completedAt: string | null;
  summary: string | null;
  warningsJson: string | null;
}

interface WorkflowState {
  phase: 'no-data' | 'import-only' | 'active' | 'stalled' | 'blocked';
  confidence: number;
  reasons: string[];
  evidence: { label: string; value: string }[];
}

interface ContinuityState {
  status: 'fresh' | 'stale' | 'missing';
  freshAt: string | null;
  ageHours: number | null;
  latestWork: string | null;
  checkpointHygiene: 'ok' | 'stale' | 'missing';
  hygieneNote: string | null;
  checkpointCount?: number | null;
  lastCheckpointReason?: string | null;
  handoffCommand?: string | null;
}

interface NextAction {
  action: string;
  rationale: string;
  blockers: string[];
}

interface ProjectPlan {
  project: Project;
  milestones: Milestone[];
  slices: unknown[];
  tasks: unknown[];
  requirements: Requirement[];
  decisions: Decision[];
  importRuns: ImportRun[];
  latestImportRun: ImportRun | null;
  latestImportRunsByArtifact: {
    milestones: ImportRun | null;
    requirements: ImportRun | null;
    decisions: ImportRun | null;
  };
  workflowState: WorkflowState;
  continuity: ContinuityState;
  nextAction: NextAction;
}

const API_BASE_URL = 'http://localhost:3001'
const DEFAULT_SCAN_ROOT = 'C:/Users/lweis/Documents'

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null)
  const [projectPlanLoading, setProjectPlanLoading] = useState(false)
  const [projectPlanError, setProjectPlanError] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [scanInFlight, setScanInFlight] = useState(false)
  const [milestonesImportInFlight, setMilestonesImportInFlight] = useState(false)
  const [requirementsImportInFlight, setRequirementsImportInFlight] = useState(false)
  const [decisionsImportInFlight, setDecisionsImportInFlight] = useState(false)

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

  const loadProjectPlan = async (projectId: number) => {
    setProjectPlanLoading(true)
    setProjectPlanError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/plan`)
      if (!res.ok) throw new Error('Failed to fetch project plan')
      const data: ProjectPlan = await res.json()
      setProjectPlan(data)
      document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to load project plan', err)
      setProjectPlan(null)
      setProjectPlanError('Unable to load canonical project plan.')
    } finally {
      setProjectPlanLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (!selectedProject) {
      setTasks([])
      setProjectPlan(null)
      setProjectPlanError(null)
      return
    }

    fetch(`${API_BASE_URL}/api/tasks/${selectedProject.name.toLowerCase()}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data)
      })
      .catch(err => {
        console.error("Bridge is down! Run 'node server.js'", err)
        setTasks([])
      })

    loadProjectPlan(selectedProject.id)
  }, [selectedProject])

  const handleImportMilestones = async () => {
    if (!selectedProject) return

    setMilestonesImportInFlight(true)
    setProjectPlanError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/import-gsd-project`, {
        method: 'POST',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to import milestones')
      }

      await loadProjectPlan(selectedProject.id)
    } catch (error) {
      console.error('Failed to import milestones', error)
      setProjectPlanError(error instanceof Error ? error.message : 'Failed to import milestones.')
    } finally {
      setMilestonesImportInFlight(false)
    }
  }

  const handleImportRequirements = async () => {
    if (!selectedProject) return

    setRequirementsImportInFlight(true)
    setProjectPlanError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/import-gsd-requirements`, {
        method: 'POST',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to import requirements')
      }

      await loadProjectPlan(selectedProject.id)
    } catch (error) {
      console.error('Failed to import requirements', error)
      setProjectPlanError(error instanceof Error ? error.message : 'Failed to import requirements.')
    } finally {
      setRequirementsImportInFlight(false)
    }
  }

  const handleImportDecisions = async () => {
    if (!selectedProject) return

    setDecisionsImportInFlight(true)
    setProjectPlanError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/import-gsd-decisions`, {
        method: 'POST',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to import decisions')
      }

      await loadProjectPlan(selectedProject.id)
    } catch (error) {
      console.error('Failed to import decisions', error)
      setProjectPlanError(error instanceof Error ? error.message : 'Failed to import decisions.')
    } finally {
      setDecisionsImportInFlight(false)
    }
  }

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

  const getMilestoneStatusClassName = (status: Milestone['status']) => {
    if (status === 'done') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    if (status === 'active') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    if (status === 'blocked') return 'bg-red-500/10 text-red-400 border border-red-500/20'
    if (status === 'draft') return 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
  }

  const getRequirementStatusClassName = (status: Requirement['status']) => {
    if (status === 'validated') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    if (status === 'deferred' || status === 'out-of-scope') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
  }

  const getWorkflowPhaseClassName = (phase: WorkflowState['phase']) => {
    if (phase === 'active') return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
    if (phase === 'stalled') return 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
    if (phase === 'blocked') return 'bg-red-500/10 text-red-300 border border-red-500/20'
    if (phase === 'import-only') return 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
    return 'bg-slate-700/40 text-slate-300 border border-slate-600/20'
  }

  const getWorkflowConfidenceClassName = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
    if (confidence >= 0.4) return 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
    return 'bg-slate-700/40 text-slate-300 border border-slate-600/20'
  }

  const getContinuityStatusClassName = (status: ContinuityState['status']) => {
    if (status === 'fresh') return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
    if (status === 'stale') return 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
    return 'bg-slate-700/40 text-slate-300 border border-slate-600/20'
  }

  const getNextActionBlockersPresent = (blockers: string[] | undefined) => !!blockers && blockers.length > 0;

  const importedMilestones = projectPlan?.milestones ?? []
  const importedRequirements = projectPlan?.requirements ?? []
  const importedDecisions = projectPlan?.decisions ?? []
  const latestImportWarnings = useMemo(() => {
    if (!projectPlan?.latestImportRun?.warningsJson) return [] as string[]

    try {
      const parsed = JSON.parse(projectPlan.latestImportRun.warningsJson)
      return Array.isArray(parsed) ? parsed.filter((warning): warning is string => typeof warning === 'string') : []
    } catch {
      return [] as string[]
    }
  }, [projectPlan?.latestImportRun?.warningsJson])
  const parseWarnings = (warningsJson: string | null) => {
    if (!warningsJson) return [] as string[]

    try {
      const parsed = JSON.parse(warningsJson)
      return Array.isArray(parsed) ? parsed.filter((warning): warning is string => typeof warning === 'string') : []
    } catch {
      return [] as string[]
    }
  }
  const milestoneImportRun = projectPlan?.latestImportRunsByArtifact.milestones ?? null
  const requirementsImportRun = projectPlan?.latestImportRunsByArtifact.requirements ?? null
  const decisionsImportRun = projectPlan?.latestImportRunsByArtifact.decisions ?? null
  const milestoneWarnings = parseWarnings(milestoneImportRun?.warningsJson ?? null)
  const requirementWarnings = parseWarnings(requirementsImportRun?.warningsJson ?? null)
  const decisionWarnings = parseWarnings(decisionsImportRun?.warningsJson ?? null)
  const workflowConfidenceDowngraded = (projectPlan?.workflowState.reasons ?? []).some((r) =>
    r.toLowerCase().includes('stale')
  )
  const workflowConfidenceSupported = !workflowConfidenceDowngraded && projectPlan?.continuity.status === 'fresh'

  return (
    <div className="flex flex-col lg:flex-row min-h-screen min-w-screen w-full bg-[#0b0f1a] text-slate-200 font-sans overflow-x-hidden">
      <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#111827] border-b lg:border-b-0 lg:border-r border-slate-800 p-5 md:p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-600 px-3 py-1 rounded-lg font-black text-white text-xl uppercase tracking-tighter text-center min-w-[45px]">LW</div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Command</h1>
        </div>
        <nav className="flex-none lg:flex-1 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 px-2">Main Menu</p>
          <button className="flex items-center gap-3 w-full p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 font-bold">
            <Layout size={20} /> Dashboard
          </button>
        </nav>
        <div className="mt-6 lg:mt-auto pt-6 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase text-center">L.W. Hub v1.0.0</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-5 md:p-8 xl:p-12 bg-gradient-to-br from-[#0b0f1a] to-[#0f172a]">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end mb-12 gap-6">
          <div>
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">Project Hub</h2>
            <p className="text-slate-400 mt-3 font-mono text-sm tracking-widest uppercase opacity-70">
              {projectsLoading ? 'Loading workspace...' : `${projects.length} Environments Discovered`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 w-full lg:w-auto lg:justify-end">
            <button
              onClick={handleScanWorkspace}
              disabled={scanInFlight}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <RefreshCw size={20} className={scanInFlight ? 'animate-spin' : ''} />
              {scanInFlight ? 'Scanning...' : 'Scan Workspace'}
            </button>
            <button className="flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95 w-full sm:w-auto">
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
            <div className="p-5 md:p-8 xl:p-10 bg-[#111827]/80 backdrop-blur-md rounded-[2.5rem] border-2 border-slate-800 shadow-2xl space-y-10">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div className="space-y-3">
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    {selectedProject.name} Roadmap
                  </h3>
                  <p className="text-blue-500 font-mono text-xs uppercase tracking-[0.2em] font-bold">
                    Planning Status: {getPlanningStatusLabel(selectedProject.planningStatus)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <span className="text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] bg-slate-800/70 text-slate-300 border border-slate-700/60">
                    Sources: {selectedProject.artifactCount}
                  </span>
                  <span className="text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] bg-slate-800/70 text-slate-300 border border-slate-700/60">
                    Repo: {selectedProject.hasGit ? 'git' : 'local'}
                  </span>
                  <span className="text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] bg-slate-800/70 text-slate-300 border border-slate-700/60">
                    Stack: {selectedProject.framework ?? selectedProject.projectType}
                  </span>
                </div>
              </div>

              <div className="grid gap-6">
                <section className="space-y-3 border-t border-slate-800/70 pt-6">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight text-white">Workflow State</h4>
                      <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2">
                        First-pass dominant phase for the active repo loop
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${getWorkflowPhaseClassName(projectPlan?.workflowState.phase ?? 'no-data')}`}>
                        Phase: {projectPlan?.workflowState.phase ?? 'no-data'}
                      </span>
                      <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${getWorkflowConfidenceClassName(projectPlan?.workflowState.confidence ?? 0)}`}>
                        Confidence: {projectPlan?.workflowState.confidence != null ? `${Math.round(projectPlan.workflowState.confidence * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#1e293b]/30 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">Evidence</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {(projectPlan?.workflowState.evidence ?? []).map((item) => (
                        <li key={item.label} className="flex gap-2">
                          <span className="text-slate-500 min-w-[110px] shrink-0">{item.label}</span>
                          <span className="text-slate-200">{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(projectPlan?.workflowState.reasons ?? []).length > 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-[#1e293b]/30 px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">Reasons</p>
                      <ul className="space-y-1 text-sm text-slate-300 list-disc pl-5">
                        {(projectPlan?.workflowState.reasons ?? []).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {workflowConfidenceDowngraded ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 max-w-3xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-300 mb-2">Confidence note</p>
                      <p className="text-sm text-amber-100/90">
                        Workflow confidence was reduced because repo-local Holistic continuity is stale.
                      </p>
                    </div>
                  ) : null}

                  {workflowConfidenceSupported ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 max-w-3xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300 mb-2">Confidence note</p>
                      <p className="text-sm text-emerald-100/90">
                        Confidence is supported by fresh repo-local Holistic continuity.
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3 border-t border-slate-800/70 pt-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight text-white">Continuity</h4>
                      <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2">
                        Repo-local Holistic freshness and checkpoint hygiene
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${getContinuityStatusClassName(projectPlan?.continuity.status ?? 'missing')}`}>
                        Status: {projectPlan?.continuity.status ?? 'missing'}
                      </span>
                      <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${projectPlan?.continuity.checkpointHygiene === 'ok' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : projectPlan?.continuity.checkpointHygiene === 'stale' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-slate-700/40 text-slate-300 border border-slate-600/20'}`}>
                        Checkpoint: {projectPlan?.continuity.checkpointHygiene ?? 'missing'}
                      </span>
                    </div>
                  </div>

                  {projectPlan?.continuity.freshAt ? (
                    <p className="text-sm text-slate-400">
                      Last updated {new Date(projectPlan.continuity.freshAt).toLocaleString()}
                      {projectPlan.continuity.ageHours !== null ? ` (${projectPlan.continuity.ageHours} h ago)` : ''}
                    </p>
                  ) : null}

                  <div className="rounded-2xl border border-slate-800 bg-[#1e293b]/30 px-4 py-4 space-y-2">
                    {projectPlan?.continuity.latestWork ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Latest work</p>
                        <p className="text-sm text-slate-300">{projectPlan.continuity.latestWork}</p>
                      </>
                    ) : null}
                    {!projectPlan?.continuity.latestWork ? (
                      <p className="text-sm text-slate-500 italic">No continuity detail available.</p>
                    ) : null}
                  </div>

                  {/* Hygiene callout — visible when stale or missing, compact confirmation when ok */}
                  {projectPlan?.continuity.checkpointHygiene === 'ok' ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                      <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-300">
                          {projectPlan.continuity.hygieneNote ?? 'Checkpoint hygiene is good.'}
                        </p>
                        {projectPlan.continuity.checkpointCount != null && projectPlan.continuity.checkpointCount > 0 ? (
                          <p className="text-[11px] text-emerald-200/70">
                            {projectPlan.continuity.checkpointCount} passive capture{projectPlan.continuity.checkpointCount === 1 ? '' : 's'}
                            {projectPlan.continuity.lastCheckpointReason ? `, last reason: ${projectPlan.continuity.lastCheckpointReason}` : ''}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (projectPlan?.continuity.checkpointHygiene === 'stale' || projectPlan?.continuity.checkpointHygiene === 'missing') ? (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={16} className={`mt-0.5 shrink-0 ${projectPlan.continuity.checkpointHygiene === 'missing' ? 'text-red-400' : 'text-amber-400'}`} />
                        <div className="space-y-1">
                          <p className={`text-xs font-bold uppercase tracking-[0.1em] ${projectPlan.continuity.checkpointHygiene === 'missing' ? 'text-red-300' : 'text-amber-300'}`}>
                            Checkpoint hygiene: {projectPlan.continuity.checkpointHygiene}
                          </p>
                          <p className="text-sm text-slate-300">
                            {projectPlan.continuity.hygieneNote ?? 'No checkpoint record found. Run a handoff to preserve continuity.'}
                          </p>
                          {projectPlan.continuity.checkpointCount != null && projectPlan.continuity.checkpointCount > 0 ? (
                            <p className="text-[11px] text-slate-400">
                              {projectPlan.continuity.checkpointCount} passive capture{projectPlan.continuity.checkpointCount === 1 ? '' : 's'}
                              {projectPlan.continuity.lastCheckpointReason ? `, last reason: ${projectPlan.continuity.lastCheckpointReason}` : ''}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {projectPlan.continuity.handoffCommand ? (
                        <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2">
                          <Send size={13} className="text-slate-400 shrink-0" />
                          <code className="text-xs text-slate-300 font-mono break-all">{projectPlan.continuity.handoffCommand}</code>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3 border-t border-slate-800/70 pt-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight text-white">Next Action</h4>
                      <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2">
                        First-pass recommendation for what to do next in this repo
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${getNextActionBlockersPresent(projectPlan?.nextAction.blockers) ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                      {getNextActionBlockersPresent(projectPlan?.nextAction.blockers) ? 'Blocked' : 'Clear'}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#1e293b]/30 px-4 py-4 space-y-3">
                    <p className="text-lg font-bold tracking-tight text-slate-100">
                      {projectPlan?.nextAction.action ?? 'No recommendation available'}
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {projectPlan?.nextAction.rationale ?? 'The cockpit does not have enough evidence to recommend a next step yet.'}
                    </p>
                    {getNextActionBlockersPresent(projectPlan?.nextAction.blockers) && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">Blockers</p>
                        <ul className="space-y-1">
                          {(projectPlan?.nextAction.blockers ?? []).map((b) => (
                            <li key={b} className="text-sm text-red-300 flex gap-2 items-start">
                              <span className="mt-0.5 shrink-0">⚠</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              </div>

              <section className="space-y-4 border-t border-slate-800/70 pt-8">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 rounded-3xl border border-slate-800 bg-slate-950/40 p-6">
                  <div className="space-y-2">
                    <h4 className="text-xl font-black uppercase tracking-tight text-white">Import Controls</h4>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
                      Re-import canonical planning artifacts from repo docs
                    </p>
                    {projectPlan?.latestImportRun ? (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${projectPlan.latestImportRun.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : projectPlan.latestImportRun.status === 'partial'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
                            }`}>
                            Latest import {projectPlan.latestImportRun.status}
                          </span>
                          <span className={`inline-flex text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${latestImportWarnings.length > 0
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
                            }`}>
                            {latestImportWarnings.length} warning{latestImportWarnings.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        {projectPlan.latestImportRun.summary ? (
                          <p className="text-sm text-slate-400 max-w-2xl">{projectPlan.latestImportRun.summary}</p>
                        ) : null}
                        {latestImportWarnings.length > 0 ? (
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 max-w-3xl">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-300 mb-3">Import warnings</p>
                            <ul className="space-y-2 text-sm text-amber-100/90 list-disc pl-5">
                              {latestImportWarnings.map((warning, index) => (
                                <li key={`${index}-${warning}`}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 max-w-2xl">
                        No imports recorded yet for this project.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 xl:justify-end">
                    <button
                      onClick={handleImportMilestones}
                      disabled={milestonesImportInFlight || projectPlanLoading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-blue-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={16} className={milestonesImportInFlight ? 'animate-spin' : ''} />
                      {milestonesImportInFlight ? 'Importing...' : 'Import Milestones'}
                    </button>
                    <button
                      onClick={handleImportRequirements}
                      disabled={requirementsImportInFlight || projectPlanLoading}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-emerald-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={16} className={requirementsImportInFlight ? 'animate-spin' : ''} />
                      {requirementsImportInFlight ? 'Importing...' : 'Import Requirements'}
                    </button>
                    <button
                      onClick={handleImportDecisions}
                      disabled={decisionsImportInFlight || projectPlanLoading}
                      className="flex items-center gap-2 bg-violet-600 text-white px-4 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-violet-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={16} className={decisionsImportInFlight ? 'animate-spin' : ''} />
                      {decisionsImportInFlight ? 'Importing...' : 'Import Decisions'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-[#1e293b]/30 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-300">Milestones</p>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] ${milestoneImportRun?.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : milestoneImportRun?.status === 'partial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : milestoneImportRun?.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
                        }`}>
                        {milestoneImportRun?.status ?? 'none'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{milestoneWarnings.length} warning{milestoneWarnings.length === 1 ? '' : 's'}</p>
                    <p className="text-xs text-slate-500">{milestoneImportRun?.summary ?? 'No milestone import recorded yet.'}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#1e293b]/30 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">Requirements</p>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] ${requirementsImportRun?.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : requirementsImportRun?.status === 'partial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : requirementsImportRun?.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
                        }`}>
                        {requirementsImportRun?.status ?? 'none'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{requirementWarnings.length} warning{requirementWarnings.length === 1 ? '' : 's'}</p>
                    <p className="text-xs text-slate-500">{requirementsImportRun?.summary ?? 'No requirements import recorded yet.'}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#1e293b]/30 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-300">Decisions</p>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] ${decisionsImportRun?.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : decisionsImportRun?.status === 'partial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : decisionsImportRun?.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
                        }`}>
                        {decisionsImportRun?.status ?? 'none'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{decisionWarnings.length} warning{decisionWarnings.length === 1 ? '' : 's'}</p>
                    <p className="text-xs text-slate-500">{decisionsImportRun?.summary ?? 'No decisions import recorded yet.'}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                      <Flag size={20} className="text-blue-400" /> Imported Milestones
                    </h4>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2">
                      Canonical planning model from imported project docs
                    </p>
                  </div>
                </div>

                {projectPlanLoading ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading canonical plan...</p>
                  </div>
                ) : projectPlanError ? (
                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-sm font-bold uppercase tracking-wide text-red-300 flex items-center gap-3">
                    <AlertCircle size={18} />
                    {projectPlanError}
                  </div>
                ) : importedMilestones.length > 0 ? (
                  <div className="grid gap-4">
                    {importedMilestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-6 bg-[#1e293b]/30 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start gap-5">
                          <Flag className="text-blue-400 mt-1" size={22} />
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {milestone.externalKey ? (
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-500/10 text-blue-400 uppercase tracking-[0.15em] border border-blue-500/20">
                                  {milestone.externalKey}
                                </span>
                              ) : null}
                              <span className="text-xl font-bold tracking-tight text-slate-100">
                                {milestone.title}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-500 uppercase tracking-tighter">
                                {milestone.origin}
                              </span>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-500 uppercase tracking-tighter">
                                Confidence {Math.round(milestone.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${getMilestoneStatusClassName(milestone.status)}`}>
                          {milestone.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
                    <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Imported Milestones Found Yet</p>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
                      This project may not have been imported yet or may not have supported docs.
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t border-slate-800/70 pt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                      <FileText size={20} className="text-emerald-400" /> Imported Requirements
                    </h4>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2">
                      Canonical requirements imported from repo planning docs
                    </p>
                  </div>
                </div>

                {projectPlanLoading ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading imported requirements...</p>
                  </div>
                ) : importedRequirements.length > 0 ? (
                  <div className="grid gap-4">
                    {importedRequirements.map((requirement) => (
                      <div
                        key={requirement.id}
                        className="p-6 bg-[#1e293b]/30 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              {requirement.externalKey ? (
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-[0.15em] border border-emerald-500/20">
                                  {requirement.externalKey}
                                </span>
                              ) : null}
                              <span className="text-xl font-bold tracking-tight text-slate-100">
                                {requirement.title}
                              </span>
                            </div>
                            {requirement.description ? (
                              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                                {requirement.description}
                              </p>
                            ) : null}
                          </div>
                          <span className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.15em] ${getRequirementStatusClassName(requirement.status)}`}>
                            {requirement.status}
                          </span>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {requirement.primaryOwner ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-tighter">
                              Owner {requirement.primaryOwner}
                            </span>
                          ) : null}
                          {requirement.supportingSlices ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-tighter">
                              Support {requirement.supportingSlices}
                            </span>
                          ) : null}
                          {requirement.validation ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-tighter">
                              Validation defined
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
                    <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Imported Requirements Found Yet</p>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
                      Import `.gsd/REQUIREMENTS.md` to populate the canonical requirements model.
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t border-slate-800/70 pt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                      <FileText size={20} className="text-violet-400" /> Imported Decisions
                    </h4>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2">
                      Architectural and planning decisions imported from repo docs
                    </p>
                  </div>
                </div>

                {projectPlanLoading ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading imported decisions...</p>
                  </div>
                ) : importedDecisions.length > 0 ? (
                  <div className="grid gap-4">
                    {importedDecisions.map((decision) => (
                      <div
                        key={decision.id}
                        className="p-6 bg-[#1e293b]/30 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              {decision.externalKey ? (
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-violet-500/10 text-violet-400 uppercase tracking-[0.15em] border border-violet-500/20">
                                  {decision.externalKey}
                                </span>
                              ) : null}
                              {decision.scope ? (
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-800 text-slate-400 uppercase tracking-[0.15em] border border-slate-700/50">
                                  {decision.scope}
                                </span>
                              ) : null}
                              <span className="text-xl font-bold tracking-tight text-slate-100">
                                {decision.decision}
                              </span>
                            </div>
                            {decision.choice ? (
                              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                                Choice: {decision.choice}
                              </p>
                            ) : null}
                            {decision.rationale ? (
                              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                                {decision.rationale}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {decision.whenContext ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-tighter">
                              When {decision.whenContext}
                            </span>
                          ) : null}
                          {decision.revisable ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-tighter">
                              Revisable {decision.revisable}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
                    <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Imported Decisions Found Yet</p>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
                      Import `.gsd/DECISIONS.md` to populate the canonical decision register.
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t border-slate-800/70 pt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                      <Send size={18} className="text-slate-400" /> Legacy SQLite Tasks
                    </h4>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-2">
                      Existing task rows preserved during migration to canonical planning
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
                    <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
                      <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Legacy Roadmap Tasks Found in SQLite</p>
                      <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
                        Canonical milestones are now the primary planning surface.
                      </p>
                    </div>
                  )}
                </div>
              </section>
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
