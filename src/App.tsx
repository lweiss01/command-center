import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, CheckCircle2, Circle, Send, RefreshCw, BookOpen } from 'lucide-react'

interface Task { id: number; title: string; category: string; status: string }
interface Project {
  id: number; name: string; slug: string; rootPath: string; repoType: string
  projectType: string; primaryLanguage: string | null; framework: string | null
  packageManager: string | null; hasGit: boolean
  planningStatus: 'none' | 'partial' | 'structured'
  artifactCount: number; lastScannedAt: string | null; createdAt: string; updatedAt: string
}
interface Milestone {
  id: number; projectId: number; externalKey: string | null; title: string
  description: string | null; status: 'planned' | 'active' | 'blocked' | 'done' | 'draft'
  origin: string; confidence: number; needsReview: boolean; sortOrder: number
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
}
interface ContinuityState {
  status: 'fresh' | 'stale' | 'missing'; freshAt: string | null; ageHours: number | null
  latestWork: string | null; checkpointHygiene: 'ok' | 'stale' | 'missing'
  hygieneNote: string | null; checkpointCount?: number | null
  lastCheckpointReason?: string | null; handoffCommand?: string | null
}
interface NextAction { action: string; rationale: string; blockers: string[] }
interface StackComponent {
  id: string; label: string; kind: 'repo-doc' | 'machine-tool' | 'repo-dir'
  status: 'present' | 'missing'; note: string | null; required: boolean
}
interface ReadinessReport {
  overallReadiness: 'ready' | 'partial' | 'missing'
  components: StackComponent[]; gaps: string[]
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
interface ProjectPlan {
  project: Project; milestones: Milestone[]; slices: unknown[]; tasks: unknown[]
  requirements: Requirement[]; decisions: Decision[]; importRuns: ImportRun[]
  latestImportRun: ImportRun | null
  latestImportRunsByArtifact: { milestones: ImportRun | null; requirements: ImportRun | null; decisions: ImportRun | null }
  workflowState: WorkflowState; continuity: ContinuityState
  nextAction: NextAction; readiness: ReadinessReport; openLoops: OpenLoops
}
interface PortfolioEntry {
  project: Project; workflowPhase: string; workflowConfidence: number
  continuityStatus: 'fresh' | 'stale' | 'missing'; continuityAgeHours: number | null
  checkpointHygiene: 'ok' | 'stale' | 'missing'; overallReadiness: 'ready' | 'partial' | 'missing'
  readinessGaps: string[]; unresolvedCount: number; pendingMilestoneCount: number
  blockedCount: number; nextActionLabel: string; urgencyScore: number
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
  const [newTask, setNewTask] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [scanInFlight, setScanInFlight] = useState(false)
  const [milestonesImportInFlight, setMilestonesImportInFlight] = useState(false)
  const [requirementsImportInFlight, setRequirementsImportInFlight] = useState(false)
  const [decisionsImportInFlight, setDecisionsImportInFlight] = useState(false)
  const [portfolioData, setPortfolioData] = useState<Map<number, PortfolioEntry>>(new Map())
  const [projectSortMode, setProjectSortMode] = useState<'urgency' | 'name'>('urgency')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

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

  const loadProjectPlan = async (id: number) => {
    setProjectPlanLoading(true); setProjectPlanError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}/plan`)
      if (!res.ok) throw new Error()
      setProjectPlan(await res.json())
    } catch { setProjectPlan(null); setProjectPlanError('Unable to load project plan.') }
    finally { setProjectPlanLoading(false) }
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
    loadProjectPlan(selectedProject.id)
  }, [selectedProject])

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
      await loadProjectPlan(selectedProject.id)
    } catch (e) {
      setProjectPlanError(e instanceof Error ? e.message : 'Import failed.')
    } finally { setInFlight(false) }
  }

  const handleImportMilestones    = () => importArtifact(`${API_BASE_URL}/api/projects/${selectedProject!.id}/import-gsd-project`, setMilestonesImportInFlight)
  const handleImportRequirements  = () => importArtifact(`${API_BASE_URL}/api/projects/${selectedProject!.id}/import-gsd-requirements`, setRequirementsImportInFlight)
  const handleImportDecisions     = () => importArtifact(`${API_BASE_URL}/api/projects/${selectedProject!.id}/import-gsd-decisions`, setDecisionsImportInFlight)

  const handleScanWorkspace = async () => {
    setScanInFlight(true); setProjectsError(null)
    try {
      await fetch(`${API_BASE_URL}/api/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roots: [DEFAULT_SCAN_ROOT] }) })
      const res = await fetch(`${API_BASE_URL}/api/projects`)
      if (res.ok) { const d: Project[] = await res.json(); setProjects(d) }
    } catch { setProjectsError('Scan failed.') }
    finally { setScanInFlight(false) }
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
  const suggestedCommand = (() => {
    if (!projectPlan?.nextAction) return null
    if (blockers.some(b => /holistic|gsd|tool/i.test(b))) return 'npm run cc:doctor'
    if (/import|continue|review/i.test(projectPlan.nextAction.action)) return 'npm run cc:launch -- -NoBrowser'
    return null
  })()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}>

      {/* ── Left column: project list ──────────────────────────────────────── */}
      <div style={{ width: '280px', flexShrink: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>

        {/* Wordmark */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
              background: backendStatus === 'online' ? C.ok : backendStatus === 'offline' ? C.danger : 'var(--text-muted)',
              animation: backendStatus === 'checking' || backendStatus === 'offline' ? 'pulse 1.4s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Command Center</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', ...S.mono }}>v{APP_VERSION}</div>
        </div>

        {/* Offline callout */}
        {backendStatus === 'offline' && (
          <div style={{ margin: '8px 10px 0', padding: '8px 10px', background: `color-mix(in srgb, ${C.danger} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${C.danger} 20%, transparent)`, borderRadius: '5px', fontSize: '11px', color: C.danger, ...S.mono, lineHeight: 1.5 }}>
            Bridge offline — retrying…
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
                <div style={{ fontSize: '13px', fontWeight: isSelected ? 500 : 400, color: isSelected ? 'var(--text-title)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                  {project.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', ...S.mono, overflow: 'hidden' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: phaseColor(phase), flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: phaseColor(phase) }}>{phaseLabel}</span>
                  <span style={{ color: 'var(--text-faint)' }}>·</span>
                  <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{continuityLabel}</span>
                </div>
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
            <button disabled title="Coming soon"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '11px', color: 'var(--text-muted)', background: 'transparent', cursor: 'not-allowed', opacity: 0.35, fontFamily: 'var(--font)' }}
            >
              <Plus size={11} /> New
            </button>
          </div>
        </div>
      </div>

      {/* ── Right pane: detail ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {selectedProject ? (
          <div style={{ padding: '44px 52px', maxWidth: '860px' }} id="roadmap-section">

            {/* Project heading */}
            <div style={{ marginBottom: '44px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                  {selectedProject.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '3px', flexShrink: 0, ...S.mono }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: phaseColor(projectPlan?.workflowState.phase ?? 'no-data'), flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', color: phaseColor(projectPlan?.workflowState.phase ?? 'no-data') }}>
                    {projectPlan?.workflowState.phase ?? 'no-data'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', ...S.mono, marginBottom: '14px' }}>{selectedProject.rootPath}</div>
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
              {projectPlanLoading ? <Empty text="Loading…" /> : projectPlanError ? <Note variant="danger">{projectPlanError}</Note> : importedMilestones.length > 0 ? (
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
