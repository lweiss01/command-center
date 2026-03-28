import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

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

function computeWorkflowState({ milestones, requirements, decisions, continuity, readiness, latestImportRunsByArtifact }) {
  // evidence: explicit signals that produced the phase and confidence — never empty if confidence < 1
  const evidence = [];
  // reasons: human-readable explanations for the phase choice
  const reasons = [];

  // --- Gather evidence signals ---

  const hasMilestones = milestones.length > 0;
  const hasRequirements = requirements.length > 0;
  const hasDecisions = decisions.length > 0;
  const hasAnyArtifacts = hasMilestones || hasRequirements || hasDecisions;

  if (hasMilestones) {
    evidence.push({ label: 'Milestones', value: `${milestones.length} imported` });
  }
  if (hasRequirements) {
    evidence.push({ label: 'Requirements', value: `${requirements.length} imported` });
  }
  if (hasDecisions) {
    evidence.push({ label: 'Decisions', value: `${decisions.length} imported` });
  }

  // Import recency signals
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  let mostRecentImportAgeMs = Number.POSITIVE_INFINITY;

  if (latestImportRunsByArtifact) {
    const runs = [
      latestImportRunsByArtifact.milestones,
      latestImportRunsByArtifact.requirements,
      latestImportRunsByArtifact.decisions,
    ].filter(Boolean);
    for (const run of runs) {
      const ts = run.completedAt ? Date.parse(run.completedAt) : Number.NaN;
      if (!Number.isNaN(ts)) {
        const ageMs = now - ts;
        if (ageMs < mostRecentImportAgeMs) mostRecentImportAgeMs = ageMs;
      }
    }
  }

  const importIsRecent = mostRecentImportAgeMs <= 3 * msPerDay;
  const importIsStale = mostRecentImportAgeMs > 7 * msPerDay;

  if (Number.isFinite(mostRecentImportAgeMs)) {
    const ageDays = Math.round(mostRecentImportAgeMs / msPerDay);
    evidence.push({
      label: 'Last import',
      value: ageDays === 0 ? 'today' : ageDays === 1 ? '1 day ago' : `${ageDays} days ago`,
    });
  }

  // Continuity signal — reads from the new structured shape: status 'fresh'|'stale'|'missing'
  const continuityStatus = continuity?.status ?? 'missing';
  evidence.push({ label: 'Continuity', value: continuityStatus });

  // Readiness signal — overall workflow stack health
  if (readiness) {
    evidence.push({ label: 'Readiness', value: readiness.overallReadiness });
  }

  // --- Determine phase ---

  let phase;

  if (!hasAnyArtifacts) {
    phase = 'no-data';
    reasons.push('No structured planning artifacts have been imported yet.');
  } else if (hasMilestones && !hasRequirements && !hasDecisions) {
    // Only milestones — check if there's real active work
    if (importIsRecent && continuityStatus === 'fresh') {
      phase = 'active';
      reasons.push('Milestones imported with recent activity and fresh continuity.');
    } else {
      phase = 'import-only';
      reasons.push('Only milestones imported — requirements and decisions are still missing.');
    }
  } else if (hasAnyArtifacts) {
    if (importIsStale && continuityStatus !== 'fresh') {
      phase = 'stalled';
      reasons.push('Imports are stale and continuity is not fresh — no recent activity detected.');
    } else if (continuityStatus !== 'fresh' && !importIsRecent) {
      phase = 'stalled';
      reasons.push('Continuity is not fresh and imports are not recent — workflow may be paused.');
    } else {
      phase = 'active';
      reasons.push('Structured artifacts are present with acceptable recency.');
    }
  } else {
    phase = 'no-data';
    reasons.push('Insufficient signals to determine workflow phase.');
  }

  // Readiness override: if workflow stack is missing and phase would be 'active', force 'blocked'.
  // Also add gap reasons whenever the stack is incomplete.
  if (readiness) {
    if (readiness.overallReadiness !== 'ready' && readiness.gaps.length > 0) {
      reasons.push(
        `Workflow stack is ${readiness.overallReadiness} — ${readiness.gaps.length} component(s) missing: ${readiness.gaps.join(', ')}.`
      );
    }
    if (readiness.overallReadiness === 'missing' && phase === 'active') {
      phase = 'blocked';
    }
  }

  // --- Compute confidence (0-1) ---
  // Start at 0, add points for each positive signal, subtract for negatives.
  // No magic weights — each signal contributes a fixed increment.

  let confidence = 0;

  // Artifact coverage: up to 0.45
  if (hasMilestones) confidence += 0.15;
  if (hasRequirements) confidence += 0.20;
  if (hasDecisions) confidence += 0.10;

  // Import recency: up to 0.25
  if (importIsRecent) {
    confidence += 0.25;
  } else if (!importIsStale) {
    confidence += 0.10;
  }
  // stale import: +0

  // Continuity freshness: up to 0.30
  // fresh → full +0.30, stale → partial +0.15, missing → +0
  if (continuityStatus === 'fresh') {
    confidence += 0.30;
  } else if (continuityStatus === 'stale') {
    confidence += 0.15;
  }
  // missing continuity: +0

  // Cap and round to 2 decimal places
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  // Explain low confidence
  if (confidence < 1) {
    if (!hasMilestones) reasons.push('Milestone data is missing — confidence is reduced.');
    if (!hasRequirements) reasons.push('Requirements are missing — confidence is reduced.');
    if (!hasDecisions) reasons.push('Decision log is missing — confidence is reduced.');
    if (importIsStale) reasons.push('Imports are more than 7 days old — recency confidence is low.');
    if (!importIsRecent && !importIsStale) reasons.push('Imports are aging (3–7 days old).');
    if (continuityStatus === 'missing') reasons.push('Continuity is missing — no Holistic state found, freshness confidence is zero.');
    if (continuityStatus === 'stale') reasons.push('Continuity is stale — freshness confidence is partial.');
  }

  return { phase, confidence, reasons, evidence };
}

function computeContinuity(project) {
  const holisticStatePath = path.join(project.root_path, '.holistic', 'state.json');

  // No Holistic state file present — continuity is entirely unknown.
  if (!fs.existsSync(holisticStatePath)) {
    const handoffCommand = process.platform === 'win32'
      ? '.holistic\\system\\holistic.cmd handoff'
      : './.holistic/system/holistic handoff';
    return {
      status: 'missing',
      freshAt: null,
      ageHours: null,
      latestWork: null,
      checkpointHygiene: 'missing',
      hygieneNote: 'No repo-local Holistic state detected.',
      checkpointCount: null,
      lastCheckpointReason: null,
      handoffCommand,
    };
  }

  try {
    const holisticState = JSON.parse(fs.readFileSync(holisticStatePath, 'utf8'));

    // Resolve the timestamp: prefer the active session's updatedAt, fall back to top-level.
    const activeSession = holisticState?.activeSession ?? null;
    const updatedAt = activeSession?.updatedAt ?? holisticState?.updatedAt ?? null;
    const updatedAtMs = updatedAt ? Date.parse(updatedAt) : Number.NaN;
    const ageMs = Number.isNaN(updatedAtMs) ? Number.POSITIVE_INFINITY : Date.now() - updatedAtMs;
    const ageHours = Number.isFinite(ageMs) ? Math.round(ageMs / (60 * 60 * 1000) * 10) / 10 : null;

    // status: fresh ≤ 6 h, stale > 6 h (or no parsable timestamp).
    let status = 'stale';
    if (ageMs <= 6 * 60 * 60 * 1000) {
      status = 'fresh';
    }

    // freshAt: human-readable ISO string of the last update, or null.
    const freshAt = updatedAt ?? null;

    // latestWork: best single-line summary of what was last worked on.
    // Prefer resumeRecap[0] — it's an agent-composed sentence that better captures
    // the current focus than raw currentGoal.
    let latestWork = null;
    if (activeSession?.resumeRecap?.[0]) {
      latestWork = activeSession.resumeRecap[0];
    } else if (activeSession?.currentGoal) {
      latestWork = activeSession.currentGoal;
    } else if (activeSession?.latestStatus) {
      latestWork = activeSession.latestStatus;
    } else if (holisticState?.lastSummary) {
      latestWork = holisticState.lastSummary;
    }

    // checkpointHygiene: does the state contain a usable checkpoint/handoff record?
    // 'ok'     — a checkpoint/handoff was written recently (within 24 h)
    // 'stale'  — a checkpoint exists but is older than 24 h
    // 'missing'— no checkpoint information present
    //
    // Key-path resolution (in priority order):
    //   1. holisticState.passiveCapture?.lastCheckpointAt  — explicit passive-capture checkpoint
    //   2. holisticState.lastAutoCheckpoint                — most recent auto-checkpoint timestamp
    // The old top-level keys (lastCheckpointAt, lastHandoffAt) do not exist in state.json.
    let checkpointHygiene = 'missing';
    let hygieneNote = null;

    const checkpointAt =
      holisticState?.passiveCapture?.lastCheckpointAt ??
      holisticState?.lastAutoCheckpoint ??
      null;

    if (checkpointAt) {
      const cpAgeMs = Date.now() - Date.parse(checkpointAt);
      if (cpAgeMs <= 24 * 60 * 60 * 1000) {
        checkpointHygiene = 'ok';
        hygieneNote = `Last checkpoint recorded ${Math.round(cpAgeMs / (60 * 60 * 1000) * 10) / 10} h ago.`;
      } else {
        checkpointHygiene = 'stale';
        hygieneNote = `Last checkpoint is ${Math.round(cpAgeMs / (24 * 60 * 60 * 1000) * 10) / 10} days old — consider running a handoff.`;
      }
    } else if (status === 'fresh') {
      // State is fresh but no checkpoint timestamp — treat as stale, not missing.
      checkpointHygiene = 'stale';
      hygieneNote = 'No explicit checkpoint timestamp found in Holistic state.';
    } else {
      hygieneNote = 'No checkpoint or handoff record found in Holistic state.';
    }

    // Enrich with session-level checkpoint quality signals.
    const checkpointCount = activeSession?.checkpointCount ?? null;
    const lastCheckpointReason = activeSession?.lastCheckpointReason ?? null;

    // Platform-appropriate handoff command for the hygiene callout.
    const handoffCommand = process.platform === 'win32'
      ? '.holistic\\system\\holistic.cmd handoff'
      : './.holistic/system/holistic handoff';

    return {
      status,
      freshAt,
      ageHours,
      latestWork,
      checkpointHygiene,
      hygieneNote,
      checkpointCount,
      lastCheckpointReason,
      handoffCommand,
    };
  } catch (error) {
    console.warn(`Failed to read Holistic state for ${project.root_path}:`, error);
    const handoffCommand = process.platform === 'win32'
      ? '.holistic\\system\\holistic.cmd handoff'
      : './.holistic/system/holistic handoff';
    return {
      status: 'stale',
      freshAt: null,
      ageHours: null,
      latestWork: null,
      checkpointHygiene: 'missing',
      hygieneNote: 'Holistic state file exists but could not be parsed.',
      checkpointCount: null,
      lastCheckpointReason: null,
      handoffCommand,
    };
  }
}

function computeReadiness(project, toolOverrides) {
  const root = project.root_path;

  // Helper: call a tool binary and return 'present' if it exits 0, else 'missing'
  function toolStatus(cmd) {
    try {
      execFileSync(cmd, ['--version'], { timeout: 2000, stdio: 'pipe' });
      return 'present';
    } catch (_err) {
      return 'missing';
    }
  }

  const gsdCmd = process.platform === 'win32' ? 'gsd.cmd' : 'gsd';
  const holisticCmd = process.platform === 'win32' ? 'holistic.cmd' : 'holistic';

  const components = [
    {
      id: 'gsd-dir',
      label: 'GSD',
      kind: 'repo-dir',
      status: fs.existsSync(path.join(root, '.gsd')) ? 'present' : 'missing',
      note: null,
      required: true,
    },
    {
      id: 'gsd-doc-project',
      label: 'GSD project doc',
      kind: 'repo-doc',
      status: fs.existsSync(path.join(root, '.gsd', 'PROJECT.md')) ? 'present' : 'missing',
      note: null,
      required: true,
    },
    {
      id: 'gsd-doc-preferences',
      label: 'GSD v2 workflow',
      kind: 'repo-doc',
      status: fs.existsSync(path.join(root, '.gsd', 'preferences.md')) ? 'present' : 'missing',
      note: 'Indicates fully initialized v2 setup',
      required: false,
    },
    {
      id: 'gsd-doc-requirements',
      label: 'GSD requirements',
      kind: 'repo-doc',
      status: fs.existsSync(path.join(root, '.gsd', 'REQUIREMENTS.md')) ? 'present' : 'missing',
      note: null,
      required: false,
    },
    {
      id: 'gsd-doc-decisions',
      label: 'GSD decisions',
      kind: 'repo-doc',
      status: fs.existsSync(path.join(root, '.gsd', 'DECISIONS.md')) ? 'present' : 'missing',
      note: null,
      required: false,
    },
    {
      id: 'gsd-doc-knowledge',
      label: 'GSD knowledge',
      kind: 'repo-doc',
      status: fs.existsSync(path.join(root, '.gsd', 'KNOWLEDGE.md')) ? 'present' : 'missing',
      note: null,
      required: false,
    },
    {
      id: 'holistic-dir',
      label: 'Holistic (repo)',
      kind: 'repo-dir',
      status: fs.existsSync(path.join(root, '.holistic')) ? 'present' : 'missing',
      note: null,
      required: true,
    },
    {
      id: 'holistic-tool',
      label: 'Holistic (tool)',
      kind: 'machine-tool',
      status: toolOverrides ? toolOverrides.holisticStatus : toolStatus(holisticCmd),
      note: null,
      required: true,
    },
    {
      id: 'gsd-tool',
      label: 'GSD (tool)',
      kind: 'machine-tool',
      status: toolOverrides ? toolOverrides.gsdStatus : toolStatus(gsdCmd),
      note: null,
      required: true,
    },
    {
      id: 'beads-dir',
      label: 'Beads',
      kind: 'repo-dir',
      status: fs.existsSync(path.join(root, '.beads')) ? 'present' : 'missing',
      note: null,
      required: false,
    },
  ];

  const gaps = components.filter((c) => c.required && c.status === 'missing').map((c) => c.label);

  const requiredComponents = components.filter((c) => c.required);
  const allRequiredPresent = requiredComponents.every((c) => c.status === 'present');
  const noRequiredPresent = requiredComponents.every((c) => c.status === 'missing');

  let overallReadiness;
  if (noRequiredPresent) {
    overallReadiness = 'missing';
  } else if (allRequiredPresent) {
    overallReadiness = 'ready';
  } else {
    overallReadiness = 'partial';
  }

  return { overallReadiness, components, gaps };
}

function computeNextAction({ milestones, requirements, decisions, workflowState, continuity, readiness }) {
  const hasStructuredArtifacts = milestones.length > 0 || requirements.length > 0 || decisions.length > 0;

  // Readiness guard: missing stack is the hardest blocker — check before continuity.
  if (readiness?.overallReadiness === 'missing') {
    return {
      action: 'Bootstrap the workflow stack before continuing.',
      rationale:
        'Critical workflow components are absent: ' + readiness.gaps.join(', ') + '.',
      blockers: readiness.gaps,
    };
  }

  if (continuity?.status === 'missing') {
    return {
      action: 'Refresh continuity before continuing.',
      rationale:
        'Continuity is missing — no Holistic state found in this repo. Resuming without context risks duplicating work or missing known blockers.',
      blockers: ['Repo continuity is missing — no Holistic state found in this repo.'],
    };
  }

  if (continuity?.status === 'stale' && continuity?.checkpointHygiene === 'missing') {
    // Stale session AND no checkpoint record at all — hard blocker.
    return {
      action: 'Refresh continuity before continuing.',
      rationale:
        'Continuity is stale and no checkpoint or handoff record was found. Resuming without any context anchor risks repeating already-done work or missing known blockers.',
      blockers: [
        `Repo continuity is stale (last activity ${continuity.ageHours != null ? Math.round(continuity.ageHours) + 'h ago' : 'unknown'}) with no checkpoint record — run a handoff before resuming.`,
      ],
    };
  }

  // Stale session but hygiene is 'ok' or 'stale' (a checkpoint exists) — soft reminder only, not a blocker.
  // The path is still clear; the hygiene callout in the UI covers the reminder.

  if (!hasStructuredArtifacts) {
    return {
      action: 'Import planning artifacts.',
      rationale:
        'No structured planning artifacts have been imported yet, so the cockpit cannot provide phase-aware guidance until repo docs are loaded.',
      blockers: ['No milestones, requirements, or decisions have been imported into the cockpit.'],
    };
  }

  if (milestones.length > 0 && requirements.length === 0) {
    return {
      action: 'Import requirements for fuller planning coverage.',
      rationale:
        'Milestones are present but requirements are missing, leaving the canonical plan incomplete and phase confidence lower than it could be.',
      blockers: ['Requirements are missing — only milestones are present.'],
    };
  }

  if (workflowState?.phase === 'no-data' || workflowState?.phase === 'import-only') {
    return {
      action: 'Import more planning artifacts to build workflow confidence.',
      rationale:
        'The repo has minimal structured planning data — adding requirements, decisions, or detailed milestone entries will raise phase confidence above the current floor.',
      blockers: [],
    };
  }

  const defaultBlockers = [];
  // Partial readiness: gaps are soft warnings, append to blockers.
  if (readiness?.overallReadiness === 'partial' && readiness.gaps.length > 0) {
    defaultBlockers.push(...readiness.gaps);
  }

  return {
    action: 'Review the current plan and continue execution.',
    rationale:
      'The repo has structured planning context and fresh continuity — the path is clear to advance the active work deliberately.',
    blockers: defaultBlockers,
  };
}

function computeOpenLoops({ milestones, requirements, decisions }) {
  const nextMilestone = milestones.find((m) => m.status !== 'done') ?? null;

  const blockedMilestones = milestones
    .filter((m) => m.status === 'blocked')
    .map((m) => ({ key: m.externalKey, title: m.title, status: m.status }));

  const unresolvedRequirements = requirements
    .filter((r) => r.status === 'active' && r.validation !== 'validated')
    .map((r) => ({ key: r.externalKey, title: r.title, owner: r.primaryOwner ?? null }));

  const deferredItems = requirements
    .filter((r) => r.status === 'deferred')
    .map((r) => ({ key: r.externalKey, title: r.title }));

  const revisableDecisions = decisions
    .filter((d) => d.revisable && d.revisable.toLowerCase().startsWith('yes'))
    .map((d) => ({ key: d.externalKey, scope: d.scope ?? null, decision: d.decision }));

  const summary = {
    unresolvedCount: unresolvedRequirements.length,
    pendingMilestoneCount: milestones.filter((m) => m.status !== 'done').length,
    blockedCount: blockedMilestones.length,
    deferredCount: deferredItems.length,
  };

  return {
    nextMilestone,
    blockedMilestones,
    unresolvedRequirements,
    deferredItems,
    revisableDecisions,
    summary,
  };
}

function computeUrgencyScore({ continuity, readiness, openLoops, workflowState }) {
  let score = 0;

  // +0.40 if actively worked (fresh continuity)
  if (continuity.status === 'fresh') score += 0.40;

  // +0.25 if there are unresolved requirements
  if (openLoops.summary.unresolvedCount > 0) score += 0.25;

  // +0.20 if abandoned mid-flight (stalled or no-data, but continuity present)
  if (
    (workflowState.phase === 'stalled' || workflowState.phase === 'no-data') &&
    continuity.status !== 'missing'
  ) {
    score += 0.20;
  }

  // +0.15 if the workflow stack has gaps
  if (readiness.gaps.length > 0) score += 0.15;

  return Math.min(1.0, Math.round(score * 100) / 100);
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
    const readiness = computeReadiness(validation.project);
    const workflowState = computeWorkflowState({ milestones, requirements, decisions, continuity, readiness, latestImportRunsByArtifact });
    const nextAction = computeNextAction({ milestones, requirements, decisions, workflowState, continuity, readiness });
    const openLoops = computeOpenLoops({ milestones, requirements, decisions });

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
      readiness,
      nextAction,
      openLoops,
    });
  } catch (error) {
    console.error('Failed to build project plan snapshot:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/portfolio', (_req, res) => {
  try {
    // Probe tool availability once — reused for all projects to avoid N execFileSync calls.
    const gsdCmd = process.platform === 'win32' ? 'gsd.cmd' : 'gsd';
    const holisticCmd = process.platform === 'win32' ? 'holistic.cmd' : 'holistic';

    function probeToolStatus(cmd) {
      try {
        execFileSync(cmd, ['--version'], { timeout: 2000, stdio: 'pipe' });
        return 'present';
      } catch (_err) {
        return 'missing';
      }
    }

    const holisticToolStatus = probeToolStatus(holisticCmd);
    const gsdToolStatus = probeToolStatus(gsdCmd);
    const toolOverrides = { holisticStatus: holisticToolStatus, gsdStatus: gsdToolStatus };

    const projects = listProjects.all().map(serializeProjectRow);

    const entries = projects.map((project) => {
      const milestones = listMilestonesByProjectId.all(project.id).map(serializeMilestoneRow);
      const requirements = listRequirementsByProjectId.all(project.id).map(serializeRequirementRow);
      const decisions = listDecisionsByProjectId.all(project.id).map(serializeDecisionRow);
      const importRuns = listImportRunsByProjectId.all(project.id).map(serializeImportRunRow);

      const latestImportRunsByArtifact = {
        milestones: importRuns.find((run) => run.artifactType === 'gsd_project') ?? null,
        requirements: importRuns.find((run) => run.artifactType === 'gsd_requirements') ?? null,
        decisions: importRuns.find((run) => run.artifactType === 'gsd_decisions') ?? null,
      };

      // getProjectById includes artifact_count; use raw project row from listProjects which already
      // has that column. We need the root_path for computeContinuity/computeReadiness — rebuild
      // the minimal shape expected by those functions.
      const projectForCompute = { id: project.id, root_path: project.rootPath, name: project.name };

      const continuity = computeContinuity(projectForCompute);
      const readiness = computeReadiness(projectForCompute, toolOverrides);
      const workflowState = computeWorkflowState({ milestones, requirements, decisions, continuity, readiness, latestImportRunsByArtifact });
      const nextAction = computeNextAction({ milestones, requirements, decisions, workflowState, continuity, readiness });
      const openLoops = computeOpenLoops({ milestones, requirements, decisions });
      const urgencyScore = computeUrgencyScore({ continuity, readiness, openLoops, workflowState });

      // First non-empty line of nextAction.action
      const nextActionLabel = (nextAction.action ?? '').split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';

      return {
        project,
        workflowPhase: workflowState.phase,
        workflowConfidence: workflowState.confidence,
        continuityStatus: continuity.status,
        continuityAgeHours: continuity.ageHours,
        checkpointHygiene: continuity.checkpointHygiene,
        overallReadiness: readiness.overallReadiness,
        readinessGaps: readiness.gaps,
        unresolvedCount: openLoops.summary.unresolvedCount,
        pendingMilestoneCount: openLoops.summary.pendingMilestoneCount,
        blockedCount: openLoops.summary.blockedCount,
        nextActionLabel,
        urgencyScore,
      };
    });

    entries.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return res.json(entries);
  } catch (error) {
    console.error('Failed to build portfolio snapshot:', error);
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
