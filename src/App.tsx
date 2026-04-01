import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, CheckCircle2, Circle, Send, RefreshCw, BookOpen } from 'lucide-react'

interface Task { id: number; title: string; category: string; status: string }
interface Project {
  id: number; name: string; slug: string; rootPath: string; repoType: string
  projectType: string; primaryLanguage: string | null; framework: string | null
  packageManager: string | null; hasGit: boolean
  planningStatus: 'none' | 'partial' | 'structured'
  repoTag: 'active' | 'minimal' | 'archive'
  artifactCount: number; lastScannedAt: string | null; createdAt: string; updatedAt: string
}
interface Milestone {
  id: number; projectId: number; externalKey: string | null; title: string
  description: string | null; status: 'planned' | 'active' | 'blocked' | 'done' | 'draft'
  proofLevel: 'claimed' | 'proven'; origin: string; confidence: number
  needsReview: boolean; sortOrder: number
  sourceArtifactId: number | null; createdAt: string; updatedAt: string
}
interface Requirement {
  id: number; projectId: number; externalKey: string | null; title: string; description: string
  status: string; validation: string | null; notes: string | null; primaryOwner: string | null
  supportingSlices: string | null; mayBeProven: boolean; sourceArtifactId: number | null
  createdAt: string; updatedAt: string
}
interface Decision {
  id: number; projectId: number; externalKey: string | null; scope: string | null
  decision: string; choice: string | null; rationale: string | null; revisable: string | null
  whenContext: string | null; sourceArtifactId: number | null; createdAt: string; updatedAt: string
}
interface ImportRun {
  id: number; projectId: number; status: 'running' | 'success' | 'partial' | 'failed'
  strategy: string; artifactType: string; startedAt: string; completedAt: string | null
  summary: string | null; warningsJson: string | null
}
interface WorkflowState {
  phase: 'no-data' | 'import-only' | 'active' | 'stalled' | 'blocked'
  confidence: number; reasons: string[]; evidence: { label: string; value: string }[]
  proofSummary?: { proven: number; claimed: number; total: number } | null
}
interface ContinuityState {
  status: 'fresh' | 'stale' | 'missing'; freshAt: string | null; ageHours: number | null
  latestWork: string | null; checkpointHygiene: 'ok' | 'stale' | 'missing'
  hygieneNote: string | null; checkpointCount?: number | null
  lastCheckpointReason?: string | null; handoffCommand?: string | null
}
interface NextAction { action: string; rationale: string; blockers: string[] }
interface BootstrapPlanStep {
  id: string
  stage: 'repo-local' | 'machine-level'
  componentId: string
  sourceGap: string
  title: string
  rationale: string
  risk: 'low' | 'medium' | 'high'
  requiresApproval: boolean
  instructions: string | null
  installCommands: { npm?: string | null; brew?: string | null; winget?: string | null } | null
  previewContent: string | null
  templateId: string
}
type StepStatus = 'pending' | 'confirming' | 'applying' | 'done' | 'failed' | 'instructions' | 'verifying'
interface BootstrapPlanStage {
  id: 'repo-local' | 'machine-level'
  title: string
  stepCount: number
}
interface BootstrapPlan {
  status: 'ready' | 'needs-bootstrap' | 'blocked'
  stages: BootstrapPlanStage[]
  steps: BootstrapPlanStep[]
  summary: {
    totalSteps: number
    repoLocalSteps: number
    machineLevelSteps: number
    hasBlockers: boolean
  }
  driftCount?: number
}
interface BootstrapAuditEntry {
  id: number; componentId: string; action: string; stage: string
  path: string | null; templateId: string | null; appliedAt: string
  sourceGap: string | null; currentStatus: string; drift: boolean
}
interface BootstrapAudit { entries: BootstrapAuditEntry[]; driftCount: number }
interface StackComponent {
  id: string; label: string; kind: 'repo-doc' | 'machine-tool' | 'repo-dir'
  status: 'present' | 'missing'; note: string | null; required: boolean
}
interface ReadinessReport {
  overallReadiness: 'ready' | 'partial' | 'missing'
  components: StackComponent[]; gaps: string[]
}
interface PreflightResult {
  ok: boolean;
  componentId: string;
  wouldCreate: string | null;
  conflict: boolean;
  conflictDetail: string | null;
  parentWritable: boolean;
  safe: boolean;
}
interface OpenLoopItem {
  key: string | null; title?: string; status?: string
  owner?: string | null; scope?: string | null; decision?: string
}
interface OpenLoopsSummary {
  unresolvedCount: number; pendingMilestoneCount: number
  blockedCount: number; deferredCount: number
}
interface OpenLoops {
  nextMilestone: OpenLoopItem | null; blockedMilestones: OpenLoopItem[]
  unresolvedRequirements: OpenLoopItem[]; deferredItems: OpenLoopItem[]
  revisableDecisions: OpenLoopItem[]; summary: OpenLoopsSummary
}
interface HealthBreakdownItem {
  signal: string; label: string; contribution: number; maxContribution: number
  status: 'ok' | 'warn' | 'danger' | 'missing'; note: string
}
interface RepoHealth { score: number; grade: 'A' | 'B' | 'C' | 'D'; breakdown: HealthBreakdownItem[] }
interface RepairItem {
  priority: number; severity: 'critical' | 'high' | 'medium' | 'low'
  action: string; rationale: string; targetPanel: string
}
interface ProjectPlan {
  project: Project; milestones: Milestone[]; slices: unknown[]; tasks: unknown[]
  requirements: Requirement[]; decisions: Decision[]; importRuns: ImportRun[]
  latestImportRun: ImportRun | null
  latestImportRunsByArtifact: { milestones: ImportRun | null; requirements: ImportRun | null; decisions: ImportRun | null }
  workflowState: WorkflowState; continuity: ContinuityState
  nextAction: NextAction; bootstrapPlan: BootstrapPlan; readiness: ReadinessReport; openLoops: OpenLoops
  proofSummary: { proven: number; claimed: number; total: number } | null
  repoHealth: RepoHealth | null
  repairQueue: RepairItem[]
  platform: string
}
interface PortfolioEntry {
  project: Project; workflowPhase: string; workflowConfidence: number
  continuityStatus: 'fresh' | 'stale' | 'missing'; continuityAgeHours: number | null
  checkpointHygiene: 'ok' | 'stale' | 'missing'; overallReadiness: 'ready' | 'partial' | 'missing'
  readinessGaps: string[]; unresolvedCount: number; pendingMilestoneCount: number
  blockedCount: number; nextActionLabel: string; urgencyScore: number
  healthScore: number; healthGrade: 'A' | 'B' | 'C' | 'D'
  proofCoverage: { proven: number; total: number } | null
  importAgeDays: number | null
}

const API_BASE_URL = 'http://localhost:3001'
const DEFAULT_SCAN_ROOT = 'C:/Users/lweis/Documents'
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
const USER_GUIDE_URL = 'https://github.com/lweiss01/command-center/blob/main/docs/USER-GUIDE.md'

// ── Color helpers ──────────────────────────────────────────────────────────────
const C = {
  ok:     '#4BBFC9',   // retro-teal-lt
  warn:   '#FAA968',   // retro-peach
  danger: '#F85525',   // retro-orange
  info:   '#C8A96A',   // retro-cream-md (for pills + small UI text)
  accent: '#028391',   // retro-teal
  muted:  'var(--text-muted)',
}
function phaseColor(p: string) {
  return p === 'active' ? C.ok : p === 'stalled' ? C.warn : p === 'blocked' ? C.danger : p === 'import-only' ? C.info : C.muted
}
function contColor(s: string)  { return s === 'fresh' ? C.ok : s === 'stale' ? C.warn : C.muted }
function hygColor(s: string)   { return s === 'ok' ? C.ok : s === 'stale' ? C.warn : C.muted }
function readyColor(s: string) { return s === 'ready' ? C.ok : s === 'partial' ? C.warn : C.muted }
function bootstrapColor(s: string) { return s === 'ready' ? C.ok : s === 'blocked' ? C.danger : C.warn }
function healthGradeColor(g: string) { return g === 'A' ? C.ok : g === 'B' ? C.info : g === 'C' ? C.warn : C.danger }
function msColor(s: string)    { return s === 'done' ? C.ok : s === 'active' ? C.warn : s === 'blocked' ? C.danger : s === 'draft' ? C.muted : C.info }
function rqColor(s: string)    { return s === 'validated' ? C.ok : (s === 'deferred' || s === 'out-of-scope') ? C.warn : C.info }
function runColor(s: string)   { return s === 'success' ? C.ok : s === 'partial' ? C.warn : s === 'failed' ? C.danger : C.muted }
function planColor(s: Project['planningStatus']) { void s; return C.muted }
void planColor

// ── Sub-components ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  mono: { fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' },
}

function Pill({ label, color, dim }: { label: string; color: string; dim?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: '11px', fontFamily: 'var(--font-mono)',
      color: dim ? 'var(--text-muted)' : color,
      background: dim ? 'transparent' : `color-mix(in srgb, ${color} 10%, transparent)`,
      border: `1px solid ${dim ? 'var(--border)' : `color-mix(in srgb, ${color} 22%, transparent)`}`,
      borderRadius: '4px', padding: '2px 7px', whiteSpace: 'nowrap', lineHeight: 1.5,
    }}>
      {label}
    </span>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', ...S.mono }}>
      <span style={{ color: 'var(--text-muted)', minWidth: '140px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}

function Note({ variant, label, children }: { variant: 'ok' | 'warn' | 'danger' | 'info'; label?: string; children: React.ReactNode }) {
  const col = variant === 'ok' ? C.ok : variant === 'warn' ? C.warn : variant === 'danger' ? C.danger : C.info
  return (
    <div style={{ marginTop: '10px', padding: '10px 14px', background: `color-mix(in srgb, ${col} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${col} 20%, transparent)`, borderRadius: '6px' }}>
      {label && <div style={{ fontSize: '10px', ...S.mono, color: col, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>{label}</div>}
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '44px' }}>
      <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '22px', height: '2px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '8px' }} />
        <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-title)', margin: 0, letterSpacing: '0.01em' }}>{title}</h3>
        {sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0', ...S.mono }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>{children}</div>
}

function Empty({ text }: { text: string }) {
  return <p style={{ fontSize: '12px', color: 'var(--text-muted)', ...S.mono, padding: '8px 0' }}>{text}</p>
}

function ImportBtn({ onClick, loading, disabled, children }: { onClick: () => void; loading: boolean; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)' }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Importing…' : children}
    </button>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null)
  const [projectPlanLoading, setProjectPlanLoading] = useState(false)
  const [projectPlanError, setProjectPlanError] = useState<string | null>(null)
  const [bootstrapAudit, setBootstrapAudit] = useState<BootstrapAudit | null>(null)
  const [auditHistoryOpen, setAuditHistoryOpen] = useState(false)
  const [proofLinks, setProofLinks] = useState<Array<{reqKey:string;proofText:string;sourceTitle:string;appliedAt:string}>>([])
  const [proofReqOpen, setProofReqOpen] = useState(false)
  const [importSummariesInFlight, setImportSummariesInFlight] = useState(false)
  const [importAllInFlight, setImportAllInFlight] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [scanInFlight, setScanInFlight] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [addProjectPath, setAddProjectPath] = useState('')
  const [addProjectError, setAddProjectError] = useState<string | null>(null)
  const [addProjectInFlight, setAddProjectInFlight] = useState(false)
  const [milestonesImportInFlight, setMilestonesImportInFlight] = useState(false)
  const [requirementsImportInFlight, setRequirementsImportInFlight] = useState(false)
  const [decisionsImportInFlight, setDecisionsImportInFlight] = useState(false)
  const [portfolioData, setPortfolioData] = useState<Map<number, PortfolioEntry>>(new Map())
  const [projectSortMode, setProjectSortMode] = useState<'urgency' | 'name'>('urgency')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const [bootstrapStepStatus, setBootstrapStepStatus] = useState<Map<string, StepStatus>>(new Map())
  const [bootstrapStepError, setBootstrapStepError] = useState<Map<string, string>>(new Map())
  const [bootstrapPreflightResult, setBootstrapPreflightResult] = useState<Map<string, PreflightResult | null>>(new Map())
  const [lastApplyUndo, setLastApplyUndo] = useState<string | null>(null)
  const [bootstrapTemplateId, setBootstrapTemplateId] = useState<'minimal' | 'starter'>('minimal')
  const [activeInstallTab, setActiveInstallTab] = useState<Map<string, 'npm' | 'brew' | 'winget'>>(new Map())
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null)

  // Clear bootstrap step state when the selected project changes
  useEffect(() => {
    setBootstrapStepStatus(new Map())
    setBootstrapStepError(new Map())
    setBootstrapPreflightResult(new Map())
    setLastApplyUndo(null)
    setActiveInstallTab(new Map())
    setCopiedStepId(null)
    setBootstrapAudit(null)
    setAuditHistoryOpen(false)
    setProofLinks([])
    setProofReqOpen(false)
  }, [selectedProject?.id])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const check = () => {
      fetch(`${API_BASE_URL}/api/projects`)
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then((d: Project[]) => {
          setBackendStatus('online')
          setProjects(d)
          setProjectsError(null)
          setProjectsLoading(false)
          timer = setTimeout(check, 30_000)
        })
        .catch(() => {
          setBackendStatus('offline')
          setProjectsLoading(false)
          timer = setTimeout(check, 5_000)
        })
    }
    check()
    return () => clearTimeout(timer)
  }, [])

  const loadProjectPlan = async (id: number, templateId = 'minimal') => {
    setProjectPlanLoading(true)
    setProjectPlanError(null)
    const planUrl = `${API_BASE_URL}/api/projects/${id}/plan?templateId=${templateId}`

    try {
      const [planRes, auditRes, proofRes] = await Promise.all([
        fetch(planUrl),
        fetch(`${API_BASE_URL}/api/projects/${id}/bootstrap/audit`).catch(() => null),
        fetch(`${API_BASE_URL}/api/projects/${id}/proof`).catch(() => null),
      ])

      if (!planRes.ok) {
        // Server responded — bridge is up. Only show a project-level error.
        setProjectPlan(null)
        setProjectPlanError(`Project data unavailable (server ${planRes.status}) from ${planUrl}.`)
        return
      }

      try {
        setProjectPlan(await planRes.json())
      } catch {
        // Server responded with unparseable body — still up, project-level error only.
        setProjectPlan(null)
        setProjectPlanError(`Project data unavailable (invalid response) from ${planUrl}.`)
      }

      if (auditRes?.ok) {
        try { setBootstrapAudit(await auditRes.json()) } catch { /* non-fatal */ }
      }
      if (proofRes?.ok) {
        try { const d = await proofRes.json(); setProofLinks(d.entries ?? []) } catch { /* non-fatal */ }
      }
    } catch (error) {
      // fetch() threw — server is genuinely unreachable.
      setBackendStatus('offline')
      const errorType = error instanceof TypeError ? 'network' : 'unexpected'
      setProjectPlan(null)
      setProjectPlanError(`Project data unavailable (${errorType} error) from ${planUrl}.`)
    } finally {
      setProjectPlanLoading(false)
    }
  }

  useEffect(() => {
    if (projects.length === 0) return
    fetch(`${API_BASE_URL}/api/portfolio`)
      .then(r => r.json()).then((d: PortfolioEntry[]) => {
        const m = new Map<number, PortfolioEntry>()
        d.forEach(e => m.set(e.project.id, e))
        setPortfolioData(m)
      }).catch(() => {})
  }, [projects])

  useEffect(() => {
    if (!selectedProject) { setTasks([]); setProjectPlan(null); return }
    fetch(`${API_BASE_URL}/api/tasks/${selectedProject.name.toLowerCase()}`)
      .then(r => r.json()).then(setTasks).catch(() => setTasks([]))
    loadProjectPlan(selectedProject.id, bootstrapTemplateId)
  }, [selectedProject])

  // Re-fetch plan when template changes (to get updated previewContent)
  useEffect(() => {
    if (selectedProject) {
      setBootstrapStepStatus(new Map())
      setBootstrapStepError(new Map())
      loadProjectPlan(selectedProject.id, bootstrapTemplateId)
    }
  }, [bootstrapTemplateId])

  const importArtifact = async (
    url: string,
    setInFlight: (v: boolean) => void
  ) => {
    if (!selectedProject) return
    setInFlight(true); setProjectPlanError(null)
    try {
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Import failed')
      await loadProjectPlan(selectedProject.id, bootstrapTemplateId)
    } catch (e) {
      setProjectPlanError(e instanceof Error ? e.message : 'Import failed.')
    } finally { setInFlight(false) }
  }

  const handleImportMilestones    = () => importArtifact(`${API_BASE_URL}/api/projects/${selectedProject!.id}/import-gsd-project`, setMilestonesImportInFlight)
  const handleImportRequirements  = () => importArtifact(`${API_BASE_URL}/api/projects/${selectedProject!.id}/import-gsd-requirements`, setRequirementsImportInFlight)
  const handleImportDecisions     = () => importArtifact(`${API_BASE_URL}/api/projects/${selectedProject!.id}/import-gsd-decisions`, setDecisionsImportInFlight)

  const setStepStatus = (stepId: string, status: StepStatus) =>
    setBootstrapStepStatus(prev => new Map(prev).set(stepId, status))
  const setStepError = (stepId: string, err: string) =>
    setBootstrapStepError(prev => new Map(prev).set(stepId, err))

  const handleBootstrapApplyClick = async (step: BootstrapPlanStep) => {
    if (!selectedProject) return
    setStepStatus(step.id, 'applying')
    setBootstrapStepError(prev => { const m = new Map(prev); m.delete(step.id); return m })
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/bootstrap/preflight?componentId=${step.componentId}`)
      const data = await res.json()
      if (res.ok && data.ok) {
        setBootstrapPreflightResult(prev => new Map(prev).set(step.id, data))
        setStepStatus(step.id, 'confirming')
      } else {
        setStepStatus(step.id, 'failed')
        setStepError(step.id, data.error ?? 'Preflight check failed')
      }
    } catch (e) {
      setStepStatus(step.id, 'failed')
      setStepError(step.id, e instanceof Error ? e.message : 'Network error during preflight')
    }
  }

  const handleBootstrapConfirm = async (step: BootstrapPlanStep) => {
    if (!selectedProject) return
    const preflight = bootstrapPreflightResult.get(step.id)
    setStepStatus(step.id, 'applying')
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/bootstrap/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentId: step.componentId, templateId: bootstrapTemplateId }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        // Show undo hint if we have a path
        if (preflight?.wouldCreate) {
          const path = preflight.wouldCreate
          setLastApplyUndo(`To undo: delete ${path}`)
        }
        // Clear all step state before re-fetching so stale IDs don't bleed into the new plan
        setBootstrapStepStatus(new Map())
        setBootstrapStepError(new Map())
        setBootstrapPreflightResult(new Map())
        await loadProjectPlan(selectedProject.id, bootstrapTemplateId)
      } else {
        setStepStatus(step.id, 'failed')
        setStepError(step.id, data.error ?? 'Apply failed')
      }
    } catch (e) {
      setStepStatus(step.id, 'failed')
      setStepError(step.id, e instanceof Error ? e.message : 'Network error')
    }
  }

  const handleVerifyTool = async (step: BootstrapPlanStep) => {
    if (!selectedProject) return
    setStepStatus(step.id, 'verifying')
    setBootstrapStepError(prev => { const m = new Map(prev); m.delete(step.id); return m })
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/bootstrap/verify-tool?componentId=${encodeURIComponent(step.componentId)}`)
      const data: { ok: boolean; status?: string; error?: string } = await res.json()
      if (data.ok && data.status === 'present') {
        setStepStatus(step.id, 'done')
      } else {
        setStepStatus(step.id, 'instructions')
        setStepError(step.id, 'Tool not detected yet — try running the install command, then verify again.')
      }
    } catch (e) {
      setStepStatus(step.id, 'instructions')
      setStepError(step.id, e instanceof Error ? e.message : 'Network error during verify')
    }
  }

  const handleImportSummaries = async () => {
    if (!selectedProject) return
    setImportSummariesInFlight(true)
    try {
      await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/import/summaries`, { method: 'POST' })
      await loadProjectPlan(selectedProject.id, bootstrapTemplateId)
    } catch { /* non-fatal */ }
    finally { setImportSummariesInFlight(false) }
  }

  const handleImportAll = async () => {
    if (!selectedProject) return
    setImportAllInFlight(true)
    try {
      await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/import-all`, { method: 'POST' })
      await loadProjectPlan(selectedProject.id, bootstrapTemplateId)
    } catch { /* non-fatal */ }
    finally { setImportAllInFlight(false) }
  }

  const handleTagChange = async (tag: 'active' | 'minimal' | 'archive') => {
    if (!selectedProject) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      })
      const data = await res.json()
      if (res.ok && data.ok && data.project) {
        const listRes = await fetch(`${API_BASE_URL}/api/projects`)
        if (listRes.ok) { const d: Project[] = await listRes.json(); setProjects(d) }
        setSelectedProject(data.project)
        await loadProjectPlan(data.project.id, bootstrapTemplateId)
      }
    } catch { /* non-fatal */ }
  }

  const handleScanWorkspace = async () => {
    setScanInFlight(true); setProjectsError(null)
    try {
      await fetch(`${API_BASE_URL}/api/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roots: [DEFAULT_SCAN_ROOT] }) })
      const res = await fetch(`${API_BASE_URL}/api/projects`)
      if (res.ok) { const d: Project[] = await res.json(); setProjects(d) }
    } catch { setProjectsError('Scan failed.') }
    finally { setScanInFlight(false) }
  }

  const handleAddProject = async () => {
    if (!addProjectPath.trim()) return
    setAddProjectInFlight(true); setAddProjectError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: addProjectPath.trim() }),
      })
      const data: { ok: boolean; project?: Project; error?: string } = await res.json()
      if (res.ok && data.ok && data.project) {
        const listRes = await fetch(`${API_BASE_URL}/api/projects`)
        if (listRes.ok) { const d: Project[] = await listRes.json(); setProjects(d) }
        setSelectedProject(data.project)
        setShowAddProject(false); setAddProjectPath(''); setAddProjectError(null)
      } else {
        setAddProjectError(data.error ?? 'Add failed')
      }
    } catch (e) {
      setAddProjectError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setAddProjectInFlight(false)
    }
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault(); if (!newTask.trim()) return
    console.log(`Adding "${newTask}" to ${selectedProject?.name}`); setNewTask('')
  }

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let r = q ? projects.filter(p => [p.name, p.rootPath, p.projectType, p.framework ?? '', p.planningStatus].join(' ').toLowerCase().includes(q)) : projects
    return [...r].sort((a, b) => {
      if (projectSortMode === 'urgency') return (portfolioData.get(b.id)?.urgencyScore ?? -1) - (portfolioData.get(a.id)?.urgencyScore ?? -1)
      return a.name.localeCompare(b.name)
    })
  }, [projects, searchQuery, projectSortMode, portfolioData])

  const parseWarnings = (json: string | null) => {
    try { const p = JSON.parse(json ?? '[]'); return Array.isArray(p) ? p.filter((w): w is string => typeof w === 'string') : [] }
    catch { return [] as string[] }
  }

  const planLabel = (s: Project['planningStatus']) => s === 'structured' ? 'Structured' : s === 'partial' ? 'Partial' : 'None'

  const milestoneImportRun    = projectPlan?.latestImportRunsByArtifact.milestones ?? null
  const requirementsImportRun = projectPlan?.latestImportRunsByArtifact.requirements ?? null
  const decisionsImportRun    = projectPlan?.latestImportRunsByArtifact.decisions ?? null
  const latestImportWarnings  = useMemo(() => parseWarnings(projectPlan?.latestImportRun?.warningsJson ?? null), [projectPlan?.latestImportRun?.warningsJson])
  const milestoneWarnings     = parseWarnings(milestoneImportRun?.warningsJson ?? null)
  const requirementWarnings   = parseWarnings(requirementsImportRun?.warningsJson ?? null)
  const decisionWarnings      = parseWarnings(decisionsImportRun?.warningsJson ?? null)

  const importedMilestones   = projectPlan?.milestones ?? []
  const importedRequirements = projectPlan?.requirements ?? []
  const importedDecisions    = projectPlan?.decisions ?? []

  const confidenceDowngraded = (projectPlan?.workflowState.reasons ?? []).some(r => r.toLowerCase().includes('stale'))
  const confidenceSupported  = !confidenceDowngraded && projectPlan?.continuity.status === 'fresh'

  const formatSync = (at: string | null | undefined) => {
    if (!at) return 'never'
    const d = new Date(at); return isNaN(d.getTime()) ? 'unknown' : d.toLocaleString()
  }
  const provenance = (run: ImportRun | null, src: string) => `Synced ${formatSync(run?.completedAt)} · ${src}`

  const blockers         = projectPlan?.nextAction.blockers ?? []
  const hasBlockers      = blockers.length > 0
  const needsOnboarding  = (() => {
    if (!projectPlan) return false
    const hasNoImports = projectPlan.milestones.length === 0 && projectPlan.requirements.length === 0 && projectPlan.decisions.length === 0
    const hasDocs = projectPlan.readiness.components.some(c =>
      (c.id === 'gsd-doc-project' || c.id === 'gsd-doc-requirements' || c.id === 'gsd-doc-decisions') && c.status === 'present'
    )
    return hasNoImports && hasDocs
  })()
  const suggestedCommand = (() => {
    if (!projectPlan?.nextAction) return null
    if (blockers.some(b => /holistic|gsd|tool/i.test(b))) return 'npm run cc:doctor'
    if (/import|continue|review/i.test(projectPlan.nextAction.action)) return 'npm run cc:launch -- -NoBrowser'
    return null
  })()

  const backendUiState: 'checking' | 'online' | 'online-empty' | 'offline' =
    backendStatus === 'offline'
      ? 'offline'
      : backendStatus === 'online' && !projectsLoading && projects.length === 0
        ? 'online-empty'
        : backendStatus

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}>

      {/* ── Left column: project list ──────────────────────────────────────── */}
      <div style={{ width: '280px', flexShrink: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>

        {/* Wordmark */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
              background:
                backendUiState === 'online'
                  ? C.ok
                  : backendUiState === 'online-empty'
                    ? C.warn
                    : backendUiState === 'offline'
                      ? C.danger
                      : 'var(--text-muted)',
              animation: backendUiState === 'checking' || backendUiState === 'offline' ? 'pulse 1.4s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Command Center</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', ...S.mono }}>v{APP_VERSION}</div>
        </div>

        {/* Backend state callouts */}
        {backendUiState === 'offline' && (
          <div style={{ margin: '8px 10px 0', padding: '8px 10px', background: `color-mix(in srgb, ${C.danger} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${C.danger} 20%, transparent)`, borderRadius: '5px', fontSize: '11px', color: C.danger, ...S.mono, lineHeight: 1.5 }}>
            Bridge offline — retrying…
          </div>
        )}
        {backendUiState === 'online-empty' && (
          <div style={{ margin: '8px 10px 0', padding: '8px 10px', background: `color-mix(in srgb, ${C.warn} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${C.warn} 24%, transparent)`, borderRadius: '5px', fontSize: '11px', color: C.warn, ...S.mono, lineHeight: 1.5 }}>
            Bridge connected — no project data indexed yet. Run Scan Workspace.
          </div>
        )}

        {/* Search + sort */}
        <div style={{ padding: '10px 12px 6px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter projects…"
              style={{ width: '100%', background: 'var(--bg-row)', border: '1px solid var(--border)', borderRadius: '5px', padding: '6px 10px 6px 27px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '0 2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {projectsLoading ? 'Loading…' : `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`}
            </span>
            <button onClick={() => setProjectSortMode(p => p === 'urgency' ? 'name' : 'urgency')}
              style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontFamily: 'var(--font)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {projectSortMode === 'urgency' ? 'By urgency' : 'By name'}
            </button>
          </div>
        </div>

        {/* Project rows */}
        {projectsError && backendStatus === 'online' && (
          <div style={{ margin: '0 10px 6px', padding: '8px 10px', background: `color-mix(in srgb, ${C.warn} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${C.warn} 20%, transparent)`, borderRadius: '5px', fontSize: '11px', color: C.warn, ...S.mono, lineHeight: 1.5 }}>
            {projectsError}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {projectsLoading ? (
            <div style={{ padding: '24px 20px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ padding: '24px 20px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              {projects.length === 0 ? 'No projects. Run a scan.' : 'No matches.'}
            </div>
          ) : filteredProjects.map(project => {
            const entry = portfolioData.get(project.id)
            const phase = entry?.workflowPhase ?? 'no-data'
            const isSelected = selectedProject?.id === project.id
            const phaseLabel =
              phase === 'no-data' ? 'No data' :
              phase === 'import-only' ? 'Import-only' :
              phase.charAt(0).toUpperCase() + phase.slice(1)
            const continuityLabel = entry
              ? (entry.continuityStatus === 'fresh' && entry.continuityAgeHours !== null
                ? `Fresh (${Math.round(entry.continuityAgeHours)}h)`
                : entry.continuityStatus === 'stale' ? 'Stale' : entry.continuityStatus === 'missing' ? 'Missing' : 'Fresh')
              : 'Unknown'
            const healthGrade = entry?.healthGrade ?? null
            const proofCoverage = entry?.proofCoverage ?? null

            return (
              <button key={project.id} type="button" onClick={() => setSelectedProject(project)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px',
                  background: isSelected ? 'var(--bg-row-active)' : 'transparent',
                  border: 'none',
                  borderLeft: `2px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', fontFamily: 'var(--font)',
                  transition: 'background 100ms, border-color 100ms',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-row-hover)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                  <div style={{ fontSize: '13px', fontWeight: isSelected ? 500 : 400, color: isSelected ? 'var(--text-title)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </div>
                  {project.repoTag !== 'active' && (
                    <Pill label={project.repoTag} color={project.repoTag === 'minimal' ? C.info : C.muted} dim />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', ...S.mono, overflow: 'hidden' }}>
                  <span style={{ color: 'var(--text-faint)' }}>Phase</span>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: phaseColor(phase), flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: phaseColor(phase) }}>{phaseLabel}</span>
                  <span style={{ color: 'var(--text-faint)' }}>·</span>
                  <span style={{ color: 'var(--text-faint)' }}>Continuity</span>
                  <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{continuityLabel}</span>
                </div>
                {(healthGrade || (proofCoverage && proofCoverage.total > 0)) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', ...S.mono, marginTop: '2px', overflow: 'hidden' }}>
                    {healthGrade && (
                      <>
                        <span style={{ color: 'var(--text-faint)' }}>Health</span>
                        <span style={{ color: healthGradeColor(healthGrade), fontWeight: 600 }}>{healthGrade}</span>
                      </>
                    )}
                    {healthGrade && proofCoverage && proofCoverage.total > 0 && <span style={{ color: 'var(--text-faint)' }}>·</span>}
                    {proofCoverage && proofCoverage.total > 0 && (
                      <>
                        <span style={{ color: 'var(--text-faint)' }}>Proof</span>
                        <span style={{ color: proofCoverage.proven === proofCoverage.total ? C.ok : proofCoverage.proven > 0 ? C.warn : 'var(--text-muted)' }}>
                          {proofCoverage.proven}/{proofCoverage.total}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer actions */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={handleScanWorkspace} disabled={scanInFlight}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <RefreshCw size={12} className={scanInFlight ? 'animate-spin' : ''} />
            {scanInFlight ? 'Scanning…' : 'Scan Workspace'}
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <a href={USER_GUIDE_URL} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <BookOpen size={11} /> Guide
            </a>
            <button
              onClick={() => { setShowAddProject(v => !v); setAddProjectError(null); setAddProjectPath('') }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', border: `1px solid ${showAddProject ? C.info : 'var(--border)'}`, borderRadius: '5px', fontSize: '11px', color: showAddProject ? C.info : 'var(--text-muted)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font)' }}
            >
              <Plus size={11} /> New
            </button>
          </div>
          {/* Inline add-project form */}
          {showAddProject && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <input
                autoFocus
                type="text"
                placeholder="Directory path…"
                value={addProjectPath}
                onChange={e => { setAddProjectPath(e.target.value); setAddProjectError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddProject(); if (e.key === 'Escape') { setShowAddProject(false); setAddProjectPath(''); setAddProjectError(null) } }}
                style={{ padding: '6px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', border: `1px solid ${addProjectError ? C.danger : 'var(--border)'}`, borderRadius: '4px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
              />
              {addProjectError && <div style={{ fontSize: '10px', color: C.danger, ...S.mono, lineHeight: 1.4 }}>{addProjectError}</div>}
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  disabled={addProjectInFlight || !addProjectPath.trim()}
                  onClick={handleAddProject}
                  style={{ flex: 1, padding: '5px', fontSize: '11px', background: addProjectInFlight || !addProjectPath.trim() ? 'var(--bg-elevated)' : C.info, color: addProjectInFlight || !addProjectPath.trim() ? 'var(--text-muted)' : '#000', border: 'none', borderRadius: '4px', cursor: addProjectInFlight || !addProjectPath.trim() ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)' }}
                >
                  {addProjectInFlight ? 'Adding…' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowAddProject(false); setAddProjectPath(''); setAddProjectError(null) }}
                  style={{ padding: '5px 10px', fontSize: '11px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right pane: detail ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {selectedProject ? (
          <div style={{ padding: '44px 52px', maxWidth: '860px' }} id="roadmap-section">

            {/* Project heading */}
            <div style={{ marginBottom: '44px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                    {selectedProject.name}
                  </h1>
                  <select
                    value={selectedProject.repoTag}
                    onChange={(e) => handleTagChange(e.target.value as any)}
                    style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                  >
                    <option value="active">Active</option>
                    <option value="minimal">Minimal</option>
                    <option value="archive">Archive</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '3px', flexShrink: 0, ...S.mono }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: phaseColor(projectPlan?.workflowState.phase ?? 'no-data'), flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', color: phaseColor(projectPlan?.workflowState.phase ?? 'no-data') }}>
                    {projectPlan?.workflowState.phase ?? 'no-data'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', ...S.mono, marginBottom: '14px' }}>{selectedProject.rootPath}</div>
              {projectPlanError && (
                <div style={{ marginBottom: '14px' }}>
                  <Note variant="danger" label="Project data unavailable">
                    {projectPlanError}
                  </Note>
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  ['Plan', planLabel(selectedProject.planningStatus)],
                  ['Sources', String(selectedProject.artifactCount)],
                  ['Stack', selectedProject.framework ?? selectedProject.projectType],
                  ['Repo', selectedProject.hasGit ? 'git' : 'local'],
                ].map(([k, v]) => (
                  <span key={k} style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono }}>
                    {k} <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* First-run onboarding card */}
            {needsOnboarding && (
              <div style={{ marginBottom: '24px', padding: '20px 24px', background: `color-mix(in srgb, ${C.info} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${C.info} 30%, transparent)`, borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-title)', marginBottom: '8px' }}>Planning Docs Detected</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                  This repository contains GSD planning documents, but they haven't been imported yet. Import them now to populate the cockpit.
                </div>
                <button
                  disabled={importAllInFlight}
                  onClick={handleImportAll}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: C.info, color: '#000', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: importAllInFlight ? 'not-allowed' : 'pointer', opacity: importAllInFlight ? 0.7 : 1, fontFamily: 'var(--font-mono)' }}
                >
                  {importAllInFlight ? 'Importing…' : 'Import All'}
                </button>
              </div>
            )}

            {/* Next Action — hero, first */}
            <Section title="Next Action" sub="Interpreted from workflow, readiness, continuity, and blockers">
              <div style={{ marginBottom: '12px' }}>
                <Pill label={hasBlockers ? 'Blocked' : 'Clear'} color={hasBlockers ? C.danger : C.ok} />
              </div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: `3px solid ${hasBlockers ? C.danger : C.accent}`, borderRadius: '8px', padding: '16px 18px', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', ...S.mono, color: hasBlockers ? C.danger : C.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '9px' }}>
                  {hasBlockers ? `${blockers.length} blocker${blockers.length !== 1 ? 's' : ''}` : 'Clear to execute'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '9px' }}>
                  {projectPlan?.nextAction.action ?? 'No recommendation available'}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '620px', margin: 0 }}>
                  {projectPlan?.nextAction.rationale ?? 'Insufficient evidence to recommend a next step.'}
                </p>
              </div>
              {suggestedCommand && (
                <code style={{ display: 'block', fontSize: '12px', ...S.mono, color: C.info, background: 'color-mix(in srgb, var(--info) 8%, transparent)', border: `1px solid color-mix(in srgb, var(--info) 18%, transparent)`, borderRadius: '5px', padding: '8px 12px', marginBottom: '12px' }}>
                  {suggestedCommand}
                </code>
              )}
              {hasBlockers && (
                <Note variant="danger" label={`${blockers.length} blocker${blockers.length !== 1 ? 's' : ''}`}>
                  {blockers.map(b => <div key={b} style={{ ...S.mono, fontSize: '12px', lineHeight: 1.7 }}>{b}</div>)}
                </Note>
              )}
            </Section>

            {/* Workflow State */}
            <Section title="Workflow State" sub="Phase interpreted from imported artifacts and continuity signals">
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <Pill label={projectPlan?.workflowState.phase ?? 'no-data'} color={phaseColor(projectPlan?.workflowState.phase ?? 'no-data')} />
                <Pill label={`${projectPlan?.workflowState.confidence != null ? Math.round(projectPlan.workflowState.confidence * 100) : 0}% confidence`} color={C.muted} dim />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                {(projectPlan?.workflowState.evidence ?? []).map(e => <KV key={e.label} label={e.label} value={e.value} />)}
              </div>
              {(projectPlan?.workflowState.reasons ?? []).length > 0 && (
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '12px' }}>
                  {projectPlan!.workflowState.reasons.map(r => (
                    <div key={r} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, ...S.mono }}>{r}</div>
                  ))}
                </div>
              )}
              {confidenceDowngraded && <Note variant="warn">Confidence reduced — continuity is stale.</Note>}
              {confidenceSupported && <Note variant="ok">Confidence supported by fresh continuity.</Note>}
            </Section>

            {/* Proof */}
            {projectPlan && (
              <Section title="Proof" sub="Claimed vs verified completion">
                {/* Summary + import button */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                  {projectPlan.proofSummary ? (
                    <>
                      <Pill label={`${projectPlan.proofSummary.proven} proven`} color={C.ok} />
                      {projectPlan.proofSummary.claimed > 0 && <Pill label={`${projectPlan.proofSummary.claimed} claimed-only`} color={C.muted} dim />}
                      <Pill label={`${projectPlan.proofSummary.total} total`} color={C.muted} dim />
                    </>
                  ) : (
                    <Pill label="no milestones" color={C.muted} dim />
                  )}
                  <button
                    disabled={importSummariesInFlight}
                    onClick={handleImportSummaries}
                    style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 10px', fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: importSummariesInFlight ? 'not-allowed' : 'pointer', opacity: importSummariesInFlight ? 0.6 : 1 }}
                  >
                    {importSummariesInFlight ? 'Importing…' : 'Import Summaries'}
                  </button>
                </div>

                {/* Per-milestone proof status */}
                {projectPlan.milestones.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    {projectPlan.milestones.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', ...S.mono }}>
                        <span style={{ color: m.proofLevel === 'proven' ? C.ok : 'var(--text-muted)', flexShrink: 0 }}>{m.proofLevel === 'proven' ? '✓' : '○'}</span>
                        <span style={{ color: 'var(--text-secondary)', minWidth: '50px' }}>{m.externalKey}</span>
                        <span style={{ color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                        <Pill label={m.proofLevel} color={m.proofLevel === 'proven' ? C.ok : C.muted} dim={m.proofLevel !== 'proven'} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Requirement proof links (collapsible) */}
                {proofLinks.length > 0 && (
                  <div>
                    <button
                      onClick={() => setProofReqOpen(v => !v)}
                      style={{ fontSize: '11px', ...S.mono, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <span style={{ fontSize: '10px' }}>{proofReqOpen ? '▾' : '▸'}</span>
                      Requirement proof · {proofLinks.length} link{proofLinks.length !== 1 ? 's' : ''}
                    </button>
                    {proofReqOpen && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {proofLinks.map((entry, i) => (
                          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11px', ...S.mono, padding: '5px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                            <Pill label={entry.reqKey} color={C.ok} />
                            <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.proofText}>{entry.proofText}</span>
                            <span style={{ color: 'var(--text-muted)', flexShrink: 0, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.sourceTitle}>{entry.sourceTitle}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {proofLinks.length === 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono }}>No requirement proof links yet — run Import Summaries to populate.</div>
                )}
              </Section>
            )}

            {/* Health */}
            {projectPlan?.repoHealth && (
              <Section title="Health" sub="Overall repo operating health">
                {/* Score header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: healthGradeColor(projectPlan.repoHealth.grade), fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {projectPlan.repoHealth.grade}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {Math.round(projectPlan.repoHealth.score * 100)}% health score
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono }}>
                      {projectPlan.repoHealth.breakdown.filter(b => b.status === 'danger' || b.status === 'missing').length > 0
                        ? `${projectPlan.repoHealth.breakdown.filter(b => b.status === 'danger' || b.status === 'missing').length} signal(s) need attention`
                        : 'All signals healthy'}
                    </div>
                  </div>
                </div>

                {/* Contributor breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {projectPlan.repoHealth.breakdown.map(item => {
                    const statusColor = item.status === 'ok' ? C.ok : item.status === 'warn' ? C.warn : item.status === 'danger' ? C.danger : C.muted
                    const fillPct = item.maxContribution > 0 ? Math.round((item.contribution / item.maxContribution) * 100) : 0
                    return (
                      <div key={item.signal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusColor, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', ...S.mono, minWidth: '130px' }}>{item.label}</span>
                        {/* Progress bar */}
                        <div style={{ flex: 1, height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', minWidth: '40px' }}>
                          <div style={{ height: '100%', width: `${fillPct}%`, background: statusColor, borderRadius: '2px', transition: 'width 300ms' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', ...S.mono, minWidth: '80px', textAlign: 'right' }}>{item.note}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Repair queue */}
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  {!projectPlan.repairQueue || projectPlan.repairQueue.length === 0 ? (
                    <div style={{ fontSize: '11px', color: C.ok, ...S.mono }}>✓ No repairs needed</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '10px', ...S.mono, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Repair queue · {projectPlan.repairQueue.length} item{projectPlan.repairQueue.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {projectPlan.repairQueue.map(item => {
                          const sevColor = item.severity === 'critical' ? C.danger : item.severity === 'high' ? C.warn : item.severity === 'medium' ? C.info : C.muted
                          return (
                            <div key={item.priority} style={{ padding: '7px 10px', background: 'var(--bg-elevated)', border: `1px solid ${item.severity === 'critical' ? C.danger : 'var(--border)'}`, borderRadius: '5px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                                <Pill label={item.severity} color={sevColor} dim={item.severity !== 'critical'} />
                                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{item.action}</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-faint)', ...S.mono, flexShrink: 0 }}>→ {item.targetPanel}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, paddingLeft: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.rationale}>{item.rationale}</div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </Section>
            )}

            {/* Bootstrap Plan */}
            {projectPlan?.bootstrapPlan && (
              <Section title="Bootstrap Plan" sub="Staged repo-first setup plan derived from readiness gaps">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                  <Pill label={projectPlan.bootstrapPlan.status} color={bootstrapColor(projectPlan.bootstrapPlan.status)} />
                  <Pill label={`${projectPlan.bootstrapPlan.summary.totalSteps} step${projectPlan.bootstrapPlan.summary.totalSteps !== 1 ? 's' : ''}`} color={C.muted} dim />
                  <Pill label={`${projectPlan.bootstrapPlan.summary.repoLocalSteps} repo-local`} color={C.info} dim />
                  <Pill label={`${projectPlan.bootstrapPlan.summary.machineLevelSteps} machine-level`} color={C.warn} dim />
                  {(projectPlan.bootstrapPlan.driftCount ?? 0) > 0 && (
                    <Pill label={`${projectPlan.bootstrapPlan.driftCount} drift`} color={C.danger} />
                  )}
                  {/* Template selector */}
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>template:</span>
                    {(['minimal', 'starter'] as const).map(tid => (
                      <button key={tid} onClick={() => setBootstrapTemplateId(tid)} style={{
                        fontSize: '11px', padding: '2px 8px', fontFamily: 'var(--font-mono)',
                        background: bootstrapTemplateId === tid ? C.info : 'transparent',
                        color: bootstrapTemplateId === tid ? '#000' : 'var(--text-muted)',
                        border: `1px solid ${bootstrapTemplateId === tid ? C.info : 'var(--border)'}`,
                        borderRadius: '3px', cursor: 'pointer',
                      }}>{tid}</button>
                    ))}
                  </span>
                </div>

                {lastApplyUndo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono, flex: 1 }}>{lastApplyUndo}</span>
                    <button onClick={() => setLastApplyUndo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>×</button>
                  </div>
                )}

                {projectPlan.bootstrapPlan.steps.length === 0 ? (
                  <Note variant="ok">No bootstrap actions required for this repo.</Note>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      const repoLocalSteps = projectPlan.bootstrapPlan.steps.filter(s => s.stage === 'repo-local')
                      const repoLocalAllDone = repoLocalSteps.length > 0 && repoLocalSteps.every(s => (bootstrapStepStatus.get(s.id) ?? 'pending') === 'done')
                      const stageGateActive = repoLocalSteps.length > 0 && !repoLocalAllDone
                      return projectPlan.bootstrapPlan.stages.map(stage => {
                      const stageSteps = projectPlan.bootstrapPlan.steps.filter(step => step.stage === stage.id)
                      if (stageSteps.length === 0) return null
                      return (
                        <div key={stage.id} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px', background: 'var(--bg-elevated)' }}>
                          <div style={{ fontSize: '10px', ...S.mono, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {stage.title} · {stage.stepCount} step{stage.stepCount !== 1 ? 's' : ''}
                          </div>
                          {/* Stage gate banner: shown on machine-level card when repo-local steps are pending */}
                          {stage.id === 'machine-level' && stageGateActive && (
                            <div style={{ marginBottom: '10px', padding: '6px 10px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)', ...S.mono }}>
                              ⚠ Complete repo-local steps above before running machine-level setup.
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stageSteps.map(step => {
                              const status = bootstrapStepStatus.get(step.id) ?? 'pending'
                              const errMsg = bootstrapStepError.get(step.id)
                              const isMachine = step.stage === 'machine-level'
                              const accentColor = isMachine ? C.warn : C.info
                              const isDone = status === 'done'
                              const isGated = isMachine && stageGateActive
                              const hasDrift = bootstrapAudit?.entries.some(e => e.componentId === step.componentId && e.drift) ?? false

                              // Determine which install command variants are available
                              const cmds = step.installCommands ?? null
                              const availableTabs = cmds ? (Object.entries(cmds).filter(([, v]) => v != null).map(([k]) => k) as Array<'npm' | 'brew' | 'winget'>) : []
                              const platform = projectPlan.platform
                              const platformDefault: 'npm' | 'brew' | 'winget' =
                                platform === 'win32' ? (cmds?.winget ? 'winget' : 'npm') :
                                platform === 'darwin' ? (cmds?.brew ? 'brew' : 'npm') : 'npm'
                              const activeTab = (availableTabs.includes(activeInstallTab.get(step.id) as 'npm' | 'brew' | 'winget') ? activeInstallTab.get(step.id) : platformDefault) as 'npm' | 'brew' | 'winget'
                              const activeCmd = cmds ? (cmds[activeTab] ?? step.instructions ?? '') : (step.instructions ?? '')

                              return (
                                <div key={step.id} style={{ borderLeft: `2px solid ${isDone ? C.ok : hasDrift ? C.danger : accentColor}`, paddingLeft: '10px' }}>
                                  {/* Step header */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                    {isDone && <span style={{ color: C.ok, fontSize: '13px' }}>✓</span>}
                                    <span style={{ fontSize: '12px', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none' }}>{step.title}</span>
                                    <Pill label={step.risk} color={step.risk === 'high' ? C.danger : step.risk === 'medium' ? C.warn : C.ok} dim />
                                    {hasDrift && <Pill label="drift" color={C.danger} />}
                                    {step.requiresApproval && status === 'pending' && <Pill label="approval required" color={C.danger} dim />}
                                    {status === 'applying' && <Pill label="applying…" color={C.warn} />}
                                    {status === 'verifying' && <Pill label="verifying…" color={C.warn} />}
                                    {status === 'done' && <Pill label="done" color={C.ok} />}
                                    {status === 'failed' && <Pill label="failed" color={C.danger} />}
                                  </div>
                                  {hasDrift && (
                                    <div style={{ fontSize: '11px', color: C.danger, ...S.mono, marginBottom: '4px' }}>⚠ Previously applied — now missing again.</div>
                                  )}

                                  {/* Rationale + source */}
                                  {!isDone && (
                                    <>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.rationale}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono, marginTop: '4px' }}>source gap: {step.sourceGap}</div>
                                    </>
                                  )}

                                  {/* Error message (instructions-state inline error) */}
                                  {(status === 'failed' || status === 'instructions') && errMsg && (
                                    <div style={{ fontSize: '11px', color: C.danger, ...S.mono, marginTop: '6px' }}>{errMsg}</div>
                                  )}

                                  {/* Action buttons */}
                                  {status === 'pending' && !isMachine && (
                                    <button
                                      onClick={() => handleBootstrapApplyClick(step)}
                                      style={{ marginTop: '8px', fontSize: '11px', padding: '3px 10px', background: C.info, color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                                    >
                                      Apply
                                    </button>
                                  )}
                                  {status === 'pending' && isMachine && (
                                    <button
                                      disabled={isGated}
                                      onClick={() => !isGated && setStepStatus(step.id, 'instructions')}
                                      style={{ marginTop: '8px', fontSize: '11px', padding: '3px 10px', background: 'var(--bg-elevated)', color: isGated ? 'var(--text-muted)' : 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: isGated ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', opacity: isGated ? 0.5 : 1 }}
                                    >
                                      View Instructions
                                    </button>
                                  )}
                                  {status === 'failed' && (
                                    <button
                                      onClick={() => { setStepStatus(step.id, 'pending'); setBootstrapStepError(prev => { const m = new Map(prev); m.delete(step.id); return m }) }}
                                      style={{ marginTop: '8px', fontSize: '11px', padding: '3px 10px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                                    >
                                      Retry
                                    </button>
                                  )}

                                  {/* Confirmation panel (repo-local) */}
                                  {status === 'confirming' && (
                                    <div style={{ marginTop: '10px', padding: '10px 12px', background: 'var(--bg-base)', border: `1px solid ${C.warn}`, borderRadius: '6px' }}>
                                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>Confirm: {step.title}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '6px' }}>{step.rationale}</div>
                                      
                                      {/* Conflict warning */}
                                      {bootstrapPreflightResult.get(step.id)?.conflict && (
                                        <div style={{ marginBottom: '10px', padding: '8px 10px', background: `color-mix(in srgb, ${C.warn} 10%, transparent)`, border: `1px solid ${C.warn}`, borderRadius: '4px' }}>
                                          <div style={{ fontSize: '11px', fontWeight: 600, color: C.warn, marginBottom: '2px' }}>Conflict detected</div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            {bootstrapPreflightResult.get(step.id)?.conflictDetail}. You can still proceed — the existing file will be overwritten.
                                          </div>
                                        </div>
                                      )}

                                      {/* File preview */}
                                      {step.previewContent && step.previewContent.includes('\n') ? (
                                        <div style={{ marginBottom: '10px' }}>
                                          <div style={{ fontSize: '10px', ...S.mono, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                            file preview · template: {step.templateId}
                                          </div>
                                          <pre style={{
                                            fontSize: '11px', ...S.mono, padding: '8px 10px', margin: 0,
                                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                            borderRadius: '4px', color: 'var(--text-secondary)',
                                            maxHeight: '160px', overflowY: 'auto', whiteSpace: 'pre-wrap',
                                            lineHeight: 1.5,
                                          }}>{step.previewContent}</pre>
                                        </div>
                                      ) : step.previewContent ? (
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '8px', ...S.mono }}>
                                          {step.previewContent}
                                        </div>
                                      ) : null}
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', ...S.mono, marginBottom: '10px' }}>
                                        <Pill label={`risk: ${step.risk}`} color={step.risk === 'high' ? C.danger : step.risk === 'medium' ? C.warn : C.ok} dim />
                                        <span>This will create or modify files in your repo.</span>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          onClick={() => handleBootstrapConfirm(step)}
                                          style={{ fontSize: '11px', padding: '3px 12px', background: C.ok, color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => setStepStatus(step.id, 'pending')}
                                          style={{ fontSize: '11px', padding: '3px 10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Instructions panel (machine-level) */}
                                  {(status === 'instructions' || status === 'verifying') && (step.instructions || availableTabs.length > 0) && (
                                    <div style={{ marginTop: '10px', padding: '10px 12px', background: 'var(--bg-base)', border: `1px solid ${C.warn}`, borderRadius: '6px' }}>
                                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>Install instructions</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>Run this command in your terminal to install the required tool. This cannot be applied automatically.</div>

                                      {/* Multi-variant tabs */}
                                      {availableTabs.length > 1 && (
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                          {availableTabs.map(tab => (
                                            <button
                                              key={tab}
                                              onClick={() => setActiveInstallTab(prev => new Map(prev).set(step.id, tab))}
                                              style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-mono)', background: activeTab === tab ? C.warn : 'var(--bg-elevated)', color: activeTab === tab ? '#000' : 'var(--text-muted)', fontWeight: activeTab === tab ? 600 : 400 }}
                                            >
                                              {tab}
                                              {tab === platformDefault && activeTab !== tab && <span style={{ marginLeft: '3px', opacity: 0.6 }}>←</span>}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      {/* Command block + copy */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                        <div style={{ flex: 1, fontSize: '12px', ...S.mono, padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', color: C.ok, userSelect: 'all' }}>
                                          {activeCmd}
                                        </div>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(activeCmd).catch(() => {})
                                            setCopiedStepId(step.id)
                                            setTimeout(() => setCopiedStepId(prev => prev === step.id ? null : prev), 2000)
                                          }}
                                          style={{ fontSize: '10px', padding: '4px 8px', background: 'var(--bg-elevated)', color: copiedStepId === step.id ? C.ok : 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}
                                        >
                                          {copiedStepId === step.id ? 'Copied!' : 'Copy'}
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                          disabled={status === 'verifying'}
                                          onClick={() => handleVerifyTool(step)}
                                          style={{ fontSize: '11px', padding: '3px 10px', background: status === 'verifying' ? 'var(--bg-elevated)' : C.warn, color: status === 'verifying' ? 'var(--text-muted)' : '#000', border: 'none', borderRadius: '4px', cursor: status === 'verifying' ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', opacity: status === 'verifying' ? 0.7 : 1 }}
                                        >
                                          {status === 'verifying' ? 'Verifying…' : 'I installed this — verify'}
                                        </button>
                                        <button
                                          onClick={() => { setStepStatus(step.id, 'pending'); setBootstrapStepError(prev => { const m = new Map(prev); m.delete(step.id); return m }) }}
                                          style={{ fontSize: '11px', padding: '3px 10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                                        >
                                          Dismiss
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  })()}
                  </div>
                )}

                {/* Audit trail */}
                {bootstrapAudit && bootstrapAudit.entries.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <button
                      onClick={() => setAuditHistoryOpen(v => !v)}
                      style={{ fontSize: '11px', ...S.mono, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <span style={{ fontSize: '10px' }}>{auditHistoryOpen ? '▾' : '▸'}</span>
                      Action history · {bootstrapAudit.entries.length} entr{bootstrapAudit.entries.length !== 1 ? 'ies' : 'y'}
                      {bootstrapAudit.driftCount > 0 && <Pill label={`${bootstrapAudit.driftCount} drift`} color={C.danger} dim />}
                    </button>
                    {auditHistoryOpen && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {bootstrapAudit.entries.map(entry => (
                          <div key={entry.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11px', ...S.mono, padding: '5px 8px', background: entry.drift ? `color-mix(in srgb, ${C.danger} 8%, transparent)` : 'var(--bg-elevated)', border: `1px solid ${entry.drift ? C.danger : 'var(--border)'}`, borderRadius: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: '140px' }}>{new Date(entry.appliedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{entry.componentId}</span>
                            <Pill label={entry.action} color={C.muted} dim />
                            <Pill label={entry.stage} color={entry.stage === 'machine-level' ? C.warn : C.info} dim />
                            {entry.drift && <Pill label="drift" color={C.danger} />}
                            {entry.path && <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', whiteSpace: 'nowrap' }} title={entry.path}>{entry.path.split(/[\\/]/).slice(-2).join('/')}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Section>
            )}

            {/* Readiness */}
            {projectPlan?.readiness && (
              <Section title="Readiness" sub="Repo docs, tool probes, and stack presence">
                <div style={{ marginBottom: '12px' }}>
                  <Pill label={projectPlan.readiness.overallReadiness} color={readyColor(projectPlan.readiness.overallReadiness)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {projectPlan.readiness.components.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '10px', fontSize: '12px', ...S.mono }}>
                      <span style={{ color: c.status === 'present' ? C.ok : C.danger, flexShrink: 0 }}>{c.status === 'present' ? '✓' : '✗'}</span>
                      <span style={{ color: 'var(--text-secondary)', minWidth: '180px' }}>{c.label}{c.required && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>(req)</span>}</span>
                      {c.note && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{c.note}</span>}
                    </div>
                  ))}
                </div>
                {projectPlan.readiness.gaps.length > 0 && (
                  <Note variant="danger" label="Gaps">
                    {projectPlan.readiness.gaps.map(g => <div key={g}>{g}</div>)}
                  </Note>
                )}
              </Section>
            )}

            {/* Continuity */}
            <Section title="Continuity" sub="Holistic freshness and checkpoint hygiene">
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <Pill label={`Status: ${projectPlan?.continuity.status ?? 'missing'}`} color={contColor(projectPlan?.continuity.status ?? 'missing')} />
                <Pill label={`Checkpoint: ${projectPlan?.continuity.checkpointHygiene ?? 'missing'}`} color={hygColor(projectPlan?.continuity.checkpointHygiene ?? 'missing')} dim={projectPlan?.continuity.checkpointHygiene === 'ok'} />
              </div>
              {projectPlan?.continuity.freshAt && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono, marginBottom: '8px' }}>
                  {new Date(projectPlan.continuity.freshAt).toLocaleString()}
                  {projectPlan.continuity.ageHours !== null ? ` — ${projectPlan.continuity.ageHours}h ago` : ''}
                </div>
              )}
              {projectPlan?.continuity.latestWork && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 10px' }}>
                  {projectPlan.continuity.latestWork}
                </p>
              )}
              {projectPlan?.continuity.checkpointHygiene === 'ok' ? (
                <Note variant="ok">{projectPlan.continuity.hygieneNote ?? 'Checkpoint hygiene is good.'}</Note>
              ) : (projectPlan?.continuity.checkpointHygiene === 'stale' || projectPlan?.continuity.checkpointHygiene === 'missing') ? (
                <Note variant={projectPlan.continuity.checkpointHygiene === 'missing' ? 'danger' : 'warn'} label={`Hygiene: ${projectPlan.continuity.checkpointHygiene}`}>
                  <div style={{ marginBottom: projectPlan.continuity.handoffCommand ? '8px' : '0' }}>
                    {projectPlan.continuity.hygieneNote ?? 'No checkpoint found. Run a handoff.'}
                  </div>
                  {projectPlan.continuity.handoffCommand && (
                    <code style={{ display: 'block', ...S.mono, fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '7px 10px', borderRadius: '4px', wordBreak: 'break-all' }}>
                      {projectPlan.continuity.handoffCommand}
                    </code>
                  )}
                </Note>
              ) : null}
            </Section>

            {/* Open Loops */}
            {projectPlan?.openLoops && (
              <Section title="Open Loops" sub="Unresolved milestones, requirements, and decisions">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Pill label={`${projectPlan.openLoops.summary.unresolvedCount} unresolved`} color={C.warn} />
                  {projectPlan.openLoops.summary.blockedCount > 0 && <Pill label={`${projectPlan.openLoops.summary.blockedCount} blocked`} color={C.danger} />}
                  {projectPlan.openLoops.summary.deferredCount > 0 && <Pill label={`${projectPlan.openLoops.summary.deferredCount} deferred`} color={C.muted} dim />}
                </div>
                {projectPlan.openLoops.nextMilestone ? (
                  <div style={{ marginBottom: '14px', padding: '12px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', ...S.mono, letterSpacing: '0.1em', marginBottom: '6px' }}>NEXT MILESTONE</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {projectPlan.openLoops.nextMilestone.key && <span style={{ ...S.mono, fontSize: '11px', color: 'var(--text-muted)' }}>{projectPlan.openLoops.nextMilestone.key}</span>}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{projectPlan.openLoops.nextMilestone.title ?? '(untitled)'}</span>
                      {projectPlan.openLoops.nextMilestone.status && <Pill label={projectPlan.openLoops.nextMilestone.status} color={C.info} />}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: C.ok, marginBottom: '14px', ...S.mono }}>All milestones complete</div>
                )}
                {projectPlan.openLoops.unresolvedRequirements.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', ...S.mono, letterSpacing: '0.1em', marginBottom: '8px' }}>UNRESOLVED REQUIREMENTS</div>
                    {projectPlan.openLoops.unresolvedRequirements.slice(0, 5).map((r, i) => (
                      <Row key={r.key ?? i}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {r.key && <span style={{ ...S.mono, fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{r.key}</span>}
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.title ?? '(untitled)'}</span>
                        </div>
                      </Row>
                    ))}
                    {projectPlan.openLoops.unresolvedRequirements.length > 5 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono, padding: '6px 0' }}>+{projectPlan.openLoops.unresolvedRequirements.length - 5} more</div>
                    )}
                  </div>
                )}
              </Section>
            )}

            {/* Milestones */}
            <Section title="Milestones" sub={provenance(milestoneImportRun, '.gsd/PROJECT.md')}>
              {projectPlanLoading ? <Empty text="Loading…" /> : importedMilestones.length > 0 ? (
                importedMilestones.map(m => (
                  <Row key={m.id}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        {m.externalKey && <div style={{ ...S.mono, fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>{m.externalKey}</div>}
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: m.description ? '4px' : '0' }}>{m.title}</div>
                        {m.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.description}</div>}
                      </div>
                      <Pill label={m.status} color={msColor(m.status)} />
                    </div>
                  </Row>
                ))
              ) : <Empty text="No milestones imported yet." />}
            </Section>

            {/* Requirements */}
            <Section title="Requirements" sub={provenance(requirementsImportRun, '.gsd/REQUIREMENTS.md')}>
              {importedRequirements.length > 0 ? importedRequirements.map(r => (
                <Row key={r.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: r.description ? '6px' : '0' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {r.externalKey && <span style={{ ...S.mono, fontSize: '10px', color: C.info }}>{r.externalKey}</span>}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.title}</span>
                      {r.mayBeProven && (
                        <span title={`Owning slice (${r.primaryOwner}) has a SUMMARY on disk — this requirement may already be proven. Update REQUIREMENTS.md to mark it validated.`}
                          style={{ fontSize: '10px', ...S.mono, color: C.warn, background: `color-mix(in srgb, ${C.warn} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${C.warn} 25%, transparent)`, borderRadius: '4px', padding: '1px 6px', cursor: 'default' }}>
                          ⚠ slice done
                        </span>
                      )}
                    </div>
                    <Pill label={r.status} color={rqColor(r.status)} />
                  </div>
                  {r.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.description}</div>}
                </Row>
              )) : <Empty text="No requirements imported yet." />}
            </Section>

            {/* Decisions */}
            <Section title="Decisions" sub={provenance(decisionsImportRun, '.gsd/DECISIONS.md')}>
              {importedDecisions.length > 0 ? importedDecisions.map(d => (
                <Row key={d.id}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                    {d.externalKey && <span style={{ ...S.mono, fontSize: '10px', color: 'var(--text-muted)' }}>{d.externalKey}</span>}
                    {d.scope && <span style={{ ...S.mono, fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '3px' }}>{d.scope}</span>}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{d.decision}</span>
                  </div>
                  {d.choice && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2px' }}>→ {d.choice}</div>}
                  {d.rationale && <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{d.rationale}</div>}
                </Row>
              )) : <Empty text="No decisions imported yet." />}
            </Section>

            {/* Import — operator action, secondary */}
            <Section title="Import" sub="Re-sync planning artifacts from repo docs">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <ImportBtn onClick={handleImportMilestones} loading={milestonesImportInFlight} disabled={projectPlanLoading}>Milestones</ImportBtn>
                <ImportBtn onClick={handleImportRequirements} loading={requirementsImportInFlight} disabled={projectPlanLoading}>Requirements</ImportBtn>
                <ImportBtn onClick={handleImportDecisions} loading={decisionsImportInFlight} disabled={projectPlanLoading}>Decisions</ImportBtn>
              </div>
              {projectPlan?.latestImportRun && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', ...S.mono }}>
                  Last: <span style={{ color: runColor(projectPlan.latestImportRun.status) }}>{projectPlan.latestImportRun.status}</span>
                  {latestImportWarnings.length > 0 && <span style={{ color: C.warn, marginLeft: '14px' }}>{latestImportWarnings.length} warning{latestImportWarnings.length !== 1 ? 's' : ''}</span>}
                </div>
              )}
              {latestImportWarnings.length > 0 && (
                <Note variant="warn">
                  {latestImportWarnings.map((w, i) => <div key={i}>{w}</div>)}
                </Note>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
                {[
                  { label: 'Milestones', run: milestoneImportRun, warn: milestoneWarnings },
                  { label: 'Requirements', run: requirementsImportRun, warn: requirementWarnings },
                  { label: 'Decisions', run: decisionsImportRun, warn: decisionWarnings },
                ].map(({ label, run, warn }) => (
                  <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', ...S.mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                      <Pill label={run?.status ?? 'none'} color={runColor(run?.status ?? '')} dim={!run} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', ...S.mono }}>{warn.length > 0 ? `${warn.length} warning${warn.length !== 1 ? 's' : ''}` : run?.summary ?? 'No import yet.'}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Tasks */}
            <Section title="Tasks" sub="Legacy SQLite tasks">
              <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Log task…"
                  style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '5px', padding: '7px 12px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)', boxSizing: 'border-box' }} />
                <button type="submit" style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '5px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  <Send size={13} />
                </button>
              </form>
              {tasks.length > 0 ? tasks.map(t => (
                <Row key={t.id}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {t.status === 'Done' ? <CheckCircle2 size={14} style={{ color: C.ok, flexShrink: 0 }} /> : <Circle size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    <span style={{ flex: 1, fontSize: '13px', color: t.status === 'Done' ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: t.status === 'Done' ? 'line-through' : 'none' }}>{t.title}</span>
                    <Pill label={t.status} color={t.status === 'Done' ? C.ok : t.status === 'In-Progress' ? C.warn : C.info} />
                  </div>
                </Row>
              )) : <Empty text="No tasks. Canonical milestones are the primary planning surface." />}
            </Section>

            <div style={{ height: '80px' }} />
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', maxWidth: '520px', padding: '0 24px', pointerEvents: 'none' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '6px' }}>Select a project</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Choose from the list to open its command view</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
