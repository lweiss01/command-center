import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const db = new Database('mission_control.db');
const PORT = 3001;
const DEFAULT_SCAN_ROOTS = ['C:/Users/lweis/Documents'];
const PROJECT_MARKERS = ['.git', 'package.json', 'pyproject.toml', 'requirements.txt', '.gsd'];
const ARTIFACT_RULES = [
  { relativePath: '.gsd/PROJECT.md', artifactType: 'gsd_project' },
  { relativePath: '.gsd/REQUIREMENTS.md', artifactType: 'gsd_requirements' },
  { relativePath: '.gsd/DECISIONS.md', artifactType: 'gsd_decisions' },
  { relativePath: 'ROADMAP.md', artifactType: 'roadmap_md' },
  { relativePath: 'MILESTONES.md', artifactType: 'milestones_md' },
  { relativePath: 'README.md', artifactType: 'readme' },
  { relativePath: 'PROJECT.md', artifactType: 'generic_plan' },
  { relativePath: 'PLAN.md', artifactType: 'generic_plan' },
  { relativePath: 'TODO.md', artifactType: 'generic_todo' },
  { relativePath: 'init_todos.json', artifactType: 'generic_todo' },
];
const DOCS_ROADMAP_DIR = path.join('docs', 'roadmap');

app.use(cors());
app.use(express.json());

db.pragma('journal_mode = WAL');

function tableExists(tableName) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  return Boolean(row);
}

function getColumnNames(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
}

function migrateLegacyProjectsTable() {
  if (!tableExists('projects')) return;
  if (tableExists('projects_legacy')) return;

  const projectColumns = getColumnNames('projects');
  const isLegacyProjectsTable = projectColumns.includes('status') && projectColumns.includes('version') && !projectColumns.includes('root_path');

  if (isLegacyProjectsTable) {
    db.exec('ALTER TABLE projects RENAME TO projects_legacy');
  }
}

migrateLegacyProjectsTable();

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    root_path TEXT NOT NULL UNIQUE,
    repo_type TEXT NOT NULL,
    project_type TEXT NOT NULL,
    primary_language TEXT,
    framework TEXT,
    package_manager TEXT,
    has_git INTEGER NOT NULL DEFAULT 0,
    planning_status TEXT NOT NULL DEFAULT 'none',
    last_scanned_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS source_artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    artifact_type TEXT NOT NULL,
    path TEXT NOT NULL,
    title TEXT,
    confidence REAL NOT NULL DEFAULT 1.0,
    last_seen_at TEXT NOT NULL,
    parse_status TEXT NOT NULL DEFAULT 'detected',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(project_id, path),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS scan_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    root_path TEXT NOT NULL,
    status TEXT NOT NULL,
    projects_found INTEGER NOT NULL DEFAULT 0,
    artifacts_found INTEGER NOT NULL DEFAULT 0,
    summary TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS import_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    strategy TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    summary TEXT,
    warnings_json TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    external_key TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    origin TEXT NOT NULL DEFAULT 'imported',
    confidence REAL NOT NULL DEFAULT 1.0,
    needs_review INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    source_artifact_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(source_artifact_id) REFERENCES source_artifacts(id)
  );

  CREATE TABLE IF NOT EXISTS slices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    milestone_id INTEGER NOT NULL,
    external_key TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    origin TEXT NOT NULL DEFAULT 'imported',
    confidence REAL NOT NULL DEFAULT 1.0,
    needs_review INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    source_artifact_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(milestone_id) REFERENCES milestones(id),
    FOREIGN KEY(source_artifact_id) REFERENCES source_artifacts(id)
  );

  CREATE TABLE IF NOT EXISTS planning_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    milestone_id INTEGER,
    slice_id INTEGER,
    external_key TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    category TEXT,
    priority TEXT,
    origin TEXT NOT NULL DEFAULT 'imported',
    confidence REAL NOT NULL DEFAULT 1.0,
    needs_review INTEGER NOT NULL DEFAULT 0,
    source_artifact_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(milestone_id) REFERENCES milestones(id),
    FOREIGN KEY(slice_id) REFERENCES slices(id),
    FOREIGN KEY(source_artifact_id) REFERENCES source_artifacts(id)
  );

  CREATE TABLE IF NOT EXISTS requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    external_key TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    validation TEXT,
    notes TEXT,
    primary_owner TEXT,
    supporting_slices TEXT,
    source_artifact_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(source_artifact_id) REFERENCES source_artifacts(id)
  );

  CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    external_key TEXT,
    scope TEXT,
    decision TEXT NOT NULL,
    choice TEXT,
    rationale TEXT,
    revisable TEXT,
    when_context TEXT,
    source_artifact_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(source_artifact_id) REFERENCES source_artifacts(id)
  );

  CREATE TABLE IF NOT EXISTS evidence_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    source_artifact_id INTEGER NOT NULL,
    excerpt TEXT,
    line_start INTEGER,
    line_end INTEGER,
    confidence REAL NOT NULL DEFAULT 1.0,
    reason TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(source_artifact_id) REFERENCES source_artifacts(id)
  );

  CREATE TABLE IF NOT EXISTS projects_legacy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    status TEXT,
    version TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT,
    category TEXT,
    status TEXT,
    FOREIGN KEY(project_id) REFERENCES projects_legacy(id)
  );

  CREATE INDEX IF NOT EXISTS idx_projects_root_path ON projects(root_path);
  CREATE INDEX IF NOT EXISTS idx_artifacts_project_id ON source_artifacts(project_id);
  CREATE INDEX IF NOT EXISTS idx_scan_runs_started_at ON scan_runs(started_at DESC);
  CREATE INDEX IF NOT EXISTS idx_import_runs_project_id ON import_runs(project_id);
  CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
  CREATE INDEX IF NOT EXISTS idx_slices_project_id ON slices(project_id);
  CREATE INDEX IF NOT EXISTS idx_slices_milestone_id ON slices(milestone_id);
  CREATE INDEX IF NOT EXISTS idx_planning_tasks_project_id ON planning_tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_planning_tasks_slice_id ON planning_tasks(slice_id);
  CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements(project_id);
  CREATE INDEX IF NOT EXISTS idx_decisions_project_id ON decisions(project_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_links_entity ON evidence_links(entity_type, entity_id);
`);

const getLegacyProjectByName = db.prepare('SELECT id FROM projects_legacy WHERE name = ?');
const getLegacyTasksByProjectId = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY id ASC');
const getProjectByRootPath = db.prepare('SELECT id FROM projects WHERE root_path = ?');
const insertProject = db.prepare(`
  INSERT INTO projects (
    name, slug, root_path, repo_type, project_type, primary_language, framework, package_manager,
    has_git, planning_status, last_scanned_at, created_at, updated_at
  ) VALUES (
    @name, @slug, @root_path, @repo_type, @project_type, @primary_language, @framework, @package_manager,
    @has_git, @planning_status, @last_scanned_at, @created_at, @updated_at
  )
`);
const updateProject = db.prepare(`
  UPDATE projects
  SET name = @name,
      slug = @slug,
      repo_type = @repo_type,
      project_type = @project_type,
      primary_language = @primary_language,
      framework = @framework,
      package_manager = @package_manager,
      has_git = @has_git,
      planning_status = @planning_status,
      last_scanned_at = @last_scanned_at,
      updated_at = @updated_at
  WHERE root_path = @root_path
`);
const upsertArtifact = db.prepare(`
  INSERT INTO source_artifacts (
    project_id, artifact_type, path, title, confidence, last_seen_at, parse_status, created_at, updated_at
  ) VALUES (
    @project_id, @artifact_type, @path, @title, @confidence, @last_seen_at, @parse_status, @created_at, @updated_at
  )
  ON CONFLICT(project_id, path) DO UPDATE SET
    artifact_type = excluded.artifact_type,
    title = excluded.title,
    confidence = excluded.confidence,
    last_seen_at = excluded.last_seen_at,
    parse_status = excluded.parse_status,
    updated_at = excluded.updated_at
`);
const insertScanRun = db.prepare(`
  INSERT INTO scan_runs (root_path, status, projects_found, artifacts_found, summary, started_at, completed_at)
  VALUES (@root_path, @status, @projects_found, @artifacts_found, @summary, @started_at, @completed_at)
`);
const updateScanRun = db.prepare(`
  UPDATE scan_runs
  SET status = @status,
      projects_found = @projects_found,
      artifacts_found = @artifacts_found,
      summary = @summary,
      completed_at = @completed_at
  WHERE id = @id
`);
const listProjects = db.prepare(`
  SELECT p.*, COUNT(sa.id) AS artifact_count
  FROM projects p
  LEFT JOIN source_artifacts sa ON sa.project_id = p.id
  GROUP BY p.id
  ORDER BY LOWER(p.name) ASC
`);
const listArtifactsByProjectId = db.prepare(`
  SELECT id, project_id, artifact_type, path, title, confidence, parse_status, last_seen_at, created_at, updated_at
  FROM source_artifacts
  WHERE project_id = ?
  ORDER BY path ASC
`);
const listRecentScanRuns = db.prepare(`
  SELECT *
  FROM scan_runs
  ORDER BY started_at DESC, id DESC
  LIMIT ?
`);
const getProjectById = db.prepare(`
  SELECT p.*, COUNT(sa.id) AS artifact_count
  FROM projects p
  LEFT JOIN source_artifacts sa ON sa.project_id = p.id
  WHERE p.id = ?
  GROUP BY p.id
`);
const listMilestonesByProjectId = db.prepare(`
  SELECT *
  FROM milestones
  WHERE project_id = ?
  ORDER BY sort_order ASC, id ASC
`);
const listSlicesByProjectId = db.prepare(`
  SELECT *
  FROM slices
  WHERE project_id = ?
  ORDER BY sort_order ASC, id ASC
`);
const listPlanningTasksByProjectId = db.prepare(`
  SELECT *
  FROM planning_tasks
  WHERE project_id = ?
  ORDER BY id ASC
`);
const listRequirementsByProjectId = db.prepare(`
  SELECT *
  FROM requirements
  WHERE project_id = ?
  ORDER BY external_key ASC, id ASC
`);
const listDecisionsByProjectId = db.prepare(`
  SELECT *
  FROM decisions
  WHERE project_id = ?
  ORDER BY id ASC
`);
const listImportRunsByProjectId = db.prepare(`
  SELECT *
  FROM import_runs
  WHERE project_id = ?
  ORDER BY started_at DESC, id DESC
`);
const getGsdProjectArtifactByProjectId = db.prepare(`
  SELECT *
  FROM source_artifacts
  WHERE project_id = ? AND artifact_type = 'gsd_project'
  ORDER BY id ASC
  LIMIT 1
`);
const insertImportRun = db.prepare(`
  INSERT INTO import_runs (
    project_id, status, strategy, started_at, completed_at, summary, warnings_json
  ) VALUES (
    @project_id, @status, @strategy, @started_at, @completed_at, @summary, @warnings_json
  )
`);
const updateImportRun = db.prepare(`
  UPDATE import_runs
  SET status = @status,
      completed_at = @completed_at,
      summary = @summary,
      warnings_json = @warnings_json
  WHERE id = @id
`);
const getMilestoneByProjectArtifactAndKey = db.prepare(`
  SELECT *
  FROM milestones
  WHERE project_id = @project_id
    AND source_artifact_id = @source_artifact_id
    AND external_key = @external_key
  LIMIT 1
`);
const insertMilestone = db.prepare(`
  INSERT INTO milestones (
    project_id, external_key, title, description, status, origin, confidence,
    needs_review, sort_order, source_artifact_id, created_at, updated_at
  ) VALUES (
    @project_id, @external_key, @title, @description, @status, @origin, @confidence,
    @needs_review, @sort_order, @source_artifact_id, @created_at, @updated_at
  )
`);
const updateMilestone = db.prepare(`
  UPDATE milestones
  SET title = @title,
      description = @description,
      status = @status,
      origin = @origin,
      confidence = @confidence,
      needs_review = @needs_review,
      sort_order = @sort_order,
      updated_at = @updated_at
  WHERE id = @id
`);
const deleteEvidenceLinksForEntityAndSource = db.prepare(`
  DELETE FROM evidence_links
  WHERE entity_type = @entity_type
    AND entity_id = @entity_id
    AND source_artifact_id = @source_artifact_id
`);
const listMilestonesBySourceArtifactId = db.prepare(`
  SELECT *
  FROM milestones
  WHERE project_id = @project_id
    AND source_artifact_id = @source_artifact_id
`);
const deleteMilestoneById = db.prepare(`
  DELETE FROM milestones
  WHERE id = @id
`);
const insertEvidenceLink = db.prepare(`
  INSERT INTO evidence_links (
    entity_type, entity_id, source_artifact_id, excerpt, line_start, line_end, confidence, reason, created_at
  ) VALUES (
    @entity_type, @entity_id, @source_artifact_id, @excerpt, @line_start, @line_end, @confidence, @reason, @created_at
  )
`);
const getGsdRequirementsArtifactByProjectId = db.prepare(`
  SELECT *
  FROM source_artifacts
  WHERE project_id = ? AND artifact_type = 'gsd_requirements'
  ORDER BY id ASC
  LIMIT 1
`);
const getRequirementByProjectArtifactAndKey = db.prepare(`
  SELECT *
  FROM requirements
  WHERE project_id = @project_id
    AND source_artifact_id = @source_artifact_id
    AND external_key = @external_key
  LIMIT 1
`);
const insertRequirement = db.prepare(`
  INSERT INTO requirements (
    project_id, external_key, title, description, status, validation, notes,
    primary_owner, supporting_slices, source_artifact_id, created_at, updated_at
  ) VALUES (
    @project_id, @external_key, @title, @description, @status, @validation, @notes,
    @primary_owner, @supporting_slices, @source_artifact_id, @created_at, @updated_at
  )
`);
const updateRequirement = db.prepare(`
  UPDATE requirements
  SET title = @title,
      description = @description,
      status = @status,
      validation = @validation,
      notes = @notes,
      primary_owner = @primary_owner,
      supporting_slices = @supporting_slices,
      updated_at = @updated_at
  WHERE id = @id
`);
const listRequirementsBySourceArtifactId = db.prepare(`
  SELECT *
  FROM requirements
  WHERE project_id = @project_id
    AND source_artifact_id = @source_artifact_id
`);
const deleteRequirementById = db.prepare(`
  DELETE FROM requirements
  WHERE id = @id
`);
const getGsdDecisionsArtifactByProjectId = db.prepare(`
  SELECT *
  FROM source_artifacts
  WHERE project_id = ? AND artifact_type = 'gsd_decisions'
  ORDER BY id ASC
  LIMIT 1
`);
const getDecisionByProjectArtifactAndKey = db.prepare(`
  SELECT *
  FROM decisions
  WHERE project_id = @project_id
    AND source_artifact_id = @source_artifact_id
    AND external_key = @external_key
  LIMIT 1
`);
const insertDecision = db.prepare(`
  INSERT INTO decisions (
    project_id, external_key, scope, decision, choice, rationale, revisable,
    when_context, source_artifact_id, created_at, updated_at
  ) VALUES (
    @project_id, @external_key, @scope, @decision, @choice, @rationale, @revisable,
    @when_context, @source_artifact_id, @created_at, @updated_at
  )
`);
const updateDecision = db.prepare(`
  UPDATE decisions
  SET scope = @scope,
      decision = @decision,
      choice = @choice,
      rationale = @rationale,
      revisable = @revisable,
      when_context = @when_context,
      updated_at = @updated_at
  WHERE id = @id
`);
const listDecisionsBySourceArtifactId = db.prepare(`
  SELECT *
  FROM decisions
  WHERE project_id = @project_id
    AND source_artifact_id = @source_artifact_id
`);
const deleteDecisionById = db.prepare(`
  DELETE FROM decisions
  WHERE id = @id
`);

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

function detectProjectType(projectRoot) {
  if (exists(path.join(projectRoot, 'package.json'))) return 'web_node';
  if (exists(path.join(projectRoot, 'pyproject.toml')) || exists(path.join(projectRoot, 'requirements.txt'))) return 'python';
  if (exists(path.join(projectRoot, '.gsd')) || exists(path.join(projectRoot, 'README.md'))) return 'general';
  return 'unknown';
}

function detectPrimaryLanguage(projectRoot) {
  if (exists(path.join(projectRoot, 'package.json'))) return 'javascript/typescript';
  if (exists(path.join(projectRoot, 'pyproject.toml')) || exists(path.join(projectRoot, 'requirements.txt'))) return 'python';
  return null;
}

function detectPackageManager(projectRoot) {
  if (exists(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (exists(path.join(projectRoot, 'package-lock.json'))) return 'npm';
  if (exists(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  return null;
}

function detectFramework(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!exists(packageJsonPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };

    if (deps.next) return 'nextjs';
    if (deps.vite) return 'vite';
    if (deps.react) return 'react';
  } catch {
    return null;
  }

  return null;
}

function detectArtifacts(projectRoot) {
  const now = new Date().toISOString();
  const artifacts = [];

  for (const rule of ARTIFACT_RULES) {
    const absolutePath = path.join(projectRoot, rule.relativePath);
    if (exists(absolutePath)) {
      artifacts.push({
        artifact_type: rule.artifactType,
        path: absolutePath,
        title: path.basename(absolutePath),
        confidence: 1.0,
        parse_status: 'detected',
        last_seen_at: now,
        created_at: now,
        updated_at: now,
      });
    }
  }

  const roadmapDir = path.join(projectRoot, DOCS_ROADMAP_DIR);
  if (exists(roadmapDir)) {
    for (const entry of safeReadDir(roadmapDir)) {
      if (entry.isFile()) {
        const artifactPath = path.join(roadmapDir, entry.name);
        artifacts.push({
          artifact_type: 'generic_plan',
          path: artifactPath,
          title: entry.name,
          confidence: 0.85,
          parse_status: 'detected',
          last_seen_at: now,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  return artifacts;
}

function derivePlanningStatus(artifacts) {
  const types = new Set(artifacts.map((artifact) => artifact.artifact_type));
  if (
    types.has('gsd_project') ||
    types.has('gsd_requirements') ||
    types.has('roadmap_md') ||
    types.has('milestones_md')
  ) {
    return 'structured';
  }

  if (artifacts.length > 0) {
    return 'partial';
  }

  return 'none';
}

function isProjectCandidate(projectRoot) {
  return PROJECT_MARKERS.some((marker) => exists(path.join(projectRoot, marker)));
}

function parseProjectId(rawProjectId) {
  const projectId = Number(rawProjectId);
  if (Number.isNaN(projectId)) {
    return null;
  }
  return projectId;
}

function serializeProjectRow(project) {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    rootPath: project.root_path,
    repoType: project.repo_type,
    projectType: project.project_type,
    primaryLanguage: project.primary_language,
    framework: project.framework,
    packageManager: project.package_manager,
    hasGit: Boolean(project.has_git),
    planningStatus: project.planning_status,
    artifactCount: project.artifact_count,
    lastScannedAt: project.last_scanned_at,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

function serializeMilestoneRow(milestone) {
  return {
    id: milestone.id,
    projectId: milestone.project_id,
    externalKey: milestone.external_key,
    title: milestone.title,
    description: milestone.description,
    status: milestone.status,
    origin: milestone.origin,
    confidence: milestone.confidence,
    needsReview: Boolean(milestone.needs_review),
    sortOrder: milestone.sort_order,
    sourceArtifactId: milestone.source_artifact_id,
    createdAt: milestone.created_at,
    updatedAt: milestone.updated_at,
  };
}

function serializeSliceRow(slice) {
  return {
    id: slice.id,
    projectId: slice.project_id,
    milestoneId: slice.milestone_id,
    externalKey: slice.external_key,
    title: slice.title,
    description: slice.description,
    status: slice.status,
    origin: slice.origin,
    confidence: slice.confidence,
    needsReview: Boolean(slice.needs_review),
    sortOrder: slice.sort_order,
    sourceArtifactId: slice.source_artifact_id,
    createdAt: slice.created_at,
    updatedAt: slice.updated_at,
  };
}

function serializePlanningTaskRow(task) {
  return {
    id: task.id,
    projectId: task.project_id,
    milestoneId: task.milestone_id,
    sliceId: task.slice_id,
    externalKey: task.external_key,
    title: task.title,
    description: task.description,
    status: task.status,
    category: task.category,
    priority: task.priority,
    origin: task.origin,
    confidence: task.confidence,
    needsReview: Boolean(task.needs_review),
    sourceArtifactId: task.source_artifact_id,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

function serializeRequirementRow(requirement) {
  return {
    id: requirement.id,
    projectId: requirement.project_id,
    externalKey: requirement.external_key,
    title: requirement.title,
    description: requirement.description,
    status: requirement.status,
    validation: requirement.validation,
    notes: requirement.notes,
    primaryOwner: requirement.primary_owner,
    supportingSlices: requirement.supporting_slices,
    sourceArtifactId: requirement.source_artifact_id,
    createdAt: requirement.created_at,
    updatedAt: requirement.updated_at,
  };
}

function serializeDecisionRow(decision) {
  return {
    id: decision.id,
    projectId: decision.project_id,
    externalKey: decision.external_key,
    scope: decision.scope,
    decision: decision.decision,
    choice: decision.choice,
    rationale: decision.rationale,
    revisable: decision.revisable,
    whenContext: decision.when_context,
    sourceArtifactId: decision.source_artifact_id,
    createdAt: decision.created_at,
    updatedAt: decision.updated_at,
  };
}

function serializeImportRunRow(importRun) {
  return {
    id: importRun.id,
    projectId: importRun.project_id,
    status: importRun.status,
    strategy: importRun.strategy,
    artifactType: importRun.strategy,
    startedAt: importRun.started_at,
    completedAt: importRun.completed_at,
    summary: importRun.summary,
    warningsJson: importRun.warnings_json,
  };
}

function computeWorkflowState({ milestones, requirements, decisions, continuity }) {
  const evidence = [];
  let structuredGroups = 0;

  if (milestones.length > 0) {
    structuredGroups += 1;
    evidence.push(`Imported ${milestones.length} milestone${milestones.length === 1 ? '' : 's'} from .gsd/PROJECT.md`);
  }

  if (requirements.length > 0) {
    structuredGroups += 1;
    evidence.push(`Imported ${requirements.length} requirement${requirements.length === 1 ? '' : 's'} from .gsd/REQUIREMENTS.md`);
  }

  if (decisions.length > 0) {
    structuredGroups += 1;
    evidence.push(`Imported ${decisions.length} decision${decisions.length === 1 ? '' : 's'} from .gsd/DECISIONS.md`);
  }

  if (structuredGroups === 0) {
    return {
      phase: 'discuss',
      confidence: 'low',
      evidence: ['No structured planning artifacts imported yet'],
    };
  }

  let confidence = structuredGroups >= 2 ? 'high' : 'medium';

  if (continuity?.freshness === 'stale') {
    confidence = confidence === 'high' ? 'medium' : 'low';
    evidence.push('Continuity is stale, so workflow confidence was reduced one step');
  }

  return {
    phase: 'plan',
    confidence,
    evidence,
  };
}

function computeContinuity(project) {
  const holisticStatePath = path.join(project.root_path, '.holistic', 'state.json');
  const currentPlanPath = path.join(project.root_path, '.holistic', 'context', 'current-plan.md');

  if (!fs.existsSync(holisticStatePath)) {
    return {
      freshness: 'stale',
      activeSession: false,
      lastUpdatedAt: null,
      summary: ['No repo-local Holistic state detected'],
    };
  }

  try {
    const holisticState = JSON.parse(fs.readFileSync(holisticStatePath, 'utf8'));
    const activeSession = holisticState?.activeSession ?? null;
    const updatedAt = activeSession?.updatedAt ?? holisticState?.updatedAt ?? null;
    const updatedAtMs = updatedAt ? Date.parse(updatedAt) : Number.NaN;
    const ageMs = Number.isNaN(updatedAtMs) ? Number.POSITIVE_INFINITY : Date.now() - updatedAtMs;

    let freshness = 'stale';
    if (ageMs <= 6 * 60 * 60 * 1000) {
      freshness = 'fresh';
    } else if (ageMs <= 3 * 24 * 60 * 60 * 1000) {
      freshness = 'aging';
    }

    const summary = [];

    if (activeSession?.currentGoal) {
      summary.push(`Goal: ${activeSession.currentGoal}`);
    }

    if (activeSession?.latestStatus) {
      summary.push(`Status: ${activeSession.latestStatus}`);
    }

    if (Array.isArray(activeSession?.currentPlan)) {
      for (const item of activeSession.currentPlan.slice(0, 2)) {
        if (typeof item === 'string' && item.trim().length > 0) {
          summary.push(`Plan: ${item.trim()}`);
        }
      }
    }

    if (summary.length === 0 && fs.existsSync(currentPlanPath)) {
      const currentPlanMarkdown = fs.readFileSync(currentPlanPath, 'utf8');
      const fallbackLines = currentPlanMarkdown
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .slice(0, 2)
        .map((line) => `Plan: ${line.slice(2).trim()}`);
      summary.push(...fallbackLines);
    }

    if (summary.length === 0) {
      summary.push('Holistic state detected, but no active summary items were available');
    }

    return {
      freshness,
      activeSession: Boolean(activeSession && activeSession.status === 'active'),
      lastUpdatedAt: updatedAt,
      summary,
    };
  } catch (error) {
    console.warn(`Failed to read Holistic state for ${project.root_path}:`, error);
    return {
      freshness: 'stale',
      activeSession: false,
      lastUpdatedAt: null,
      summary: ['Holistic state exists but could not be read'],
    };
  }
}

function computeNextAction({ milestones, requirements, decisions, workflowState, continuity }) {
  const hasStructuredArtifacts = milestones.length > 0 || requirements.length > 0 || decisions.length > 0;

  if (continuity?.freshness === 'stale') {
    return {
      label: 'Refresh continuity before continuing',
      reason: 'Repo-local Holistic continuity is stale, so the next safest step is to review the latest handoff or checkpoint context first.',
      priority: 'high',
    };
  }

  if (!hasStructuredArtifacts) {
    return {
      label: 'Import planning artifacts',
      reason: 'No structured planning artifacts have been imported yet, so the cockpit needs repo docs before it can provide stronger guidance.',
      priority: 'high',
    };
  }

  if (milestones.length > 0 && requirements.length === 0) {
    return {
      label: 'Import requirements for fuller planning coverage',
      reason: 'Milestones are present, but requirements are still missing, so the canonical plan is incomplete.',
      priority: 'medium',
    };
  }

  if (workflowState?.phase === 'discuss' && continuity?.freshness === 'fresh') {
    return {
      label: 'Clarify the current plan before implementation',
      reason: 'Continuity is fresh, but the repo still looks discussion-heavy rather than structured enough for execution.',
      priority: 'medium',
    };
  }

  return {
    label: 'Review the current plan and continue execution prep',
    reason: 'The repo has structured planning context and usable continuity, so the next step is to advance the active work deliberately.',
    priority: 'medium',
  };
}

function getValidatedProjectOrSend(projectIdParam, res) {
  const projectId = parseProjectId(projectIdParam);
  if (projectId === null) {
    res.status(400).json({ error: 'Project id must be numeric' });
    return null;
  }

  const project = getProjectById.get(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }

  return { projectId, project };
}

function parseGsdProjectMilestones(markdown) {
  const lines = markdown.split(/\r?\n/);
  const warnings = [];
  const milestones = [];

  let inMilestoneSection = false;
  let milestoneHeadingLevel = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const headingLevel = headingMatch[1].length;
      const headingText = headingMatch[2].trim().toLowerCase();
      const isMilestoneHeading = headingText.includes('milestone sequence') || headingText === 'milestones' || headingText.endsWith(' milestones');

      if (isMilestoneHeading) {
        inMilestoneSection = true;
        milestoneHeadingLevel = headingLevel;
        continue;
      }

      if (inMilestoneSection && milestoneHeadingLevel !== null && headingLevel <= milestoneHeadingLevel) {
        break;
      }
    }

    if (!inMilestoneSection || trimmed.length === 0) continue;

    const milestoneMatch = trimmed.match(/^[-*]\s*(?:\[( |x|X)\]\s*)?(M\d{3,})\s*(?::|—|-)?\s*(.+)$/);
    if (!milestoneMatch) {
      if (/^[-*]\s*/.test(trimmed) && /M\d{3,}/.test(trimmed)) {
        warnings.push(`Skipped unparseable milestone line ${index + 1}: ${trimmed}`);
      }
      continue;
    }

    const checkboxState = milestoneMatch[1] ?? ' ';
    const externalKey = milestoneMatch[2].trim();
    const title = milestoneMatch[3].trim();

    if (!title) {
      warnings.push(`Skipped milestone with empty title on line ${index + 1}`);
      continue;
    }

    milestones.push({
      externalKey,
      title,
      status: checkboxState.toLowerCase() === 'x' ? 'done' : 'planned',
      sortOrder: milestones.length,
      excerpt: trimmed,
      lineStart: index + 1,
      lineEnd: index + 1,
    });
  }

  if (!inMilestoneSection) {
    return {
      milestones: [],
      warnings: ['No milestone section found in .gsd/PROJECT.md'],
      sectionFound: false,
    };
  }

  if (milestones.length === 0) {
    warnings.push('Milestone section found, but no valid milestone lines were parsed');
  }

  return {
    milestones,
    warnings,
    sectionFound: true,
  };
}

function importGsdProjectMilestones(projectId) {
  const project = getProjectById.get(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const artifact = getGsdProjectArtifactByProjectId.get(projectId);
  if (!artifact) {
    const error = new Error('No .gsd/PROJECT.md artifact found for this project');
    error.code = 'ARTIFACT_NOT_FOUND';
    throw error;
  }

  if (!exists(artifact.path)) {
    const error = new Error(`Artifact file not found on disk: ${artifact.path}`);
    error.code = 'ARTIFACT_MISSING_ON_DISK';
    throw error;
  }

  const startedAt = new Date().toISOString();
  const importRunResult = insertImportRun.run({
    project_id: projectId,
    status: 'running',
    strategy: 'gsd_project',
    started_at: startedAt,
    completed_at: null,
    summary: null,
    warnings_json: null,
  });
  const importRunId = Number(importRunResult.lastInsertRowid);

  try {
    const markdown = fs.readFileSync(artifact.path, 'utf8');
    const parsed = parseGsdProjectMilestones(markdown);

    if (!parsed.sectionFound || parsed.milestones.length === 0) {
      updateImportRun.run({
        id: importRunId,
        status: parsed.sectionFound ? 'partial' : 'failed',
        completed_at: new Date().toISOString(),
        summary: parsed.sectionFound
          ? 'Milestone section found, but no milestones were imported.'
          : 'No milestone section found in .gsd/PROJECT.md.',
        warnings_json: JSON.stringify(parsed.warnings),
      });

      return {
        ok: parsed.sectionFound,
        projectId,
        artifactPath: artifact.path,
        importRunId,
        milestonesImported: 0,
        warnings: parsed.warnings,
      };
    }

    let importedCount = 0;
    const now = new Date().toISOString();

    for (const milestone of parsed.milestones) {
      const existingMilestone = getMilestoneByProjectArtifactAndKey.get({
        project_id: projectId,
        source_artifact_id: artifact.id,
        external_key: milestone.externalKey,
      });

      if (existingMilestone) {
        updateMilestone.run({
          id: existingMilestone.id,
          title: milestone.title,
          description: null,
          status: milestone.status,
          origin: 'imported',
          confidence: 1.0,
          needs_review: 0,
          sort_order: milestone.sortOrder,
          updated_at: now,
        });
      } else {
        insertMilestone.run({
          project_id: projectId,
          external_key: milestone.externalKey,
          title: milestone.title,
          description: null,
          status: milestone.status,
          origin: 'imported',
          confidence: 1.0,
          needs_review: 0,
          sort_order: milestone.sortOrder,
          source_artifact_id: artifact.id,
          created_at: now,
          updated_at: now,
        });
      }

      const persistedMilestone = getMilestoneByProjectArtifactAndKey.get({
        project_id: projectId,
        source_artifact_id: artifact.id,
        external_key: milestone.externalKey,
      });

      deleteEvidenceLinksForEntityAndSource.run({
        entity_type: 'milestone',
        entity_id: persistedMilestone.id,
        source_artifact_id: artifact.id,
      });

      insertEvidenceLink.run({
        entity_type: 'milestone',
        entity_id: persistedMilestone.id,
        source_artifact_id: artifact.id,
        excerpt: milestone.excerpt,
        line_start: milestone.lineStart,
        line_end: milestone.lineEnd,
        confidence: 1.0,
        reason: 'Parsed from .gsd/PROJECT.md milestone sequence',
        created_at: now,
      });

      importedCount += 1;
    }

    const parsedKeys = new Set(parsed.milestones.map((milestone) => milestone.externalKey));
    const existingMilestones = listMilestonesBySourceArtifactId.all({
      project_id: projectId,
      source_artifact_id: artifact.id,
    });

    for (const existingMilestone of existingMilestones) {
      if (existingMilestone.external_key && !parsedKeys.has(existingMilestone.external_key)) {
        deleteEvidenceLinksForEntityAndSource.run({
          entity_type: 'milestone',
          entity_id: existingMilestone.id,
          source_artifact_id: artifact.id,
        });
        deleteMilestoneById.run({ id: existingMilestone.id });
      }
    }

    const finalStatus = parsed.warnings.length > 0 ? 'partial' : 'success';
    updateImportRun.run({
      id: importRunId,
      status: finalStatus,
      completed_at: new Date().toISOString(),
      summary: `Imported ${importedCount} milestones from .gsd/PROJECT.md.`,
      warnings_json: JSON.stringify(parsed.warnings),
    });

    return {
      ok: true,
      projectId,
      artifactPath: artifact.path,
      importRunId,
      milestonesImported: importedCount,
      warnings: parsed.warnings,
    };
  } catch (error) {
    updateImportRun.run({
      id: importRunId,
      status: 'failed',
      completed_at: new Date().toISOString(),
      summary: error instanceof Error ? error.message : 'Unknown import failure',
      warnings_json: JSON.stringify([]),
    });
    throw error;
  }
}

function normalizeRequirementStatus(explicitStatus, sectionStatus) {
  if (explicitStatus) return explicitStatus.trim().toLowerCase().replace(/\s+/g, '-');
  if (sectionStatus) return sectionStatus;
  return 'active';
}

function parseGsdRequirements(markdown) {
  const lines = markdown.split(/\r?\n/);
  const warnings = [];
  const requirements = [];

  let currentSectionStatus = null;
  let currentRequirement = null;

  const finalizeRequirement = () => {
    if (!currentRequirement) return;

    const notesParts = [];
    if (currentRequirement.notes) notesParts.push(currentRequirement.notes);
    if (currentRequirement.whyItMatters) notesParts.push(`Why it matters: ${currentRequirement.whyItMatters}`);

    if (!currentRequirement.description) {
      warnings.push(`Requirement ${currentRequirement.externalKey} is missing a description`);
    }

    requirements.push({
      externalKey: currentRequirement.externalKey,
      title: currentRequirement.title,
      description: currentRequirement.description ?? '',
      status: normalizeRequirementStatus(currentRequirement.status, currentSectionStatus),
      validation: currentRequirement.validation ?? null,
      notes: notesParts.length > 0 ? notesParts.join('\n\n') : null,
      primaryOwner: currentRequirement.primaryOwner ?? null,
      supportingSlices: currentRequirement.supportingSlices ?? null,
      excerpt: currentRequirement.lines.join('\n'),
      lineStart: currentRequirement.lineStart,
      lineEnd: currentRequirement.lineEnd,
    });

    currentRequirement = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    const sectionMatch = trimmed.match(/^##\s+(Active|Validated|Deferred|Out of Scope)\s*$/i);
    if (sectionMatch) {
      finalizeRequirement();
      currentSectionStatus = sectionMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
      continue;
    }

    const requirementHeadingMatch = trimmed.match(/^###\s+(R\d{3,})\s+[—-]\s+(.+)$/);
    if (requirementHeadingMatch) {
      finalizeRequirement();
      currentRequirement = {
        externalKey: requirementHeadingMatch[1].trim(),
        title: requirementHeadingMatch[2].trim(),
        description: null,
        status: null,
        validation: null,
        notes: null,
        whyItMatters: null,
        primaryOwner: null,
        supportingSlices: null,
        lineStart: index + 1,
        lineEnd: index + 1,
        lines: [trimmed],
      };
      continue;
    }

    if (!currentRequirement) continue;

    currentRequirement.lineEnd = index + 1;
    if (trimmed.length > 0) {
      currentRequirement.lines.push(trimmed);
    }

    const fieldMatch = trimmed.match(/^-\s*([^:]+):\s*(.+)$/);
    if (!fieldMatch) continue;

    const fieldName = fieldMatch[1].trim().toLowerCase();
    const fieldValue = fieldMatch[2].trim();

    if (fieldName === 'status') currentRequirement.status = fieldValue;
    else if (fieldName === 'description') currentRequirement.description = fieldValue;
    else if (fieldName === 'validation') currentRequirement.validation = fieldValue;
    else if (fieldName === 'notes') currentRequirement.notes = fieldValue;
    else if (fieldName === 'why it matters') currentRequirement.whyItMatters = fieldValue;
    else if (fieldName === 'primary owning slice') currentRequirement.primaryOwner = fieldValue;
    else if (fieldName === 'supporting slices') currentRequirement.supportingSlices = fieldValue;
  }

  finalizeRequirement();

  if (requirements.length === 0) {
    warnings.push('No requirement blocks found in .gsd/REQUIREMENTS.md');
  }

  return { requirements, warnings };
}

function importGsdRequirements(projectId) {
  const project = getProjectById.get(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const artifact = getGsdRequirementsArtifactByProjectId.get(projectId);
  if (!artifact) {
    const error = new Error('No .gsd/REQUIREMENTS.md artifact found for this project');
    error.code = 'ARTIFACT_NOT_FOUND';
    throw error;
  }

  if (!exists(artifact.path)) {
    const error = new Error(`Artifact file not found on disk: ${artifact.path}`);
    error.code = 'ARTIFACT_MISSING_ON_DISK';
    throw error;
  }

  const startedAt = new Date().toISOString();
  const importRunResult = insertImportRun.run({
    project_id: projectId,
    status: 'running',
    strategy: 'gsd_requirements',
    started_at: startedAt,
    completed_at: null,
    summary: null,
    warnings_json: null,
  });
  const importRunId = Number(importRunResult.lastInsertRowid);

  try {
    const markdown = fs.readFileSync(artifact.path, 'utf8');
    const parsed = parseGsdRequirements(markdown);

    if (parsed.requirements.length === 0) {
      updateImportRun.run({
        id: importRunId,
        status: 'failed',
        completed_at: new Date().toISOString(),
        summary: 'No requirements were imported from .gsd/REQUIREMENTS.md.',
        warnings_json: JSON.stringify(parsed.warnings),
      });

      return {
        ok: false,
        projectId,
        artifactPath: artifact.path,
        importRunId,
        requirementsImported: 0,
        warnings: parsed.warnings,
      };
    }

    let importedCount = 0;
    const now = new Date().toISOString();

    for (const requirement of parsed.requirements) {
      const existingRequirement = getRequirementByProjectArtifactAndKey.get({
        project_id: projectId,
        source_artifact_id: artifact.id,
        external_key: requirement.externalKey,
      });

      if (existingRequirement) {
        updateRequirement.run({
          id: existingRequirement.id,
          title: requirement.title,
          description: requirement.description,
          status: requirement.status,
          validation: requirement.validation,
          notes: requirement.notes,
          primary_owner: requirement.primaryOwner,
          supporting_slices: requirement.supportingSlices,
          updated_at: now,
        });
      } else {
        insertRequirement.run({
          project_id: projectId,
          external_key: requirement.externalKey,
          title: requirement.title,
          description: requirement.description,
          status: requirement.status,
          validation: requirement.validation,
          notes: requirement.notes,
          primary_owner: requirement.primaryOwner,
          supporting_slices: requirement.supportingSlices,
          source_artifact_id: artifact.id,
          created_at: now,
          updated_at: now,
        });
      }

      const persistedRequirement = getRequirementByProjectArtifactAndKey.get({
        project_id: projectId,
        source_artifact_id: artifact.id,
        external_key: requirement.externalKey,
      });

      deleteEvidenceLinksForEntityAndSource.run({
        entity_type: 'requirement',
        entity_id: persistedRequirement.id,
        source_artifact_id: artifact.id,
      });

      insertEvidenceLink.run({
        entity_type: 'requirement',
        entity_id: persistedRequirement.id,
        source_artifact_id: artifact.id,
        excerpt: requirement.excerpt,
        line_start: requirement.lineStart,
        line_end: requirement.lineEnd,
        confidence: 1.0,
        reason: 'Parsed from .gsd/REQUIREMENTS.md requirement block',
        created_at: now,
      });

      importedCount += 1;
    }

    const parsedKeys = new Set(parsed.requirements.map((requirement) => requirement.externalKey));
    const existingRequirements = listRequirementsBySourceArtifactId.all({
      project_id: projectId,
      source_artifact_id: artifact.id,
    });

    for (const existingRequirement of existingRequirements) {
      if (existingRequirement.external_key && !parsedKeys.has(existingRequirement.external_key)) {
        deleteEvidenceLinksForEntityAndSource.run({
          entity_type: 'requirement',
          entity_id: existingRequirement.id,
          source_artifact_id: artifact.id,
        });
        deleteRequirementById.run({ id: existingRequirement.id });
      }
    }

    const finalStatus = parsed.warnings.length > 0 ? 'partial' : 'success';
    updateImportRun.run({
      id: importRunId,
      status: finalStatus,
      completed_at: new Date().toISOString(),
      summary: `Imported ${importedCount} requirements from .gsd/REQUIREMENTS.md.`,
      warnings_json: JSON.stringify(parsed.warnings),
    });

    return {
      ok: true,
      projectId,
      artifactPath: artifact.path,
      importRunId,
      requirementsImported: importedCount,
      warnings: parsed.warnings,
    };
  } catch (error) {
    updateImportRun.run({
      id: importRunId,
      status: 'failed',
      completed_at: new Date().toISOString(),
      summary: error instanceof Error ? error.message : 'Unknown import failure',
      warnings_json: JSON.stringify([]),
    });
    throw error;
  }
}

function parsePipeRow(line) {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function parseGsdDecisions(markdown) {
  const lines = markdown.split(/\r?\n/);
  const warnings = [];
  const decisions = [];

  let inDecisionTable = false;
  let sawDecisionTable = false;
  let bulletDecisionCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inDecisionTable) break;
      continue;
    }

    if (/^\|\s*#\s*\|\s*When\s*\|\s*Scope\s*\|\s*Decision\s*\|\s*Choice\s*\|\s*Rationale\s*\|\s*Revisable\?\s*\|\s*Made By\s*\|\s*$/i.test(trimmed)) {
      sawDecisionTable = true;
      inDecisionTable = true;
      continue;
    }

    if (inDecisionTable) {
      if (/^\|(?:\s*[-:]+\s*\|)+\s*$/.test(trimmed)) {
        continue;
      }

      if (!trimmed.startsWith('|')) {
        break;
      }

      const cells = parsePipeRow(trimmed);
      if (cells.length < 8) {
        warnings.push(`Skipped malformed decision row ${index + 1}`);
        continue;
      }

      const [externalKey, whenContext, scope, decision, choice, rationale, revisable] = cells;
      if (!decision) {
        warnings.push(`Skipped decision row ${index + 1} with empty decision text`);
        continue;
      }

      decisions.push({
        externalKey: externalKey || `row-${index + 1}`,
        scope: scope || null,
        decision,
        choice: choice || null,
        rationale: rationale || null,
        revisable: revisable || null,
        whenContext: whenContext || null,
        excerpt: trimmed,
        lineStart: index + 1,
        lineEnd: index + 1,
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+"?(.+?)"?$/);
    if (bulletMatch) {
      bulletDecisionCount += 1;
      decisions.push({
        externalKey: `line-${bulletDecisionCount}`,
        scope: null,
        decision: bulletMatch[1].trim(),
        choice: null,
        rationale: null,
        revisable: null,
        whenContext: null,
        excerpt: trimmed,
        lineStart: index + 1,
        lineEnd: index + 1,
      });
    }
  }

  if (decisions.length === 0) {
    warnings.push(
      sawDecisionTable
        ? 'Decision table found, but no valid rows were parsed from .gsd/DECISIONS.md'
        : 'No supported decision entries found in .gsd/DECISIONS.md',
    );
  }

  return { decisions, warnings };
}

function importGsdDecisions(projectId) {
  const project = getProjectById.get(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const artifact = getGsdDecisionsArtifactByProjectId.get(projectId);
  if (!artifact) {
    const error = new Error('No .gsd/DECISIONS.md artifact found for this project');
    error.code = 'ARTIFACT_NOT_FOUND';
    throw error;
  }

  if (!exists(artifact.path)) {
    const error = new Error(`Artifact file not found on disk: ${artifact.path}`);
    error.code = 'ARTIFACT_MISSING_ON_DISK';
    throw error;
  }

  const startedAt = new Date().toISOString();
  const importRunResult = insertImportRun.run({
    project_id: projectId,
    status: 'running',
    strategy: 'gsd_decisions',
    started_at: startedAt,
    completed_at: null,
    summary: null,
    warnings_json: null,
  });
  const importRunId = Number(importRunResult.lastInsertRowid);

  try {
    const markdown = fs.readFileSync(artifact.path, 'utf8');
    const parsed = parseGsdDecisions(markdown);

    if (parsed.decisions.length === 0) {
      updateImportRun.run({
        id: importRunId,
        status: 'failed',
        completed_at: new Date().toISOString(),
        summary: 'No decisions were imported from .gsd/DECISIONS.md.',
        warnings_json: JSON.stringify(parsed.warnings),
      });

      return {
        ok: false,
        projectId,
        artifactPath: artifact.path,
        importRunId,
        decisionsImported: 0,
        warnings: parsed.warnings,
      };
    }

    let importedCount = 0;
    const now = new Date().toISOString();

    for (const decision of parsed.decisions) {
      const existingDecision = getDecisionByProjectArtifactAndKey.get({
        project_id: projectId,
        source_artifact_id: artifact.id,
        external_key: decision.externalKey,
      });

      if (existingDecision) {
        updateDecision.run({
          id: existingDecision.id,
          scope: decision.scope,
          decision: decision.decision,
          choice: decision.choice,
          rationale: decision.rationale,
          revisable: decision.revisable,
          when_context: decision.whenContext,
          updated_at: now,
        });
      } else {
        insertDecision.run({
          project_id: projectId,
          external_key: decision.externalKey,
          scope: decision.scope,
          decision: decision.decision,
          choice: decision.choice,
          rationale: decision.rationale,
          revisable: decision.revisable,
          when_context: decision.whenContext,
          source_artifact_id: artifact.id,
          created_at: now,
          updated_at: now,
        });
      }

      const persistedDecision = getDecisionByProjectArtifactAndKey.get({
        project_id: projectId,
        source_artifact_id: artifact.id,
        external_key: decision.externalKey,
      });

      deleteEvidenceLinksForEntityAndSource.run({
        entity_type: 'decision',
        entity_id: persistedDecision.id,
        source_artifact_id: artifact.id,
      });

      insertEvidenceLink.run({
        entity_type: 'decision',
        entity_id: persistedDecision.id,
        source_artifact_id: artifact.id,
        excerpt: decision.excerpt,
        line_start: decision.lineStart,
        line_end: decision.lineEnd,
        confidence: 1.0,
        reason: 'Parsed from .gsd/DECISIONS.md decision entry',
        created_at: now,
      });

      importedCount += 1;
    }

    const parsedKeys = new Set(parsed.decisions.map((decision) => decision.externalKey));
    const existingDecisions = listDecisionsBySourceArtifactId.all({
      project_id: projectId,
      source_artifact_id: artifact.id,
    });

    for (const existingDecision of existingDecisions) {
      if (existingDecision.external_key && !parsedKeys.has(existingDecision.external_key)) {
        deleteEvidenceLinksForEntityAndSource.run({
          entity_type: 'decision',
          entity_id: existingDecision.id,
          source_artifact_id: artifact.id,
        });
        deleteDecisionById.run({ id: existingDecision.id });
      }
    }

    const finalStatus = parsed.warnings.length > 0 ? 'partial' : 'success';
    updateImportRun.run({
      id: importRunId,
      status: finalStatus,
      completed_at: new Date().toISOString(),
      summary: `Imported ${importedCount} decisions from .gsd/DECISIONS.md.`,
      warnings_json: JSON.stringify(parsed.warnings),
    });

    return {
      ok: true,
      projectId,
      artifactPath: artifact.path,
      importRunId,
      decisionsImported: importedCount,
      warnings: parsed.warnings,
    };
  } catch (error) {
    updateImportRun.run({
      id: importRunId,
      status: 'failed',
      completed_at: new Date().toISOString(),
      summary: error instanceof Error ? error.message : 'Unknown import failure',
      warnings_json: JSON.stringify([]),
    });
    throw error;
  }
}

function upsertProjectWithArtifacts(projectRoot) {
  const now = new Date().toISOString();
  const name = path.basename(projectRoot);
  const hasGit = exists(path.join(projectRoot, '.git')) ? 1 : 0;
  const repoType = hasGit ? 'git' : 'folder';
  const artifacts = detectArtifacts(projectRoot);
  const projectRecord = {
    name,
    slug: slugify(name),
    root_path: projectRoot,
    repo_type: repoType,
    project_type: detectProjectType(projectRoot),
    primary_language: detectPrimaryLanguage(projectRoot),
    framework: detectFramework(projectRoot),
    package_manager: detectPackageManager(projectRoot),
    has_git: hasGit,
    planning_status: derivePlanningStatus(artifacts),
    last_scanned_at: now,
    created_at: now,
    updated_at: now,
  };

  const existing = getProjectByRootPath.get(projectRoot);
  if (existing) {
    updateProject.run(projectRecord);
  } else {
    insertProject.run(projectRecord);
  }

  const project = getProjectByRootPath.get(projectRoot);
  for (const artifact of artifacts) {
    upsertArtifact.run({
      ...artifact,
      project_id: project.id,
    });
  }

  return {
    projectId: project.id,
    artifactCount: artifacts.length,
  };
}

function scanWorkspaceRoot(rootPath) {
  const normalizedRoot = path.resolve(rootPath);
  const startedAt = new Date().toISOString();
  const scanRunInfo = {
    root_path: normalizedRoot,
    status: 'running',
    projects_found: 0,
    artifacts_found: 0,
    summary: null,
    started_at: startedAt,
    completed_at: null,
  };
  const { lastInsertRowid } = insertScanRun.run(scanRunInfo);
  const scanRunId = Number(lastInsertRowid);

  let projectsFound = 0;
  let artifactsFound = 0;

  try {
    const entries = safeReadDir(normalizedRoot);

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      if (['node_modules', 'dist', 'build', '.next', 'venv', '.venv'].includes(entry.name)) continue;

      const projectRoot = path.join(normalizedRoot, entry.name);
      if (!isProjectCandidate(projectRoot)) continue;

      const result = upsertProjectWithArtifacts(projectRoot);
      projectsFound += 1;
      artifactsFound += result.artifactCount;
    }

    updateScanRun.run({
      id: scanRunId,
      status: 'success',
      projects_found: projectsFound,
      artifacts_found: artifactsFound,
      summary: `Scanned ${normalizedRoot}: found ${projectsFound} projects and ${artifactsFound} artifacts.`,
      completed_at: new Date().toISOString(),
    });

    return {
      id: scanRunId,
      rootPath: normalizedRoot,
      status: 'success',
      projectsFound,
      artifactsFound,
    };
  } catch (error) {
    updateScanRun.run({
      id: scanRunId,
      status: 'failed',
      projects_found: projectsFound,
      artifacts_found: artifactsFound,
      summary: error instanceof Error ? error.message : 'Unknown scan error',
      completed_at: new Date().toISOString(),
    });
    throw error;
  }
}

app.get('/api/tasks/:projectName', (req, res) => {
  try {
    const { projectName } = req.params;
    const legacyProject = getLegacyProjectByName.get(projectName.toLowerCase());

    if (!legacyProject) {
      return res.json([]);
    }

    const tasks = getLegacyTasksByProjectId.all(legacyProject.id);
    return res.json(tasks);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects', (_req, res) => {
  try {
    const projects = listProjects.all().map(serializeProjectRow);

    return res.json(projects);
  } catch (error) {
    console.error('Failed to list projects:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects/:id/artifacts', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const artifacts = listArtifactsByProjectId.all(validation.projectId).map((artifact) => ({
      id: artifact.id,
      projectId: artifact.project_id,
      artifactType: artifact.artifact_type,
      path: artifact.path,
      title: artifact.title,
      confidence: artifact.confidence,
      parseStatus: artifact.parse_status,
      lastSeenAt: artifact.last_seen_at,
      createdAt: artifact.created_at,
      updatedAt: artifact.updated_at,
    }));

    return res.json(artifacts);
  } catch (error) {
    console.error('Failed to list artifacts:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects/:id/milestones', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const milestones = listMilestonesByProjectId.all(validation.projectId).map(serializeMilestoneRow);
    return res.json(milestones);
  } catch (error) {
    console.error('Failed to list milestones:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects/:id/requirements', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const requirements = listRequirementsByProjectId.all(validation.projectId).map(serializeRequirementRow);
    return res.json(requirements);
  } catch (error) {
    console.error('Failed to list requirements:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects/:id/decisions', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const decisions = listDecisionsByProjectId.all(validation.projectId).map(serializeDecisionRow);
    return res.json(decisions);
  } catch (error) {
    console.error('Failed to list decisions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects/:id/import-runs', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const importRuns = listImportRunsByProjectId.all(validation.projectId).map(serializeImportRunRow);
    return res.json(importRuns);
  } catch (error) {
    console.error('Failed to list import runs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/projects/:id/import-gsd-project', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const result = importGsdProjectMilestones(validation.projectId);
    return res.json(result);
  } catch (error) {
    if (error?.code === 'ARTIFACT_NOT_FOUND' || error?.code === 'ARTIFACT_MISSING_ON_DISK') {
      return res.status(404).json({ error: error.message });
    }

    console.error('Failed to import .gsd/PROJECT.md milestones:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
});

app.post('/api/projects/:id/import-gsd-requirements', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const result = importGsdRequirements(validation.projectId);
    return res.json(result);
  } catch (error) {
    if (error?.code === 'ARTIFACT_NOT_FOUND' || error?.code === 'ARTIFACT_MISSING_ON_DISK') {
      return res.status(404).json({ error: error.message });
    }

    console.error('Failed to import .gsd/REQUIREMENTS.md requirements:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
});

app.post('/api/projects/:id/import-gsd-decisions', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const result = importGsdDecisions(validation.projectId);
    return res.json(result);
  } catch (error) {
    if (error?.code === 'ARTIFACT_NOT_FOUND' || error?.code === 'ARTIFACT_MISSING_ON_DISK') {
      return res.status(404).json({ error: error.message });
    }

    console.error('Failed to import .gsd/DECISIONS.md decisions:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
});

app.get('/api/projects/:id/plan', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const milestones = listMilestonesByProjectId.all(validation.projectId).map(serializeMilestoneRow);
    const slices = listSlicesByProjectId.all(validation.projectId).map(serializeSliceRow);
    const tasks = listPlanningTasksByProjectId.all(validation.projectId).map(serializePlanningTaskRow);
    const requirements = listRequirementsByProjectId.all(validation.projectId).map(serializeRequirementRow);
    const decisions = listDecisionsByProjectId.all(validation.projectId).map(serializeDecisionRow);
    const importRuns = listImportRunsByProjectId.all(validation.projectId).map(serializeImportRunRow);
    const latestImportRunsByArtifact = {
      milestones: importRuns.find((run) => run.artifactType === 'gsd_project') ?? null,
      requirements: importRuns.find((run) => run.artifactType === 'gsd_requirements') ?? null,
      decisions: importRuns.find((run) => run.artifactType === 'gsd_decisions') ?? null,
    };
    const continuity = computeContinuity(validation.project);
    const workflowState = computeWorkflowState({ milestones, requirements, decisions, continuity });
    const nextAction = computeNextAction({ milestones, requirements, decisions, workflowState, continuity });

    return res.json({
      project: serializeProjectRow(validation.project),
      milestones,
      slices,
      tasks,
      requirements,
      decisions,
      importRuns,
      latestImportRun: importRuns[0] ?? null,
      latestImportRunsByArtifact,
      workflowState,
      continuity,
      nextAction,
    });
  } catch (error) {
    console.error('Failed to build project plan snapshot:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/scan-runs', (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 10, 50));
    const scanRuns = listRecentScanRuns.all(limit);
    return res.json(scanRuns);
  } catch (error) {
    console.error('Failed to list scan runs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/scan', (req, res) => {
  try {
    const roots = Array.isArray(req.body?.roots) && req.body.roots.length > 0
      ? req.body.roots
      : DEFAULT_SCAN_ROOTS;

    const results = roots.map((root) => scanWorkspaceRoot(root));
    const totals = results.reduce((acc, result) => {
      acc.projectsFound += result.projectsFound;
      acc.artifactsFound += result.artifactsFound;
      return acc;
    }, { projectsFound: 0, artifactsFound: 0 });

    return res.json({
      ok: true,
      roots,
      scanRunIds: results.map((result) => result.id),
      projectsFound: totals.projectsFound,
      artifactsFound: totals.artifactsFound,
      results,
    });
  } catch (error) {
    console.error('Scan failed:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Scan failed',
    });
  }
});

app.listen(PORT, () => console.log(`Bridge active on http://localhost:${PORT}`));
