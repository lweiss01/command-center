import { useEffect, useMemo, useState } from 'react'
import { Layout, Plus, Search, CheckCircle2, Circle, Send, RefreshCw, BookOpen } from 'lucide-react'

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

interface StackComponent {
  id: string;
  label: string;
  kind: 'repo-doc' | 'machine-tool' | 'repo-dir';
  status: 'present' | 'missing';
  note: string | null;
  required: boolean;
}

interface ReadinessReport {
  overallReadiness: 'ready' | 'partial' | 'missing';
  components: StackComponent[];
  gaps: string[];
}

interface OpenLoopItem {
  key: string | null;
  title?: string;
  status?: string;
  owner?: string | null;
  scope?: string | null;
  decision?: string;
}
interface OpenLoopsSummary {
  unresolvedCount: number;
  pendingMilestoneCount: number;
  blockedCount: number;
  deferredCount: number;
}
interface OpenLoops {
  nextMilestone: OpenLoopItem | null;
  blockedMilestones: OpenLoopItem[];
  unresolvedRequirements: OpenLoopItem[];
  deferredItems: OpenLoopItem[];
  revisableDecisions: OpenLoopItem[];
  summary: OpenLoopsSummary;
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
  readiness: ReadinessReport;
  openLoops: OpenLoops;
}

interface PortfolioEntry {
  project: Project;
  workflowPhase: string;
  workflowConfidence: number;
  continuityStatus: 'fresh' | 'stale' | 'missing';
  continuityAgeHours: number | null;
  checkpointHygiene: 'ok' | 'stale' | 'missing';
  overallReadiness: 'ready' | 'partial' | 'missing';
  readinessGaps: string[];
  unresolvedCount: number;
  pendingMilestoneCount: number;
  blockedCount: number;
  nextActionLabel: string;
  urgencyScore: number;
}

const API_BASE_URL = 'http://localhost:3001'
const DEFAULT_SCAN_ROOT = 'C:/Users/lweis/Documents'
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
const USER_GUIDE_URL = 'https://github.com/lweiss01/command-center/blob/main/docs/USER-GUIDE.md'

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
  const [portfolioData, setPortfolioData] = useState<Map<number, PortfolioEntry>>(new Map())
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [projectSortMode, setProjectSortMode] = useState<'urgency' | 'name'>('urgency')

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
    if (projects.length === 0) return
    setPortfolioLoading(true)
    fetch(`${API_BASE_URL}/api/portfolio`)
      .then(res => res.json())
      .then((data: PortfolioEntry[]) => {
        const map = new Map<number, PortfolioEntry>()
        for (const entry of data) {
          map.set(entry.project.id, entry)
        }
        setPortfolioData(map)
      })
      .catch(err => {
        console.error('Portfolio fetch failed (degraded mode):', err)
      })
      .finally(() => {
        setPortfolioLoading(false)
      })
  }, [projects])

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
    let result = projects

    if (normalizedQuery) {
      result = projects.filter((project) => {
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
    }

    return [...result].sort((a, b) => {
      if (projectSortMode === 'urgency') {
        const scoreA = portfolioData.get(a.id)?.urgencyScore ?? -1
        const scoreB = portfolioData.get(b.id)?.urgencyScore ?? -1
        return scoreB - scoreA
      }
      return a.name.localeCompare(b.name)
    })
  }, [projects, searchQuery, projectSortMode, portfolioData])

  const getPlanningStatusLabel = (status: Project['planningStatus']) => {
    if (status === 'structured') return 'Structured'
    if (status === 'partial') return 'Partial'
    return 'None'
  }

  const getReadinessClassName = (_s: 'ready' | 'partial' | 'missing') => _s
  void getReadinessClassName

  const getNextActionBlockersPresent = (blockers: string[] | undefined) => !!blockers && blockers.length > 0;

  const getNextActionSuggestedCommand = (nextAction: NextAction | null): string | null => {
    if (!nextAction) return null

    const blockers = nextAction.blockers ?? []
    if (blockers.some((b) => /holistic|gsd|tool/i.test(b))) {
      return 'npm run cc:doctor'
    }

    if (/import/i.test(nextAction.action)) {
      return 'npm run cc:launch -- -NoBrowser'
    }

    if (/continue execution|review the current plan/i.test(nextAction.action)) {
      return 'npm run cc:launch -- -NoBrowser'
    }

    return null
  }

  const nextActionBlockers = projectPlan?.nextAction.blockers ?? []
  const nextActionHasBlockers = getNextActionBlockersPresent(nextActionBlockers)
  const nextActionSuggestedCommand = getNextActionSuggestedCommand(projectPlan?.nextAction ?? null)

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

  const importSourceLabels = {
    milestones: '.gsd/PROJECT.md',
    requirements: '.gsd/REQUIREMENTS.md',
    decisions: '.gsd/DECISIONS.md',
  } as const

  const formatImportSyncTime = (completedAt: string | null | undefined) => {
    if (!completedAt) return 'unknown'
    const parsed = new Date(completedAt)
    if (Number.isNaN(parsed.getTime())) return 'unknown'
    return parsed.toLocaleString()
  }

  const formatImportProvenance = (run: ImportRun | null, sourceLabel: string) => {
    const syncedAt = formatImportSyncTime(run?.completedAt)
    return `Last synced ${syncedAt} Â· source ${sourceLabel}`
  }

  const milestoneProvenance = formatImportProvenance(milestoneImportRun, importSourceLabels.milestones)
  const requirementProvenance = formatImportProvenance(requirementsImportRun, importSourceLabels.requirements)
  const decisionProvenance = formatImportProvenance(decisionsImportRun, importSourceLabels.decisions)

  // â”€â”€â”€ Phase color helpers (new design system) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const phaseAccent = (phase: string) => {
    if (phase === 'active')      return '#c8f135'
    if (phase === 'stalled')     return '#f5a623'
    if (phase === 'blocked')     return '#e05252'
    if (phase === 'import-only') return '#5b9cf6'
    return '#3a3a40'
  }
  const phaseTagClass = (phase: string) => {
    if (phase === 'active')      return 'tag-lime'
    if (phase === 'stalled')     return 'tag-amber'
    if (phase === 'blocked')     return 'tag-red'
    if (phase === 'import-only') return 'tag-blue'
    return 'tag-muted'
  }
  const continuityTagClass = (s: ContinuityState['status']) => {
    if (s === 'fresh')  return 'tag-lime'
    if (s === 'stale')  return 'tag-amber'
    return 'tag-muted'
  }
  const planTagClass = (s: Project['planningStatus']) => {
    if (s === 'structured') return 'tag-lime'
    if (s === 'partial')    return 'tag-amber'
    return 'tag-muted'
  }
  const milestoneTagClass = (s: Milestone['status']) => {
    if (s === 'done')    return 'tag-lime'
    if (s === 'active')  return 'tag-amber'
    if (s === 'blocked') return 'tag-red'
    if (s === 'draft')   return 'tag-muted'
    return 'tag-blue'
  }
  const reqTagClass = (s: Requirement['status']) => {
    if (s === 'validated')   return 'tag-lime'
    if (s === 'deferred' || s === 'out-of-scope') return 'tag-amber'
    return 'tag-blue'
  }
  const confidenceTagClass = (c: number) => {
    if (c >= 0.7) return 'tag-lime'
    if (c >= 0.4) return 'tag-amber'
    return 'tag-muted'
  }
  const readinessTagClass = (s: 'ready' | 'partial' | 'missing') => {
    if (s === 'ready')   return 'tag-lime'
    if (s === 'partial') return 'tag-amber'
    return 'tag-muted'
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>

      {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', width: '220px', flexShrink: 0 }}
        className="hidden lg:flex flex-col min-h-screen">

        {/* Logo mark */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--accent)', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layout size={16} color="var(--accent-text)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em', color: 'var(--text-primary)', lineHeight: 1 }}>
                COMMAND
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: '3px' }}>
                CENTER
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.14em', padding: '0 8px 10px' }}>
            NAVIGATION
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 10px', borderRadius: '6px', background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.18)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135]">
            <Layout size={15} />
            Dashboard
          </button>
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            v{APP_VERSION}
          </div>
        </div>
      </aside>

      {/* â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="flex-1 min-w-0 flex flex-col" style={{ background: 'var(--bg-base)' }}>

        {/* Top bar */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            {projectsLoading ? 'Scanning...' : `${projects.length} projects`}
          </div>
          <div className="flex items-center gap-3">
            <a href={USER_GUIDE_URL} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'color 0.15s' }}
              className="hover:text-[#f0f0ee] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c8f135] rounded">
              <BookOpen size={13} /> Guide
            </a>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
            <button
              disabled
              title="Coming soon"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'not-allowed', opacity: 0.4, padding: '4px 8px' }}>
              <Plus size={13} /> New Project
            </button>
            <button
              onClick={handleScanWorkspace}
              disabled={scanInFlight}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', transition: 'opacity 0.15s' }}
              className="hover:opacity-90 active:opacity-75 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161618]">
              <RefreshCw size={13} className={scanInFlight ? 'animate-spin' : ''} />
              {scanInFlight ? 'Scanningâ€¦' : 'Scan Workspace'}
            </button>
          </div>
        </div>

        <div style={{ padding: '40px' }} className="flex-1">

          {/* Page heading */}
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '36px', letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text-primary)', margin: 0 }}>
                Project Hub
              </h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '8px' }}>
                {projectsLoading ? 'LOADING WORKSPACE' : `${projects.length} ENVIRONMENTS DISCOVERED`}
              </p>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter projectsâ€¦"
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '9px 14px 9px 36px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                className="focus:border-[#c8f135]/40 focus-visible:ring-1 focus-visible:ring-[#c8f135]"
              />
            </div>
            {/* Sort */}
            <button
              onClick={() => setProjectSortMode(prev => prev === 'urgency' ? 'name' : 'urgency')}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: projectSortMode === 'urgency' ? 'var(--accent)' : 'var(--text-muted)', background: projectSortMode === 'urgency' ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${projectSortMode === 'urgency' ? 'rgba(200,241,53,0.25)' : 'var(--border)'}`, borderRadius: '4px', padding: '7px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
              className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c8f135]">
              {projectSortMode === 'urgency' ? 'â†“ Urgency' : 'â†“ Name'}
            </button>
            {portfolioLoading && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Loading signalsâ€¦</span>
            )}
          </div>

          {/* Error */}
          {projectsError && (
            <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: '6px', padding: '12px 16px', marginBottom: '24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#e05252', letterSpacing: '0.04em' }}>
              {projectsError}
            </div>
          )}

          {/* Project grid */}
          {projectsLoading ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>LOADING PROJECTSâ€¦</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-16">
              {filteredProjects.map((project) => {
                const entry = portfolioData.get(project.id)
                const phase = entry?.workflowPhase ?? 'no-data'
                const accent = phaseAccent(phase)
                const isSelected = selectedProject?.id === project.id
                const continuityLabel = entry
                  ? (entry.continuityStatus === 'fresh' && entry.continuityAgeHours !== null
                    ? `fresh ${Math.round(entry.continuityAgeHours)}h`
                    : entry.continuityStatus)
                  : null
                const gapsCount = entry?.readinessGaps.length ?? 0
                const unresolved = entry?.unresolvedCount ?? 0
                const riskParts: string[] = []
                if (gapsCount > 0) riskParts.push(`${gapsCount} gap${gapsCount !== 1 ? 's' : ''}`)
                if (unresolved > 0) riskParts.push(`${unresolved} unresolved`)

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProject(project)}
                    style={{
                      display: 'block',
                      textAlign: 'left',
                      width: '100%',
                      background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? accent : 'var(--border)'}`,
                      borderTop: `3px solid ${accent}`,
                      borderRadius: '8px',
                      padding: '20px 22px 18px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                      position: 'relative',
                    }}
                    className="hover:border-[var(--border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0e0e0f]"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em', color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
                        {project.name}
                      </h3>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', flexShrink: 0, paddingTop: '2px' }}>
                        {project.projectType === 'web_node' ? 'WEB' : project.projectType === 'python' ? 'PY' : 'GEN'}
                      </span>
                    </div>

                    {/* Path */}
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '14px' }}>
                      {project.rootPath}
                    </p>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Tag label={`Plan: ${getPlanningStatusLabel(project.planningStatus)}`} cls={planTagClass(project.planningStatus)} />
                      {portfolioLoading && !entry ? (
                        <Tag label="Â·Â·Â·" cls="tag-muted" />
                      ) : entry ? (
                        <>
                          <Tag label={`Phase: ${phase}`} cls={phaseTagClass(phase)} />
                          {continuityLabel && <Tag label={`Continuity: ${continuityLabel}`} cls={continuityTagClass(entry.continuityStatus)} />}
                        </>
                      ) : null}
                    </div>

                    {/* Risk line */}
                    {riskParts.length > 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em', margin: 0 }}>
                        {riskParts.join(' Â· ')}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '80px 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '20px' }}>
                {projects.length === 0 ? 'NO PROJECTS DISCOVERED YET' : 'NO PROJECTS MATCH FILTER'}
              </p>
              <button
                onClick={handleScanWorkspace}
                disabled={scanInFlight}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', transition: 'opacity 0.15s' }}
                className="disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135]">
                <RefreshCw size={13} className={scanInFlight ? 'animate-spin' : ''} />
                {scanInFlight ? 'Scanningâ€¦' : 'Scan Workspace'}
              </button>
            </div>
          )}

          {/* â”€â”€ Detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div id="roadmap-section">
            {selectedProject ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '40px' }}>

                {/* Panel heading */}
                <div className="flex items-start justify-between gap-6 mb-8">
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedProject.name}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '6px' }}>
                      {selectedProject.rootPath}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Tag label={`Plan: ${getPlanningStatusLabel(selectedProject.planningStatus)}`} cls={planTagClass(selectedProject.planningStatus)} />
                    <Tag label={`${selectedProject.artifactCount} sources`} cls="tag-muted" />
                    <Tag label={selectedProject.hasGit ? 'git' : 'local'} cls="tag-muted" />
                    <Tag label={selectedProject.framework ?? selectedProject.projectType} cls="tag-muted" />
                  </div>
                </div>

                {/* â”€â”€ Panel sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="space-y-6">

                  {/* Workflow State */}
                  <PanelSection title="Workflow State" subtitle="Interpreted phase from imported artifacts and continuity signals">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Tag label={`Phase: ${projectPlan?.workflowState.phase ?? 'no-data'}`} cls={phaseTagClass(projectPlan?.workflowState.phase ?? 'no-data')} />
                      <Tag label={`Confidence: ${projectPlan?.workflowState.confidence != null ? Math.round(projectPlan.workflowState.confidence * 100) + '%' : '0%'}`} cls={confidenceTagClass(projectPlan?.workflowState.confidence ?? 0)} />
                    </div>
                    <DataGrid rows={(projectPlan?.workflowState.evidence ?? []).map(e => [e.label, e.value])} />
                    {(projectPlan?.workflowState.reasons ?? []).length > 0 && (
                      <ul style={{ margin: '12px 0 0', paddingLeft: '16px' }}>
                        {projectPlan!.workflowState.reasons.map(r => (
                          <li key={r} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</li>
                        ))}
                      </ul>
                    )}
                    {workflowConfidenceDowngraded && (
                      <CalloutBox variant="amber" label="Confidence note">Workflow confidence reduced â€” repo continuity is stale.</CalloutBox>
                    )}
                    {workflowConfidenceSupported && (
                      <CalloutBox variant="lime" label="Confidence note">Confidence supported by fresh repo continuity.</CalloutBox>
                    )}
                  </PanelSection>

                  {/* Readiness */}
                  {projectPlan?.readiness && (
                    <PanelSection title="Workflow Readiness" subtitle="Repo docs, tool probes, and stack presence">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Tag label={`Readiness: ${projectPlan.readiness.overallReadiness}`} cls={readinessTagClass(projectPlan.readiness.overallReadiness)} />
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {projectPlan.readiness.components.map(c => (
                          <li key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            <span style={{ color: c.status === 'present' ? '#4ade80' : '#e05252', flexShrink: 0, marginTop: '1px' }}>{c.status === 'present' ? 'âœ“' : 'âœ—'}</span>
                            <span style={{ color: 'var(--text-secondary)', minWidth: '160px', flexShrink: 0 }}>{c.label}{c.required && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>(req)</span>}</span>
                            {c.note && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{c.note}</span>}
                          </li>
                        ))}
                      </ul>
                      {projectPlan.readiness.gaps.length > 0 && (
                        <CalloutBox variant="red" label="Gaps">
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {projectPlan.readiness.gaps.map(g => <li key={g} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e05252', lineHeight: 1.7 }}>{g}</li>)}
                          </ul>
                        </CalloutBox>
                      )}
                    </PanelSection>
                  )}

                  {/* Continuity */}
                  <PanelSection title="Continuity" subtitle="Holistic freshness and checkpoint hygiene">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Tag label={`Status: ${projectPlan?.continuity.status ?? 'missing'}`} cls={continuityTagClass(projectPlan?.continuity.status ?? 'missing')} />
                      <Tag
                        label={`Checkpoint: ${projectPlan?.continuity.checkpointHygiene ?? 'missing'}`}
                        cls={projectPlan?.continuity.checkpointHygiene === 'ok' ? 'tag-lime' : projectPlan?.continuity.checkpointHygiene === 'stale' ? 'tag-amber' : 'tag-muted'}
                      />
                    </div>
                    {projectPlan?.continuity.freshAt && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Updated {new Date(projectPlan.continuity.freshAt).toLocaleString()}{projectPlan.continuity.ageHours !== null ? ` Â· ${projectPlan.continuity.ageHours}h ago` : ''}
                      </p>
                    )}
                    {projectPlan?.continuity.latestWork && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
                        {projectPlan.continuity.latestWork}
                      </p>
                    )}
                    {projectPlan?.continuity.checkpointHygiene === 'ok' ? (
                      <CalloutBox variant="lime" label="Hygiene">
                        {projectPlan.continuity.hygieneNote ?? 'Checkpoint hygiene is good.'}
                        {projectPlan.continuity.checkpointCount ? ` Â· ${projectPlan.continuity.checkpointCount} capture${projectPlan.continuity.checkpointCount !== 1 ? 's' : ''}` : ''}
                      </CalloutBox>
                    ) : (projectPlan?.continuity.checkpointHygiene === 'stale' || projectPlan?.continuity.checkpointHygiene === 'missing') ? (
                      <CalloutBox variant={projectPlan.continuity.checkpointHygiene === 'missing' ? 'red' : 'amber'} label={`Hygiene: ${projectPlan.continuity.checkpointHygiene}`}>
                        <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {projectPlan.continuity.hygieneNote ?? 'No checkpoint record found. Run a handoff to preserve continuity.'}
                        </p>
                        {projectPlan.continuity.handoffCommand && (
                          <code style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.25)', borderRadius: '4px', padding: '8px 10px', wordBreak: 'break-all' }}>
                            {projectPlan.continuity.handoffCommand}
                          </code>
                        )}
                      </CalloutBox>
                    ) : null}
                  </PanelSection>

                  {/* Next Action */}
                  <PanelSection title="Next Action" subtitle="Interpreted recommendation from workflow, readiness, continuity, and blockers">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Tag label={nextActionHasBlockers ? 'Blocked' : 'Clear'} cls={nextActionHasBlockers ? 'tag-red' : 'tag-lime'} />
                    </div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                      {projectPlan?.nextAction.action ?? 'No recommendation available'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '600px', marginBottom: '12px' }}>
                      {projectPlan?.nextAction.rationale ?? 'Insufficient evidence to recommend a next step.'}
                    </p>
                    {nextActionSuggestedCommand && (
                      <code style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px', border: '1px solid rgba(200,241,53,0.15)' }}>
                        {nextActionSuggestedCommand}
                      </code>
                    )}
                    {nextActionHasBlockers && (
                      <CalloutBox variant="red" label={`${nextActionBlockers.length} blocker${nextActionBlockers.length !== 1 ? 's' : ''}`}>
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                          {nextActionBlockers.map(b => <li key={b} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e05252', lineHeight: 1.7 }}>{b}</li>)}
                        </ul>
                      </CalloutBox>
                    )}
                  </PanelSection>

                  {/* Open Loops */}
                  {projectPlan?.openLoops && (
                    <PanelSection title="Open Loops" subtitle="Milestones, requirements, and decisions still unresolved">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Tag label={`${projectPlan.openLoops.summary.unresolvedCount} unresolved`} cls="tag-amber" />
                        {projectPlan.openLoops.summary.deferredCount > 0 && <Tag label={`${projectPlan.openLoops.summary.deferredCount} deferred`} cls="tag-muted" />}
                        {projectPlan.openLoops.summary.blockedCount > 0 && <Tag label={`${projectPlan.openLoops.summary.blockedCount} blocked`} cls="tag-red" />}
                      </div>

                      {/* Next Milestone */}
                      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px', marginBottom: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '8px' }}>NEXT MILESTONE</div>
                        {projectPlan.openLoops.nextMilestone ? (
                          <div className="flex flex-wrap items-center gap-3">
                            {projectPlan.openLoops.nextMilestone.key && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{projectPlan.openLoops.nextMilestone.key}</span>}
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{projectPlan.openLoops.nextMilestone.title ?? '(untitled)'}</span>
                            {projectPlan.openLoops.nextMilestone.status && <Tag label={projectPlan.openLoops.nextMilestone.status} cls="tag-blue" />}
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#4ade80' }}>All milestones complete</span>
                        )}
                      </div>

                      {projectPlan.openLoops.blockedMilestones.length > 0 && (
                        <CalloutBox variant="red" label="Blocked milestones">
                          {projectPlan.openLoops.blockedMilestones.map((m, i) => (
                            <div key={m.key ?? i} style={{ display: 'flex', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e05252', lineHeight: 1.7 }}>
                              {m.key && <span style={{ color: 'rgba(224,82,82,0.5)' }}>{m.key}</span>}
                              <span>{m.title ?? '(untitled)'}</span>
                            </div>
                          ))}
                        </CalloutBox>
                      )}

                      {projectPlan.openLoops.unresolvedRequirements.length > 0 && (
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px', marginTop: '8px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '10px' }}>UNRESOLVED REQUIREMENTS</div>
                          <div className="space-y-2">
                            {projectPlan.openLoops.unresolvedRequirements.slice(0, 5).map((r, i) => (
                              <div key={r.key ?? i} className="flex items-start gap-3">
                                {r.key && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0, paddingTop: '2px' }}>{r.key}</span>}
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>{r.title ?? '(untitled)'}</span>
                              </div>
                            ))}
                            {projectPlan.openLoops.unresolvedRequirements.length > 5 && (
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>+{projectPlan.openLoops.unresolvedRequirements.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      )}

                      {projectPlan.openLoops.revisableDecisions.length > 0 && (
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px', marginTop: '8px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '10px' }}>REVISABLE DECISIONS</div>
                          {projectPlan.openLoops.revisableDecisions.map((d, i) => (
                            <div key={d.key ?? i} style={{ marginBottom: '8px' }}>
                              {d.scope && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>{d.scope.toUpperCase()}</p>}
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.decision}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </PanelSection>
                  )}

                  {/* Import Controls */}
                  <PanelSection title="Import Controls" subtitle="Re-import canonical planning artifacts from repo docs">
                    <div className="flex flex-wrap gap-3 mb-6">
                      <ActionButton onClick={handleImportMilestones} loading={milestonesImportInFlight} disabled={projectPlanLoading} color="blue">
                        Import Milestones
                      </ActionButton>
                      <ActionButton onClick={handleImportRequirements} loading={requirementsImportInFlight} disabled={projectPlanLoading} color="lime">
                        Import Requirements
                      </ActionButton>
                      <ActionButton onClick={handleImportDecisions} loading={decisionsImportInFlight} disabled={projectPlanLoading} color="violet">
                        Import Decisions
                      </ActionButton>
                    </div>

                    {projectPlan?.latestImportRun && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Tag label={`Latest: ${projectPlan.latestImportRun.status}`} cls={projectPlan.latestImportRun.status === 'success' ? 'tag-lime' : projectPlan.latestImportRun.status === 'partial' ? 'tag-amber' : 'tag-muted'} />
                        {latestImportWarnings.length > 0 && <Tag label={`${latestImportWarnings.length} warning${latestImportWarnings.length !== 1 ? 's' : ''}`} cls="tag-amber" />}
                      </div>
                    )}

                    {latestImportWarnings.length > 0 && (
                      <CalloutBox variant="amber" label="Import warnings">
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                          {latestImportWarnings.map((w, i) => <li key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#f5a623', lineHeight: 1.7 }}>{w}</li>)}
                        </ul>
                      </CalloutBox>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      {[
                        { label: 'Milestones', run: milestoneImportRun, warnings: milestoneWarnings },
                        { label: 'Requirements', run: requirementsImportRun, warnings: requirementWarnings },
                        { label: 'Decisions', run: decisionsImportRun, warnings: decisionWarnings },
                      ].map(({ label, run, warnings }) => (
                        <div key={label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px' }}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label.toUpperCase()}</span>
                            <Tag label={run?.status ?? 'none'} cls={run?.status === 'success' ? 'tag-lime' : run?.status === 'partial' ? 'tag-amber' : run?.status === 'failed' ? 'tag-red' : 'tag-muted'} />
                          </div>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 4px' }}>{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{run?.summary ?? 'No import recorded yet.'}</p>
                        </div>
                      ))}
                    </div>
                  </PanelSection>

                  {/* Imported Milestones */}
                  <PanelSection title="Imported Milestones" subtitle={milestoneProvenance}>
                    {projectPlanLoading ? (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>Loadingâ€¦</p>
                    ) : projectPlanError ? (
                      <CalloutBox variant="red" label="Error">{projectPlanError}</CalloutBox>
                    ) : importedMilestones.length > 0 ? (
                      <div className="space-y-2">
                        {importedMilestones.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px' }}>
                            <div>
                              {m.externalKey && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>{m.externalKey}</span>}
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{m.title}</span>
                              {m.description && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.6 }}>{m.description}</p>}
                            </div>
                            <Tag label={m.status} cls={milestoneTagClass(m.status)} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No imported milestones yet." sub="Import .gsd/REQUIREMENTS.md to populate." />
                    )}
                  </PanelSection>

                  {/* Imported Requirements */}
                  <PanelSection title="Imported Requirements" subtitle={requirementProvenance}>
                    {importedRequirements.length > 0 ? (
                      <div className="space-y-2">
                        {importedRequirements.map(r => (
                          <div key={r.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px' }}>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                {r.externalKey && <Tag label={r.externalKey} cls="tag-blue" />}
                                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{r.title}</span>
                              </div>
                              <Tag label={r.status} cls={reqTagClass(r.status)} />
                            </div>
                            {r.description && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.6 }}>{r.description}</p>}
                            <div className="flex flex-wrap gap-2">
                              {r.primaryOwner && <Tag label={`Owner: ${r.primaryOwner}`} cls="tag-muted" />}
                              {r.validation && <Tag label="Validation defined" cls="tag-muted" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No imported requirements yet." sub="Import .gsd/REQUIREMENTS.md to populate." />
                    )}
                  </PanelSection>

                  {/* Imported Decisions */}
                  <PanelSection title="Imported Decisions" subtitle={decisionProvenance}>
                    {importedDecisions.length > 0 ? (
                      <div className="space-y-2">
                        {importedDecisions.map(d => (
                          <div key={d.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px' }}>
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              {d.externalKey && <Tag label={d.externalKey} cls="tag-muted" />}
                              {d.scope && <Tag label={d.scope} cls="tag-muted" />}
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{d.decision}</span>
                            </div>
                            {d.choice && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 4px', lineHeight: 1.6 }}>Choice: {d.choice}</p>}
                            {d.rationale && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{d.rationale}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No imported decisions yet." sub="Import .gsd/DECISIONS.md to populate." />
                    )}
                  </PanelSection>

                  {/* Legacy Tasks */}
                  <PanelSection title="Legacy Tasks" subtitle="SQLite task rows preserved during migration to canonical planning">
                    <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Log new taskâ€¦"
                        style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                        className="focus:border-[#c8f135]/40 focus-visible:ring-1 focus-visible:ring-[#c8f135]"
                      />
                      <button type="submit"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '6px', padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135]">
                        <Send size={14} />
                      </button>
                    </form>
                    {tasks.length > 0 ? (
                      <div className="space-y-2">
                        {tasks.map(task => (
                          <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px 16px' }}>
                            <div className="flex items-center gap-3">
                              {task.status === 'Done'
                                ? <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                                : <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '13px', color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>{task.title}</span>
                            </div>
                            <Tag label={task.status} cls={task.status === 'Done' ? 'tag-lime' : task.status === 'In-Progress' ? 'tag-amber' : 'tag-blue'} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No legacy tasks." sub="Canonical milestones are the primary planning surface." />
                    )}
                  </PanelSection>

                </div>
              </div>
            ) : (
              <div style={{ paddingTop: '60px', paddingBottom: '60px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.16em' }}>
                  SELECT A PROJECT TO INITIALIZE COMMAND VIEW
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

// â”€â”€ Design system sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Tag({ label, cls }: { label: string; cls: string }) {
  const base: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.06em', padding: '3px 7px', borderRadius: '3px', display: 'inline-block', lineHeight: 1.4, whiteSpace: 'nowrap' }
  const styles: Record<string, React.CSSProperties> = {
    'tag-lime':  { background: 'rgba(200,241,53,0.1)',  color: '#c8f135',  border: '1px solid rgba(200,241,53,0.2)' },
    'tag-amber': { background: 'rgba(245,166,35,0.1)',  color: '#f5a623',  border: '1px solid rgba(245,166,35,0.2)' },
    'tag-red':   { background: 'rgba(224,82,82,0.1)',   color: '#e05252',  border: '1px solid rgba(224,82,82,0.2)' },
    'tag-blue':  { background: 'rgba(91,156,246,0.1)',  color: '#5b9cf6',  border: '1px solid rgba(91,156,246,0.2)' },
    'tag-muted': { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  }
  return <span style={{ ...base, ...(styles[cls] ?? styles['tag-muted']) }}>{label}</span>
}

function PanelSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', letterSpacing: '0.01em', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: '5px', marginBottom: 0 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function DataGrid({ rows }: { rows: [string, string][] }) {
  if (!rows.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-muted)', minWidth: '130px', flexShrink: 0 }}>{label}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

function CalloutBox({ variant, label, children }: { variant: 'lime' | 'amber' | 'red' | 'blue'; label: string; children: React.ReactNode }) {
  const colors = {
    lime:  { bg: 'rgba(200,241,53,0.06)',  border: 'rgba(200,241,53,0.18)', label: '#c8f135' },
    amber: { bg: 'rgba(245,166,35,0.06)',  border: 'rgba(245,166,35,0.2)',  label: '#f5a623' },
    red:   { bg: 'rgba(224,82,82,0.06)',   border: 'rgba(224,82,82,0.2)',   label: '#e05252' },
    blue:  { bg: 'rgba(91,156,246,0.06)',  border: 'rgba(91,156,246,0.2)',  label: '#5b9cf6' },
  }
  const c = colors[variant]
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px', padding: '12px 14px', marginTop: '10px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: c.label, letterSpacing: '0.14em', marginBottom: '6px' }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function ActionButton({ onClick, loading, disabled, color, children }: { onClick: () => void; loading: boolean; disabled: boolean; color: 'blue' | 'lime' | 'violet'; children: React.ReactNode }) {
  const colors = {
    blue:   { bg: 'rgba(91,156,246,0.12)',  border: 'rgba(91,156,246,0.25)',  text: '#5b9cf6',  ring: '#5b9cf6' },
    lime:   { bg: 'rgba(200,241,53,0.1)',   border: 'rgba(200,241,53,0.25)',  text: '#c8f135',  ring: '#c8f135' },
    violet: { bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)', text: '#a78bfa',  ring: '#a78bfa' },
  }
  const c = colors[color]
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '7px', background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', transition: 'opacity 0.15s' }}
      className={`disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[${c.ring}]`}
    >
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Importingâ€¦' : children}
    </button>
  )
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', margin: '0 0 4px' }}>{message}</p>
      {sub && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.6, margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default App
