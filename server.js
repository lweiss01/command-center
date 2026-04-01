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

  CREATE TABLE IF NOT EXISTS bootstrap_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    component_id TEXT NOT NULL,
    action TEXT NOT NULL,
    stage TEXT NOT NULL,
    path TEXT,
    template_id TEXT,
    applied_at TEXT NOT NULL,
    source_gap TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_bootstrap_actions_project_id ON bootstrap_actions(project_id);
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

  CREATE TABLE IF NOT EXISTS scan_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    enabled INTEGER NOT NULL DEFAULT 1,
    recursive INTEGER NOT NULL DEFAULT 1,
    max_depth INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_scan_paths_enabled ON scan_paths(enabled);
`);

// ── Additive schema migrations (idempotent) ──────────────────────────────────
// proof_level on milestones: 'claimed' (status=done in ROADMAP) vs 'proven' (SUMMARY parsed + passed)
try { db.exec(`ALTER TABLE milestones ADD COLUMN proof_level TEXT NOT NULL DEFAULT 'claimed'`); } catch (_) { /* column already exists */ }

// ── Initialize default scan paths if table is empty ──────────────────────────
const scanPathCount = db.prepare('SELECT COUNT(*) as count FROM scan_paths').get();
if (scanPathCount.count === 0) {
  const now = new Date().toISOString();
  const insertDefaultPath = db.prepare(`
    INSERT INTO scan_paths (path, enabled, recursive, max_depth, created_at, updated_at)
    VALUES (?, 1, 1, NULL, ?, ?)
  `);
  DEFAULT_SCAN_ROOTS.forEach(root => {
    try {
      insertDefaultPath.run(root, now, now);
    } catch (_) { /* path might already exist */ }
  });
}
// source_artifact_id on proof evidence_links — already present on evidence_links, no migration needed

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
const getMilestoneByProjectAndKey = db.prepare(`
  SELECT *
  FROM milestones
  WHERE project_id = @project_id
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
const getRequirementByProjectAndKey = db.prepare(`
  SELECT *
  FROM requirements
  WHERE project_id = @project_id
    AND external_key = @external_key
  LIMIT 1
`);
const updateMilestoneProofLevel = db.prepare(`
  UPDATE milestones
  SET proof_level = @proof_level
  WHERE id = @id
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

// ── Scan paths ────────────────────────────────────────────────────────────────
const listEnabledScanPaths = db.prepare(`
  SELECT * FROM scan_paths WHERE enabled = 1 ORDER BY path ASC
`);
const listAllScanPaths = db.prepare(`
  SELECT * FROM scan_paths ORDER BY path ASC
`);
const getScanPathById = db.prepare(`
  SELECT * FROM scan_paths WHERE id = ?
`);
const insertScanPath = db.prepare(`
  INSERT INTO scan_paths (path, enabled, recursive, max_depth, created_at, updated_at)
  VALUES (@path, @enabled, @recursive, @max_depth, @created_at, @updated_at)
`);
const updateScanPath = db.prepare(`
  UPDATE scan_paths
  SET path = @path,
      enabled = @enabled,
      recursive = @recursive,
      max_depth = @max_depth,
      updated_at = @updated_at
  WHERE id = @id
`);
const deleteScanPath = db.prepare(`
  DELETE FROM scan_paths WHERE id = @id
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

  // Register .gsd/milestones/ dir as a structured artifact when present —
  // milestone directories are ground truth even when PROJECT.md is stale.
  const gsdMilestonesDir = path.join(projectRoot, '.gsd', 'milestones');
  if (exists(gsdMilestonesDir)) {
    artifacts.push({
      artifact_type: 'gsd_milestones_dir',
      path: gsdMilestonesDir,
      title: '.gsd/milestones',
      confidence: 1.0,
      parse_status: 'detected',
      last_seen_at: now,
      created_at: now,
      updated_at: now,
    });

    // Walk .gsd/milestones for SUMMARY files and register each as a gsd_summary artifact.
    // Pattern: M###-SUMMARY.md (milestone) and S##-SUMMARY.md (slice)
    function walkForSummaries(dir, depth = 0) {
      if (depth > 4) return; // milestones/M###/slices/S##/S##-SUMMARY.md = depth 3
      for (const entry of safeReadDir(dir)) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkForSummaries(entryPath, depth + 1);
        } else if (entry.isFile() && /^(M\d+|S\d+)-SUMMARY\.md$/.test(entry.name)) {
          artifacts.push({
            artifact_type: 'gsd_summary',
            path: entryPath,
            title: entry.name,
            confidence: 1.0,
            parse_status: 'detected',
            last_seen_at: now,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }
    walkForSummaries(gsdMilestonesDir);
  }

  return artifacts;
}

function derivePlanningStatus(artifacts) {
  const types = new Set(artifacts.map((artifact) => artifact.artifact_type));
  if (
    types.has('gsd_project') ||
    types.has('gsd_requirements') ||
    types.has('roadmap_md') ||
    types.has('milestones_md') ||
    types.has('gsd_milestones_dir')
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
    proofLevel: milestone.proof_level ?? 'claimed',
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
    mayBeProven: false, // overridden at plan route time via filesystem check
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

function computeWorkflowState({ milestones, requirements, decisions, continuity, readiness, latestImportRunsByArtifact, proofSummary }) {
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

  // Proof signal: +0.10 when at least one milestone has verified completion evidence
  if (proofSummary && proofSummary.proven > 0) {
    confidence += 0.10;
    evidence.push({ label: 'Proof', value: `${proofSummary.proven}/${proofSummary.total} milestones proven` });
    reasons.push(`${proofSummary.proven} milestone(s) have verified completion evidence.`);
  }

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
      execFileSync(cmd, ['--version'], { timeout: 2000, stdio: 'pipe', shell: true });
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

function computeBootstrapPlan({ workflowState, readiness, continuity, templateId = 'minimal', projectName = '' }) {
  const steps = [];

  // Select the most appropriate install command for the current platform.
  function selectInstallCommand(meta, platform) {
    const cmds = meta.installCommands ?? {};
    if (platform === 'win32')  return cmds.winget ?? cmds.npm ?? null;
    if (platform === 'darwin') return cmds.brew   ?? cmds.npm ?? null;
    return cmds.npm ?? null;
  }

  const addStep = ({ stage, componentId, sourceGap, title, rationale, risk, requiresApproval, instructions, installCommands }) => {
    steps.push({
      id: `bp-${steps.length + 1}`,
      stage,
      componentId,
      sourceGap,
      title,
      rationale,
      risk,
      requiresApproval,
      instructions: instructions ?? null,
      installCommands: installCommands ?? null,
      previewContent: getStepPreviewContent(componentId, projectName, templateId),
      templateId,
    });
  };

  const COMPONENT_META = {
    'gsd-dir':              { title: 'Initialize GSD directory',         rationale: 'The .gsd/ directory is the root of all GSD planning artifacts. Without it, no milestones, requirements, or decisions can be tracked.',          risk: 'low' },
    'holistic-dir':         { title: 'Initialize Holistic',              rationale: 'The .holistic/ directory stores session continuity, checkpoint history, and passive capture state. Without it, context is lost between sessions.', risk: 'low', instructions: 'holistic init' },
    'gsd-doc-project':      { title: 'Create PROJECT.md stub',           rationale: 'PROJECT.md is the living document describing what this project is right now. It is the first artifact agents read at session start.',             risk: 'low' },
    'gsd-doc-requirements': { title: 'Create REQUIREMENTS.md stub',      rationale: 'REQUIREMENTS.md tracks the requirement contract. Without it, there is no authoritative record of what the project must deliver.',               risk: 'low' },
    'gsd-doc-decisions':    { title: 'Create DECISIONS.md stub',         rationale: 'DECISIONS.md is an append-only register of architectural decisions. It prevents repeated debates about resolved choices.',                       risk: 'low' },
    'gsd-doc-knowledge':    { title: 'Create KNOWLEDGE.md stub',         rationale: 'KNOWLEDGE.md captures project-specific rules and lessons learned. It is the primary defence against agents repeating past mistakes.',            risk: 'low' },
    'gsd-doc-preferences':  { title: 'Create GSD preferences stub',      rationale: 'preferences.md signals a fully initialized GSD v2 setup and stores workflow preferences for this repo.',                                        risk: 'low' },
    'holistic-tool':        {
      title: 'Install Holistic CLI',
      rationale: 'The holistic CLI is required for checkpoint, handoff, and passive capture commands. Without it, session continuity is unavailable.',
      risk: 'medium',
      installCommands: {
        npm:    'npm install -g @holistic-ai/holistic',
        brew:   null,
        winget: null,
      },
    },
    'gsd-tool':             {
      title: 'Install GSD CLI',
      rationale: 'The gsd CLI is required for planning, auto-mode, and milestone execution. Without it, the full workflow stack is unavailable.',
      risk: 'medium',
      installCommands: {
        npm:    'npm install -g @anthropic/gsd',
        brew:   null,
        winget: null,
      },
    },
    'beads-dir':            { title: 'Initialize Beads',                 rationale: 'The .beads/ directory stores bead-based context for supported agents.',                                                                         risk: 'low' },
  };

  const components = readiness?.components ?? [];

  // Repo-local gaps first, machine-tool gaps second
  const repoLocalMissing = components.filter((c) => c.required && c.status === 'missing' && c.kind !== 'machine-tool');
  const machineMissing   = components.filter((c) => c.required && c.status === 'missing' && c.kind === 'machine-tool');

  for (const c of repoLocalMissing) {
    const meta = COMPONENT_META[c.id] ?? {};
    addStep({
      stage: 'repo-local',
      componentId: c.id,
      sourceGap: c.label,
      title: meta.title ?? `Bootstrap: ${c.label}`,
      rationale: meta.rationale ?? `${c.label} is missing and should be restored before machine-level setup.`,
      risk: meta.risk ?? 'medium',
      requiresApproval: true,
      instructions: meta.instructions ?? null,
    });
  }

  for (const c of machineMissing) {
    const meta = COMPONENT_META[c.id] ?? {};
    const resolvedInstructions = meta.installCommands
      ? selectInstallCommand(meta, process.platform)
      : (meta.instructions ?? null);
    addStep({
      stage: 'machine-level',
      componentId: c.id,
      sourceGap: c.label,
      title: meta.title ?? `Install: ${c.label}`,
      rationale: meta.rationale ?? `${c.label} is required for full workflow readiness and cannot be fixed from repo docs alone.`,
      risk: meta.risk ?? 'medium',
      requiresApproval: true,
      instructions: resolvedInstructions,
      installCommands: meta.installCommands ?? null,
    });
  }

  const repoLocalSteps = steps.filter((step) => step.stage === 'repo-local');
  const machineLevelSteps = steps.filter((step) => step.stage === 'machine-level');
  const orderedSteps = [...repoLocalSteps, ...machineLevelSteps];

  const stages = [
    {
      id: 'repo-local',
      title: 'Repo-local setup',
      stepCount: repoLocalSteps.length,
    },
    {
      id: 'machine-level',
      title: 'Machine-level setup',
      stepCount: machineLevelSteps.length,
    },
  ].filter((stage) => stage.stepCount > 0);

  let status = 'needs-bootstrap';
  if (orderedSteps.length === 0) {
    status = 'ready';
  } else if (workflowState?.phase === 'blocked' && continuity?.status === 'missing') {
    status = 'blocked';
  }

  return {
    status,
    stages,
    steps: orderedSteps,
    summary: {
      totalSteps: orderedSteps.length,
      repoLocalSteps: repoLocalSteps.length,
      machineLevelSteps: machineLevelSteps.length,
      hasBlockers: status === 'blocked',
    },
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

function computeUrgencyScore({ continuity, readiness, openLoops, workflowState, repoHealth }) {
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

  // Health-aware adjustment (replaces simple readiness-gap check):
  // Degraded repos need more attention; healthy repos less urgently compete for it.
  if (repoHealth) {
    if (repoHealth.grade === 'D') score += 0.20;
    else if (repoHealth.grade === 'C') score += 0.10;
    else if (repoHealth.grade === 'A') score -= 0.10;
  } else {
    // Fallback: original readiness-gap signal
    if (readiness.gaps.length > 0) score += 0.15;
  }

  return Math.min(1.0, Math.max(0, Math.round(score * 100) / 100));
}

// ── Repo Health Score ─────────────────────────────────────────────────────────
// Distinct from workflowState.confidence: confidence measures interpretation
// trustworthiness; health measures whether the repo is in good operating shape.
// All inputs are already-computed signals — no new probes.

function computeRepoHealth({ continuity, readiness, proofSummary, latestImportRunsByArtifact }) {
  const breakdown = [];

  // 1. Continuity status (+0 / +0.10 / +0.25)
  const contribContinuity = continuity.status === 'fresh' ? 0.25
    : continuity.status === 'stale' ? 0.10 : 0;
  breakdown.push({
    signal: 'continuity_status',
    label: 'Continuity',
    contribution: contribContinuity,
    maxContribution: 0.25,
    status: continuity.status === 'fresh' ? 'ok' : continuity.status === 'stale' ? 'warn' : 'missing',
    note: continuity.status === 'fresh' ? 'Fresh continuity'
      : continuity.status === 'stale' ? `Stale${continuity.ageHours != null ? ` (${Math.round(continuity.ageHours)}h ago)` : ''}`
      : 'No Holistic state found',
  });

  // 2. Checkpoint hygiene (+0 / +0.05 / +0.15)
  const hygieneVal = continuity.checkpointHygiene;
  const contribHygiene = hygieneVal === 'ok' ? 0.15 : hygieneVal === 'stale' ? 0.05 : 0;
  breakdown.push({
    signal: 'checkpoint_hygiene',
    label: 'Checkpoint hygiene',
    contribution: contribHygiene,
    maxContribution: 0.15,
    status: hygieneVal === 'ok' ? 'ok' : hygieneVal === 'stale' ? 'warn' : 'missing',
    note: hygieneVal === 'ok' ? 'Checkpoint recorded'
      : hygieneVal === 'stale' ? 'Checkpoint is stale'
      : 'No checkpoint recorded',
  });

  // 3. Readiness (+0 / +0.10 / +0.20)
  const contribReadiness = readiness.overallReadiness === 'ready' ? 0.20
    : readiness.overallReadiness === 'partial' ? 0.10 : 0;
  breakdown.push({
    signal: 'readiness',
    label: 'Readiness',
    contribution: contribReadiness,
    maxContribution: 0.20,
    status: readiness.overallReadiness === 'ready' ? 'ok'
      : readiness.overallReadiness === 'partial' ? 'warn' : 'danger',
    note: readiness.overallReadiness === 'ready' ? 'All required components present'
      : readiness.overallReadiness === 'partial' ? `${readiness.gaps.length} gap(s): ${readiness.gaps.slice(0, 2).join(', ')}${readiness.gaps.length > 2 ? ` +${readiness.gaps.length - 2} more` : ''}`
      : 'Required components missing',
  });

  // 4. Import recency (+0 / +0.10 / +0.20)
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  let mostRecentImportMs = null;
  if (latestImportRunsByArtifact) {
    const runs = [
      latestImportRunsByArtifact.milestones,
      latestImportRunsByArtifact.requirements,
      latestImportRunsByArtifact.decisions,
    ].filter(Boolean);
    for (const run of runs) {
      const ts = run.completedAt ? Date.parse(run.completedAt) : Number.NaN;
      if (!Number.isNaN(ts)) {
        if (mostRecentImportMs === null || ts > mostRecentImportMs) mostRecentImportMs = ts;
      }
    }
  }
  const importAgeDays = mostRecentImportMs != null ? (now - mostRecentImportMs) / msPerDay : null;
  const contribImport = importAgeDays == null ? 0
    : importAgeDays <= 7 ? 0.20
    : importAgeDays <= 30 ? 0.10 : 0;
  breakdown.push({
    signal: 'import_recency',
    label: 'Import recency',
    contribution: contribImport,
    maxContribution: 0.20,
    status: importAgeDays == null ? 'missing'
      : importAgeDays <= 7 ? 'ok'
      : importAgeDays <= 30 ? 'warn' : 'danger',
    note: importAgeDays == null ? 'Never imported'
      : importAgeDays <= 1 ? 'Imported today'
      : `${Math.round(importAgeDays)} days since last import`,
  });

  // 5. Proof coverage (+0.00–+0.20)
  const provenCount = proofSummary?.proven ?? 0;
  const totalCount = proofSummary?.total ?? 0;
  const proofRatio = totalCount > 0 ? provenCount / totalCount : 0;
  const contribProof = Math.round(proofRatio * 0.20 * 100) / 100;
  breakdown.push({
    signal: 'proof_coverage',
    label: 'Proof coverage',
    contribution: contribProof,
    maxContribution: 0.20,
    status: proofRatio >= 0.5 ? 'ok' : proofRatio > 0 ? 'warn' : totalCount === 0 ? 'missing' : 'danger',
    note: totalCount === 0 ? 'No milestones'
      : `${provenCount}/${totalCount} milestones proven`,
  });

  const rawScore = breakdown.reduce((sum, c) => sum + c.contribution, 0);
  const score = Math.min(1.0, Math.round(rawScore * 100) / 100);
  const grade = score >= 0.80 ? 'A' : score >= 0.60 ? 'B' : score >= 0.35 ? 'C' : 'D';

  return { score, grade, breakdown };
}

// ── Repair Queue ──────────────────────────────────────────────────────────────
// Returns a prioritized list of concrete fixes. Priority 1 = fix this first.
// Consumes already-computed signals — pure function, no side effects.

function computeRepairQueue({ continuity, readiness, proofSummary, latestImportRunsByArtifact, milestones }) {
  const queue = [];

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Determine import age
  let mostRecentImportMs = null;
  if (latestImportRunsByArtifact) {
    const runs = [
      latestImportRunsByArtifact.milestones,
      latestImportRunsByArtifact.requirements,
      latestImportRunsByArtifact.decisions,
    ].filter(Boolean);
    for (const run of runs) {
      const ts = run.completedAt ? Date.parse(run.completedAt) : Number.NaN;
      if (!Number.isNaN(ts)) {
        if (mostRecentImportMs === null || ts > mostRecentImportMs) mostRecentImportMs = ts;
      }
    }
  }
  const importAgeDays = mostRecentImportMs != null ? Math.round((now - mostRecentImportMs) / msPerDay) : null;

  // 1. Critical: missing continuity
  if (continuity.status === 'missing') {
    queue.push({
      priority: 1, severity: 'critical',
      action: 'Initialize continuity',
      rationale: 'No Holistic state found — resuming blind risks duplicating work or missing known blockers.',
      targetPanel: 'continuity',
    });
  }

  // 2. Critical: readiness missing
  if (readiness.overallReadiness === 'missing') {
    queue.push({
      priority: 2, severity: 'critical',
      action: 'Bootstrap workflow stack',
      rationale: 'Required workflow components are missing — cockpit recommendations are unreliable without them.',
      targetPanel: 'bootstrap',
    });
  }

  // 3. High: stale continuity + missing checkpoint
  if (continuity.status === 'stale' && continuity.checkpointHygiene === 'missing') {
    queue.push({
      priority: 3, severity: 'high',
      action: 'Run handoff to record session context',
      rationale: 'Continuity exists but no checkpoint has been recorded — context will be lost on next session.',
      targetPanel: 'continuity',
    });
  }

  // 4. High: readiness partial with required gaps
  if (readiness.overallReadiness === 'partial' && readiness.gaps.length > 0) {
    queue.push({
      priority: 4, severity: 'high',
      action: `Apply repo-local bootstrap steps (${readiness.gaps.length} gap${readiness.gaps.length !== 1 ? 's' : ''})`,
      rationale: `Required components missing: ${readiness.gaps.slice(0, 2).join(', ')}${readiness.gaps.length > 2 ? ` +${readiness.gaps.length - 2} more` : ''}.`,
      targetPanel: 'bootstrap',
    });
  }

  // 5. Medium: never imported
  if (importAgeDays === null) {
    queue.push({
      priority: 5, severity: 'medium',
      action: 'Import planning artifacts',
      rationale: 'No milestones, requirements, or decisions have been imported yet — cockpit interpretation is blind.',
      targetPanel: 'import',
    });
  }

  // 6. Medium: imports older than 14 days
  if (importAgeDays != null && importAgeDays > 14) {
    queue.push({
      priority: 6, severity: 'medium',
      action: 'Re-import planning artifacts',
      rationale: `Imports are ${importAgeDays} days old — cockpit interpretation may not reflect current repo state.`,
      targetPanel: 'import',
    });
  }

  // 7. Medium: milestones exist but none proven
  if (milestones.length > 0 && (proofSummary == null || proofSummary.proven === 0)) {
    queue.push({
      priority: 7, severity: 'medium',
      action: 'Run Import Summaries',
      rationale: `${milestones.length} milestone${milestones.length !== 1 ? 's' : ''} imported but none proven — run Import Summaries after completing work.`,
      targetPanel: 'proof',
    });
  }

  // 8. Low: stale continuity (hygiene ok or stale — not missing)
  if (continuity.status === 'stale' && continuity.checkpointHygiene !== 'missing') {
    queue.push({
      priority: 8, severity: 'low',
      action: 'Run a handoff before switching context',
      rationale: `Continuity is ${Math.round(continuity.ageHours ?? 0)}h old — a fresh handoff improves resume quality next session.`,
      targetPanel: 'continuity',
    });
  }

  return queue.sort((a, b) => a.priority - b.priority);
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

// Walk .gsd/milestones/M*/ directories to discover milestones not listed in PROJECT.md.
// Returns an array of { externalKey, title, description, status, source } objects.
function parseGsdMilestonesDir(projectRoot) {
  const milestonesDir = path.join(projectRoot, '.gsd', 'milestones');
  if (!exists(milestonesDir)) return [];

  const results = [];
  let entries;
  try { entries = fs.readdirSync(milestonesDir, { withFileTypes: true }); }
  catch (_) { return []; }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const keyMatch = entry.name.match(/^(M\d{3,})/);
    if (!keyMatch) continue;

    const externalKey = keyMatch[1];
    const milestoneDir = path.join(milestonesDir, entry.name);

    // Status: SUMMARY present = done, VALIDATION present = done, otherwise planned
    const hasSummary = exists(path.join(milestoneDir, `${externalKey}-SUMMARY.md`));
    const hasValidation = exists(path.join(milestoneDir, `${externalKey}-VALIDATION.md`));
    const status = (hasSummary || hasValidation) ? 'done' : 'planned';

    // Title: read from ROADMAP.md first line h1, fall back to key
    let title = externalKey;
    let description = null;
    const roadmapPath = path.join(milestoneDir, `${externalKey}-ROADMAP.md`);
    if (exists(roadmapPath)) {
      try {
        const lines = fs.readFileSync(roadmapPath, 'utf8').split(/\r?\n/);
        const h1 = lines.find(l => /^#\s+/.test(l));
        if (h1) {
          const h1title = h1.replace(/^#\s+/, '').trim();
          if (h1title) title = h1title;
        }
        // Vision line
        const visionIdx = lines.findIndex(l => /^##\s+Vision/i.test(l));
        if (visionIdx !== -1) {
          const visionLine = lines.slice(visionIdx + 1).find(l => l.trim().length > 0);
          if (visionLine) description = visionLine.trim();
        }
      } catch (_) { /* skip */ }
    }

    results.push({ externalKey, title, description, status, dirName: entry.name });
  }

  // Sort by key numerically so M007 < M008 etc.
  results.sort((a, b) => {
    const na = parseInt(a.externalKey.slice(1), 10);
    const nb = parseInt(b.externalKey.slice(1), 10);
    return na - nb;
  });

  return results;
}

// ── SUMMARY file parsers ──────────────────────────────────────────────────────

/**
 * Parse frontmatter from a SUMMARY.md file.
 * Returns { id, milestone, verificationResult, completedAt } — null for missing fields.
 */
function parseSummaryFrontmatter(content) {
  if (!content.startsWith('---')) return { id: null, milestone: null, verificationResult: null, completedAt: null };
  const end = content.indexOf('---', 3);
  if (end < 0) return { id: null, milestone: null, verificationResult: null, completedAt: null };
  const fm = content.slice(3, end);

  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  };

  return {
    id: get('id'),
    milestone: get('milestone'),
    verificationResult: get('verification_result'),
    completedAt: get('completed_at'),
  };
}

/**
 * Parse the "## Requirements Validated" body section from a SUMMARY.md file.
 * Returns Array<{ reqKey: string, proofText: string }>.
 */
function parseSummaryRequirementsValidated(content) {
  const sectionMatch = content.match(/##\s+Requirements\s+Validated\s*\n([\s\S]*?)(?=\n##\s|\n---\s*$|$)/i);
  if (!sectionMatch) return [];
  const section = sectionMatch[1];
  const results = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^-\s+(R\d+)\s+[—\-]+\s+(.+)$/);
    if (m) results.push({ reqKey: m[1], proofText: m[2].trim() });
  }
  return results;
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

    // --- Phase 1: PROJECT.md milestones ---
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

    // Stale cleanup: remove PROJECT.md-sourced milestones no longer in the doc
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

    // --- Phase 2: filesystem discovery from .gsd/milestones/M*/ ---
    const fsMilestones = parseGsdMilestonesDir(project.root_path);
    const fsWarnings = [];

    for (const fsMilestone of fsMilestones) {
      // Skip keys already handled from PROJECT.md — doc status wins for those
      if (parsedKeys.has(fsMilestone.externalKey)) {
        // But if filesystem says done and doc says planned, upgrade status
        const existing = getMilestoneByProjectAndKey.get({
          project_id: projectId,
          external_key: fsMilestone.externalKey,
        });
        if (existing && existing.status !== 'done' && fsMilestone.status === 'done') {
          updateMilestone.run({
            id: existing.id,
            title: existing.title,
            description: existing.description,
            status: 'done',
            origin: 'imported',
            confidence: 0.9,
            needs_review: 1,
            sort_order: existing.sort_order,
            updated_at: now,
          });
          fsWarnings.push(`${fsMilestone.externalKey}: PROJECT.md marks incomplete but SUMMARY found on disk — status upgraded to done (needs review)`);
        }
        continue;
      }

      // New milestone only known from filesystem
      const existing = getMilestoneByProjectAndKey.get({
        project_id: projectId,
        external_key: fsMilestone.externalKey,
      });

      if (existing) {
        updateMilestone.run({
          id: existing.id,
          title: fsMilestone.title,
          description: fsMilestone.description,
          status: fsMilestone.status,
          origin: 'filesystem',
          confidence: 0.95,
          needs_review: 0,
          sort_order: existing.sort_order,
          updated_at: now,
        });
      } else {
        insertMilestone.run({
          project_id: projectId,
          external_key: fsMilestone.externalKey,
          title: fsMilestone.title,
          description: fsMilestone.description,
          status: fsMilestone.status,
          origin: 'filesystem',
          confidence: 0.95,
          needs_review: 0,
          sort_order: 1000 + importedCount, // append after doc milestones
          source_artifact_id: null,
          created_at: now,
          updated_at: now,
        });
      }

      importedCount += 1;
    }

    const allWarnings = [...parsed.warnings, ...fsWarnings];
    const finalStatus = allWarnings.length > 0 ? 'partial' : 'success';
    updateImportRun.run({
      id: importRunId,
      status: finalStatus,
      completed_at: new Date().toISOString(),
      summary: `Imported ${importedCount} milestones (${parsed.milestones.length} from PROJECT.md, ${fsMilestones.length - parsed.milestones.filter(m => fsMilestones.some(f => f.externalKey === m.externalKey)).length} from filesystem).`,
      warnings_json: JSON.stringify(allWarnings),
    });

    return {
      ok: true,
      projectId,
      artifactPath: artifact.path,
      importRunId,
      milestonesImported: importedCount,
      warnings: allWarnings,
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

function importGsdSummaries(projectId) {
  const project = getProjectById.get(projectId);
  if (!project) throw new Error('Project not found');

  const artifacts = listArtifactsByProjectId.all(projectId).filter(a => a.artifact_type === 'gsd_summary');
  if (artifacts.length === 0) {
    return { ok: true, projectId, milestonesUpdated: 0, proofLinksWritten: 0, warnings: [] };
  }

  const startedAt = new Date().toISOString();
  const importRunResult = insertImportRun.run({
    project_id: projectId,
    status: 'running',
    strategy: 'gsd_summary',
    started_at: startedAt,
    completed_at: null,
    summary: null,
    warnings_json: null,
  });
  const importRunId = Number(importRunResult.lastInsertRowid);

  const warnings = [];
  let milestonesUpdated = 0;
  let proofLinksWritten = 0;

  try {
    for (const artifact of artifacts) {
      if (!exists(artifact.path)) {
        warnings.push(`File missing: ${artifact.path}`);
        continue;
      }
      const content = fs.readFileSync(artifact.path, 'utf8');
      const fm = parseSummaryFrontmatter(content);
      if (!fm.id) {
        warnings.push(`No id in frontmatter: ${artifact.title}`);
        continue;
      }

      const isSlice = /^S\d+$/.test(fm.id);
      const isMilestone = /^M\d+$/.test(fm.id);

      if (isSlice && fm.verificationResult === 'passed' && fm.milestone) {
        const mRow = getMilestoneByProjectAndKey.get({ project_id: projectId, external_key: fm.milestone });
        if (mRow && mRow.proof_level !== 'proven') {
           updateMilestoneProofLevel.run({ proof_level: 'proven', id: mRow.id });
           milestonesUpdated++;
        }

        const reqs = parseSummaryRequirementsValidated(content);
        for (const r of reqs) {
          const reqRow = getRequirementByProjectAndKey.get({ project_id: projectId, external_key: r.reqKey });
          if (reqRow) {
            deleteEvidenceLinksForEntityAndSource.run({ entity_type: 'requirement', entity_id: reqRow.id, source_artifact_id: artifact.id });
            insertEvidenceLink.run({
              entity_type: 'requirement',
              entity_id: reqRow.id,
              source_artifact_id: artifact.id,
              excerpt: r.proofText,
              line_start: null,
              line_end: null,
              confidence: 1.0,
              reason: 'requirements_validated',
              created_at: new Date().toISOString()
            });
            proofLinksWritten++;
          } else {
            warnings.push(`Requirement ${r.reqKey} validated in ${artifact.title} but not found in DB`);
          }
        }
      } else if (isMilestone) {
        const mRow = getMilestoneByProjectAndKey.get({ project_id: projectId, external_key: fm.id });
        if (mRow && mRow.proof_level !== 'proven') {
           updateMilestoneProofLevel.run({ proof_level: 'proven', id: mRow.id });
           milestonesUpdated++;
        }
      }
    }

    updateImportRun.run({
      id: importRunId,
      status: warnings.length > 0 ? 'completed_with_warnings' : 'completed',
      completed_at: new Date().toISOString(),
      summary: `Imported ${proofLinksWritten} proof links across ${milestonesUpdated} milestones.`,
      warnings_json: JSON.stringify(warnings),
    });

    return { ok: true, projectId, milestonesUpdated, proofLinksWritten, warnings };
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

function autoImportForProject(projectId) {
  const imported = [];
  const skipped = [];
  const warnings = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Get latest import runs per strategy to determine staleness
  const allRuns = listImportRunsByProjectId.all(projectId).map(serializeImportRunRow);
  const latestByStrategy = new Map();
  for (const run of allRuns) {
    if (!latestByStrategy.has(run.strategy)) latestByStrategy.set(run.strategy, run);
  }

  const isStale = (strategy) => {
    const run = latestByStrategy.get(strategy);
    if (!run || !run.completedAt) return true;
    const age = now - Date.parse(run.completedAt);
    return age > msPerDay; // stale if older than 24h
  };

  // Get artifacts for this project
  const artifacts = listArtifactsByProjectId.all(projectId);
  const hasType = (type) => artifacts.some(a => a.artifact_type === type);

  // gsd_project → milestones
  if (hasType('gsd_project')) {
    if (isStale('gsd_project')) {
      try {
        importGsdProjectMilestones(projectId);
        imported.push('milestones');
      } catch (e) {
        warnings.push(`milestones: ${e instanceof Error ? e.message : 'import failed'}`);
      }
    } else {
      skipped.push('milestones');
    }
  }

  // gsd_requirements → requirements
  if (hasType('gsd_requirements')) {
    if (isStale('gsd_requirements')) {
      try {
        importGsdRequirements(projectId);
        imported.push('requirements');
      } catch (e) {
        warnings.push(`requirements: ${e instanceof Error ? e.message : 'import failed'}`);
      }
    } else {
      skipped.push('requirements');
    }
  }

  // gsd_decisions → decisions
  if (hasType('gsd_decisions')) {
    if (isStale('gsd_decisions')) {
      try {
        importGsdDecisions(projectId);
        imported.push('decisions');
      } catch (e) {
        warnings.push(`decisions: ${e instanceof Error ? e.message : 'import failed'}`);
      }
    } else {
      skipped.push('decisions');
    }
  }

  return { imported, skipped, warnings };
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
  let autoImported = 0;
  let autoSkipped = 0;

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

      // Auto-import: populate planning data for projects that have GSD docs
      try {
        const autoImport = autoImportForProject(result.projectId);
        if (autoImport.imported.length > 0 || autoImport.warnings.length > 0) {
          console.log(`[scan/auto-import] project=${path.basename(projectRoot)} imported=[${autoImport.imported.join(',')}] skipped=[${autoImport.skipped.join(',')}] warnings=${autoImport.warnings.length}`);
        }
        autoImported += autoImport.imported.length;
        autoSkipped += autoImport.skipped.length;
      } catch (e) {
        console.warn(`[scan/auto-import] project=${path.basename(projectRoot)} error:`, e instanceof Error ? e.message : e);
      }
    }

    updateScanRun.run({
      id: scanRunId,
      status: 'success',
      projects_found: projectsFound,
      artifacts_found: artifactsFound,
      summary: `Scanned ${normalizedRoot}: found ${projectsFound} projects, ${artifactsFound} artifacts. Auto-imported ${autoImported} artifact class(es).`,
      completed_at: new Date().toISOString(),
    });

    return {
      id: scanRunId,
      rootPath: normalizedRoot,
      status: 'success',
      projectsFound,
      artifactsFound,
      autoImportSummary: { totalImported: autoImported, totalSkipped: autoSkipped },
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

app.post('/api/projects/:id/import-all', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const artifacts = listArtifactsByProjectId.all(validation.projectId);
    const hasType = (type) => artifacts.some(a => a.artifact_type === type);
    
    const results = { imported: [], warnings: [] };

    if (hasType('gsd_project')) {
      try {
        importGsdProjectMilestones(validation.projectId);
        results.imported.push('milestones');
      } catch (error) {
        results.warnings.push(`milestones: ${error instanceof Error ? error.message : 'failed'}`);
      }
    }

    if (hasType('gsd_requirements')) {
      try {
        importGsdRequirements(validation.projectId);
        results.imported.push('requirements');
      } catch (error) {
        results.warnings.push(`requirements: ${error instanceof Error ? error.message : 'failed'}`);
      }
    }

    if (hasType('gsd_decisions')) {
      try {
        importGsdDecisions(validation.projectId);
        results.imported.push('decisions');
      } catch (error) {
        results.warnings.push(`decisions: ${error instanceof Error ? error.message : 'failed'}`);
      }
    }

    return res.json({ ok: true, ...results });
  } catch (error) {
    console.error('Failed to import all artifacts:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
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

app.post('/api/projects/:id/import/summaries', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;
    const result = importGsdSummaries(validation.projectId);
    console.log(`[import/summaries] project=${validation.project.name} milestones=${result.milestonesUpdated} proof_links=${result.proofLinksWritten} warnings=${result.warnings.length}`);
    return res.json(result);
  } catch (error) {
    console.error('[import/summaries] Failed:', error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal Server Error' });
  }
});

// Stub file content for repo-local doc bootstrapping
// 'minimal' — single placeholder per section, zero assumptions
const BOOTSTRAP_STUBS_MINIMAL = {
  'gsd-doc-project':      (name) => `# ${name}\n\n<!-- Describe what this project is, its current state, and its goals. -->\n`,
  'gsd-doc-requirements': ()     => `# Requirements\n\n<!-- Track active, validated, deferred, and out-of-scope requirements here. -->\n`,
  'gsd-doc-decisions':    ()     => `# Decisions\n\n<!-- Append-only register of architectural and pattern decisions. -->\n`,
  'gsd-doc-knowledge':    ()     => `# Knowledge\n\n<!-- Append-only register of project-specific rules, patterns, and lessons learned. -->\n`,
  'gsd-doc-preferences':  ()     => `# Preferences\n\n<!-- GSD v2 workflow preferences for this repo. -->\n`,
};

// 'starter' — populated with example sections to guide initial authoring
const BOOTSTRAP_STUBS_STARTER = {
  'gsd-doc-project': (name) => [
    `# ${name}`,
    ``,
    `## What this project is`,
    `<!-- One paragraph: what does this project do and who is it for? -->`,
    ``,
    `## Current state`,
    `<!-- Active milestone, recent changes, and what is working right now. -->`,
    ``,
    `## Goals`,
    `<!-- What does a successful outcome look like? What are the constraints? -->`,
    ``,
  ].join('\n'),
  'gsd-doc-requirements': () => [
    `# Requirements`,
    ``,
    `<!-- Requirement contract. Move rows between sections as evidence accumulates. -->`,
    ``,
    `## Active`,
    `<!-- Requirements that are in scope and not yet validated. -->`,
    ``,
    `## Validated`,
    `<!-- Requirements proven by a completed slice or test. -->`,
    ``,
    `## Deferred`,
    `<!-- Requirements parked for a future milestone. -->`,
    ``,
    `## Out of Scope`,
    `<!-- Explicitly excluded. -->`,
    ``,
  ].join('\n'),
  'gsd-doc-decisions': () => [
    `# Decisions`,
    ``,
    `<!-- Append-only. Add rows as architectural or pattern decisions are made. -->`,
    `<!-- Format: ## D001: <title> | **Decided:** <date> | **Choice:** ... | **Rationale:** ... -->`,
    ``,
  ].join('\n'),
  'gsd-doc-knowledge': () => [
    `# Knowledge`,
    ``,
    `<!-- Append-only. Add entries when you discover a recurring issue, a non-obvious pattern,`,
    `     or a rule that future agents should follow. -->`,
    ``,
    `## Entry template`,
    `<!-- ## <Topic>`,
    `### <Specific finding>`,
    `<What to know and why it matters.> -->`,
    ``,
  ].join('\n'),
  'gsd-doc-preferences': () => [
    `# Preferences`,
    ``,
    `## GSD v2 workflow`,
    ``,
    `\`\`\`yaml`,
    `# unique_milestone_ids: false`,
    `# default_isolation: none`,
    `\`\`\``,
    ``,
  ].join('\n'),
};

// Keep backward-compat alias
const BOOTSTRAP_STUBS = BOOTSTRAP_STUBS_MINIMAL;

/** Returns the stub map for a given templateId ('minimal' | 'starter'). */
function getBootstrapStubs(templateId) {
  return templateId === 'starter' ? BOOTSTRAP_STUBS_STARTER : BOOTSTRAP_STUBS_MINIMAL;
}

/** Returns the preview content for a step given its componentId and template. */
function getStepPreviewContent(componentId, projectName, templateId) {
  const stubs = getBootstrapStubs(templateId);
  switch (componentId) {
    case 'gsd-doc-project':
    case 'gsd-doc-requirements':
    case 'gsd-doc-decisions':
    case 'gsd-doc-knowledge':
    case 'gsd-doc-preferences':
      return stubs[componentId] ? stubs[componentId](projectName) : null;
    case 'gsd-dir':
      return 'Creates the .gsd/ directory — the root of all GSD planning artifacts.';
    case 'holistic-dir':
      return 'Runs `holistic init` to create the .holistic/ directory with session continuity state.';
    default:
      return null;
  }
}

// ── Bootstrap preflight: safety check before apply ────────────────────────────

const BOOTSTRAP_TARGET_PATHS = (root) => ({
  'gsd-dir':              { path: path.join(root, '.gsd'),                       kind: 'dir'  },
  'holistic-dir':         { path: path.join(root, '.holistic'),                   kind: 'dir'  },
  'gsd-doc-project':      { path: path.join(root, '.gsd', 'PROJECT.md'),          kind: 'file' },
  'gsd-doc-requirements': { path: path.join(root, '.gsd', 'REQUIREMENTS.md'),     kind: 'file' },
  'gsd-doc-decisions':    { path: path.join(root, '.gsd', 'DECISIONS.md'),        kind: 'file' },
  'gsd-doc-knowledge':    { path: path.join(root, '.gsd', 'KNOWLEDGE.md'),        kind: 'file' },
  'gsd-doc-preferences':  { path: path.join(root, '.gsd', 'preferences.md'),      kind: 'file' },
});

app.get('/api/projects/:id/bootstrap/preflight', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const componentId = req.query.componentId;
    if (!componentId || typeof componentId !== 'string') {
      return res.status(400).json({ ok: false, error: 'componentId query param is required' });
    }

    const root = validation.project.root_path;
    const name = validation.project.name;

    // Resolve component
    const readiness = computeReadiness(validation.project);
    const component = readiness.components.find((c) => c.id === componentId);
    if (!component) {
      return res.status(404).json({ ok: false, error: `Unknown component: ${componentId}` });
    }

    // Machine-tool components cannot be preflight-checked
    if (component.kind === 'machine-tool') {
      return res.json({
        ok: true, componentId,
        wouldCreate: null, conflict: false,
        conflictDetail: 'Machine-level tools cannot be preflight-checked — use the instructions panel.',
        parentWritable: false, safe: false,
      });
    }

    const targets = BOOTSTRAP_TARGET_PATHS(root);
    const target = targets[componentId];

    if (!target) {
      return res.status(400).json({ ok: false, error: `No target path defined for component: ${componentId}` });
    }

    const targetExists = fs.existsSync(target.path);
    let conflict = false;
    let conflictDetail = null;

    if (targetExists) {
      conflict = true;
      const rel = path.relative(root, target.path).replace(/\\/g, '/');
      conflictDetail = target.kind === 'file'
        ? `File already exists at ${rel} — applying will overwrite it.`
        : `Directory already exists at ${rel} — applying will be a no-op (recursive mkdir).`;
    }

    // Check parent dir is writable
    const parentDir = path.dirname(target.path);
    let parentWritable = false;
    try {
      fs.accessSync(parentDir, fs.constants.W_OK);
      parentWritable = true;
    } catch {
      // Parent dir not writable or doesn't exist yet — that's ok for gsd-dir (root must be writable)
      // Try the root itself
      try {
        fs.accessSync(root, fs.constants.W_OK);
        parentWritable = true;
      } catch {
        parentWritable = false;
      }
    }

    const safe = !conflict && parentWritable;

    console.log(`[bootstrap/preflight] project=${name} component=${componentId} conflict=${conflict} parentWritable=${parentWritable}`);

    return res.json({
      ok: true, componentId,
      wouldCreate: target.path,
      conflict, conflictDetail,
      parentWritable, safe,
    });

  } catch (error) {
    console.error('[bootstrap/preflight] Failed:', error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Preflight failed' });
  }
});

// ── Bootstrap verify-tool: re-probe a machine-tool component after user installs it ──

app.get('/api/projects/:id/bootstrap/verify-tool', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const componentId = req.query.componentId;
    if (!componentId || typeof componentId !== 'string') {
      return res.status(400).json({ ok: false, error: 'componentId query param is required' });
    }

    const readiness = computeReadiness(validation.project);
    const component = readiness.components.find((c) => c.id === componentId);

    if (!component) {
      return res.status(404).json({ ok: false, error: `Unknown component: ${componentId}` });
    }

    if (component.kind !== 'machine-tool') {
      return res.status(400).json({ ok: false, error: 'verify-tool is only available for machine-tool components' });
    }

    // Re-probe: computeReadiness already ran the probe; re-run fresh without override cache.
    const freshReadiness = computeReadiness(validation.project);
    const freshComponent = freshReadiness.components.find((c) => c.id === componentId);
    const status = freshComponent?.status ?? 'missing';

    console.log(`[bootstrap/verify-tool] project=${validation.project.name} component=${componentId} result=${status}`);

    return res.json({ ok: true, componentId, status });
  } catch (error) {
    console.error('[bootstrap/verify-tool] Failed:', error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Verify failed' });
  }
});

app.post('/api/projects/:id/bootstrap/apply', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const { componentId, templateId } = req.body ?? {};
    if (!componentId || typeof componentId !== 'string') {
      return res.status(400).json({ ok: false, error: 'componentId is required' });
    }

    const root = validation.project.root_path;
    const name = validation.project.name;

    // Resolve the component from readiness to validate it exists and get its kind
    const readiness = computeReadiness(validation.project);
    const component = readiness.components.find((c) => c.id === componentId);

    if (!component) {
      return res.status(404).json({ ok: false, error: `Unknown component: ${componentId}` });
    }

    // Machine-tool components cannot be auto-applied — return instructions instead
    if (component.kind === 'machine-tool') {
      return res.status(400).json({
        ok: false,
        error: 'Machine-level tool installation cannot be applied automatically. Use the instructions panel.',
      });
    }

    // Already present — idempotent OK
    if (component.status === 'present') {
      return res.json({ ok: true, componentId, action: 'already-present', path: null });
    }

    let action;
    let resultPath;

    switch (componentId) {
      case 'gsd-dir': {
        const dir = path.join(root, '.gsd');
        fs.mkdirSync(dir, { recursive: true });
        action = 'created-directory';
        resultPath = dir;
        break;
      }

      case 'holistic-dir': {
        const holisticCmd = process.platform === 'win32' ? 'holistic.cmd' : 'holistic';
        execFileSync(holisticCmd, ['init'], { cwd: root, timeout: 30000, stdio: 'pipe', shell: true });
        action = 'ran-holistic-init';
        resultPath = path.join(root, '.holistic');
        break;
      }

      case 'gsd-doc-project':
      case 'gsd-doc-requirements':
      case 'gsd-doc-decisions':
      case 'gsd-doc-knowledge':
      case 'gsd-doc-preferences': {
        const docPaths = {
          'gsd-doc-project':      path.join(root, '.gsd', 'PROJECT.md'),
          'gsd-doc-requirements': path.join(root, '.gsd', 'REQUIREMENTS.md'),
          'gsd-doc-decisions':    path.join(root, '.gsd', 'DECISIONS.md'),
          'gsd-doc-knowledge':    path.join(root, '.gsd', 'KNOWLEDGE.md'),
          'gsd-doc-preferences':  path.join(root, '.gsd', 'preferences.md'),
        };
        const docPath = docPaths[componentId];
        const gsdDir = path.join(root, '.gsd');

        if (!fs.existsSync(gsdDir)) {
          fs.mkdirSync(gsdDir, { recursive: true });
        }

        const stubFn = getBootstrapStubs(templateId)[componentId];
        fs.writeFileSync(docPath, stubFn(name), 'utf8');
        action = 'created-stub-file';
        resultPath = docPath;
        break;
      }

      default:
        return res.status(400).json({ ok: false, error: `No apply action defined for component: ${componentId}` });
    }

    console.log(`[bootstrap/apply] project=${name} component=${componentId} action=${action} path=${resultPath}`);

    // Record audit entry
    db.prepare(`
      INSERT INTO bootstrap_actions (project_id, component_id, action, stage, path, template_id, applied_at, source_gap)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(validation.project.id, componentId, action, 'repo-local', resultPath ?? null, templateId ?? null, new Date().toISOString(), component.label ?? null);
    console.log(`[bootstrap/audit] recorded project=${name} component=${componentId} action=${action}`);

    return res.json({ ok: true, componentId, action, path: resultPath });

  } catch (error) {
    console.error('[bootstrap/apply] Failed:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Apply failed',
    });
  }
});

// ── Bootstrap audit trail + drift detection ──────────────────────────────────
app.get('/api/projects/:id/bootstrap/audit', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const rows = db.prepare(`
      SELECT id, component_id, action, stage, path, template_id, applied_at, source_gap
      FROM bootstrap_actions
      WHERE project_id = ?
      ORDER BY applied_at DESC
    `).all(validation.project.id);

    // Re-probe current readiness to detect drift
    const freshReadiness = computeReadiness(validation.project);
    const componentStatusMap = new Map(freshReadiness.components.map(c => [c.id, c.status]));

    const entries = rows.map(row => {
      const currentStatus = componentStatusMap.get(row.component_id) ?? 'unknown';
      const drift = currentStatus === 'missing';
      return {
        id: row.id,
        componentId: row.component_id,
        action: row.action,
        stage: row.stage,
        path: row.path,
        templateId: row.template_id,
        appliedAt: row.applied_at,
        sourceGap: row.source_gap,
        currentStatus,
        drift,
      };
    });

    const driftCount = entries.filter(e => e.drift).length;
    console.log(`[bootstrap/audit] project=${validation.project.name} entries=${entries.length} drift=${driftCount}`);
    return res.json({ entries, driftCount });
  } catch (error) {
    console.error('[bootstrap/audit] Failed:', error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Audit failed' });
  }
});

// ── Proof traceability endpoint ───────────────────────────────────────────────
app.get('/api/projects/:id/proof', (req, res) => {
  try {
    const validation = getValidatedProjectOrSend(req.params.id, res);
    if (!validation) return;

    const rows = db.prepare(`
      SELECT r.external_key AS reqKey, el.excerpt AS proofText, sa.title AS sourceTitle, el.created_at AS appliedAt
      FROM evidence_links el
      JOIN requirements r ON r.id = el.entity_id
      JOIN source_artifacts sa ON sa.id = el.source_artifact_id
      WHERE el.reason = 'requirements_validated'
        AND el.entity_type = 'requirement'
        AND r.project_id = ?
      ORDER BY r.external_key ASC, el.created_at DESC
    `).all(validation.project.id);

    return res.json({ entries: rows });
  } catch (error) {
    console.error('[proof] Failed:', error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Proof query failed' });
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

    // Annotate active requirements with mayBeProven: true if the primary owning slice
    // has a SUMMARY on disk — the doc is likely stale for those.
    const projectRoot = validation.project.root_path;
    for (const req of requirements) {
      if (req.status === 'active' && req.primaryOwner) {
        // primaryOwner format: "M002/S01" or "M002/S01, M003/S02" — check the first one
        const ownerMatch = req.primaryOwner.match(/^(M\d{3,})[/\\](S\d{2,})/);
        if (ownerMatch) {
          const [, mid, sid] = ownerMatch;
          const summaryPath = path.join(projectRoot, '.gsd', 'milestones', mid, 'slices', sid, `${sid}-SUMMARY.md`);
          if (exists(summaryPath)) req.mayBeProven = true;
        }
      }
    }
    const latestImportRunsByArtifact = {
      milestones: importRuns.find((run) => run.artifactType === 'gsd_project') ?? null,
      requirements: importRuns.find((run) => run.artifactType === 'gsd_requirements') ?? null,
      decisions: importRuns.find((run) => run.artifactType === 'gsd_decisions') ?? null,
    };
    const continuity = computeContinuity(validation.project);
    const readiness = computeReadiness(validation.project);

    // Proof summary: count proven vs claimed milestones for confidence signal
    const proofSummary = milestones.length > 0 ? {
      proven: milestones.filter(m => m.proofLevel === 'proven').length,
      claimed: milestones.filter(m => m.status === 'done' && m.proofLevel !== 'proven').length,
      total: milestones.length,
    } : null;

    const workflowState = computeWorkflowState({ milestones, requirements, decisions, continuity, readiness, latestImportRunsByArtifact, proofSummary });
    const nextAction = computeNextAction({ milestones, requirements, decisions, workflowState, continuity, readiness });
    const bootstrapTemplateId = req.query.templateId === 'starter' ? 'starter' : 'minimal';
    const bootstrapPlan = computeBootstrapPlan({ workflowState, readiness, continuity, templateId: bootstrapTemplateId, projectName: validation.project.name });
    const openLoops = computeOpenLoops({ milestones, requirements, decisions });
    const repoHealth = computeRepoHealth({ continuity, readiness, proofSummary, latestImportRunsByArtifact });
    const repairQueue = computeRepairQueue({ continuity, readiness, proofSummary, latestImportRunsByArtifact, milestones });

    // Lightweight drift count from audit log (no re-probe — just count missing components from last apply)
    const auditRows = db.prepare(`SELECT component_id FROM bootstrap_actions WHERE project_id = ? ORDER BY applied_at DESC`).all(validation.project.id);
    const appliedComponentIds = [...new Set(auditRows.map(r => r.component_id))];
    const componentStatusMap = new Map(readiness.components.map(c => [c.id, c.status]));
    const bootstrapDriftCount = appliedComponentIds.filter(id => componentStatusMap.get(id) === 'missing').length;

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
      bootstrapPlan: { ...bootstrapPlan, driftCount: bootstrapDriftCount },
      openLoops,
      proofSummary,
      repoHealth,
      repairQueue,
      platform: process.platform,
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
        execFileSync(cmd, ['--version'], { timeout: 2000, stdio: 'pipe', shell: true });
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

      // Compute proof summary from raw milestone rows (proof_level field)
      const proofSummary = milestones.length > 0 ? {
        proven: milestones.filter(m => m.proof_level === 'proven').length,
        total: milestones.length,
      } : null;

      const repoHealth = computeRepoHealth({ continuity, readiness, proofSummary, latestImportRunsByArtifact });
      const urgencyScore = computeUrgencyScore({ continuity, readiness, openLoops, workflowState, repoHealth });

      // Import age in days (derive from latestImportRunsByArtifact)
      const msPerDay = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const importRun = latestImportRunsByArtifact.milestones ?? latestImportRunsByArtifact.requirements ?? latestImportRunsByArtifact.decisions ?? null;
      const importAgeDays = importRun?.completedAt ? Math.round((now - Date.parse(importRun.completedAt)) / msPerDay) : null;

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
        healthScore: repoHealth.score,
        healthGrade: repoHealth.grade,
        proofCoverage: proofSummary,
        importAgeDays,
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

app.post('/api/projects/add', (req, res) => {
  try {
    const rawPath = req.body?.path;
    if (!rawPath || typeof rawPath !== 'string') {
      return res.status(400).json({ ok: false, error: 'path is required' });
    }

    const resolvedPath = path.resolve(rawPath.trim());

    if (!fs.existsSync(resolvedPath)) {
      return res.status(400).json({ ok: false, error: `Directory not found: ${resolvedPath}` });
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ ok: false, error: `Path is not a directory: ${resolvedPath}` });
    }

    if (!isProjectCandidate(resolvedPath) && !fs.existsSync(path.join(resolvedPath, '.git'))) {
      return res.status(400).json({ ok: false, error: `Not a recognizable project (no .git, package.json, pyproject.toml, or planning artifacts found): ${resolvedPath}` });
    }

    const result = upsertProjectWithArtifacts(resolvedPath);
    const autoImport = autoImportForProject(result.projectId);
    const project = getProjectById.get(result.projectId);

    console.log(`[project/add] path=${resolvedPath} projectId=${result.projectId} imported=[${autoImport.imported.join(',')}]`);

    return res.json({
      ok: true,
      project: serializeProjectRow(project),
      autoImport: { imported: autoImport.imported, skipped: autoImport.skipped, warnings: autoImport.warnings },
    });
  } catch (error) {
    console.error('[project/add] Failed:', error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Add failed' });
  }
});

app.post('/api/scan', (req, res) => {
  try {
    // Use provided roots, or fall back to enabled scan paths from DB, or DEFAULT_SCAN_ROOTS
    let roots;
    if (Array.isArray(req.body?.roots) && req.body.roots.length > 0) {
      roots = req.body.roots;
    } else {
      const enabledPaths = listEnabledScanPaths.all();
      roots = enabledPaths.length > 0
        ? enabledPaths.map(p => p.path)
        : DEFAULT_SCAN_ROOTS;
    }

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

// ── Scan paths management endpoints ──────────────────────────────────────────

app.get('/api/scan-paths', (_req, res) => {
  try {
    const paths = listAllScanPaths.all();
    return res.json({
      ok: true,
      paths: paths.map(p => ({
        id: p.id,
        path: p.path,
        enabled: Boolean(p.enabled),
        recursive: Boolean(p.recursive),
        maxDepth: p.max_depth,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (error) {
    console.error('[scan-paths] List failed:', error);
    return res.status(500).json({ ok: false, error: 'Failed to list scan paths' });
  }
});

// Normalize path for consistent comparison (convert forward slashes to backslashes on Windows)
function normalizePathForComparison(inputPath) {
  const normalized = path.normalize(inputPath.trim());
  // On Windows, convert all forward slashes to backslashes for consistent comparison
  return process.platform === 'win32' ? normalized.replace(/\//g, '\\') : normalized;
}

app.post('/api/scan-paths', (req, res) => {
  try {
    const { path: scanPath, enabled = true, recursive = true, maxDepth = null } = req.body;

    if (!scanPath || typeof scanPath !== 'string' || !scanPath.trim()) {
      return res.status(400).json({ ok: false, error: 'Path is required' });
    }

    const normalizedPath = normalizePathForComparison(scanPath);

    // Check if path already exists
    const existing = listAllScanPaths.all().find(p => normalizePathForComparison(p.path) === normalizedPath);
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Path already exists' });
    }

    const now = new Date().toISOString();
    const result = insertScanPath.run({
      path: normalizedPath,
      enabled: enabled ? 1 : 0,
      recursive: recursive ? 1 : 0,
      max_depth: maxDepth,
      created_at: now,
      updated_at: now,
    });

    const created = getScanPathById.get(result.lastInsertRowid);
    return res.json({
      ok: true,
      path: {
        id: created.id,
        path: created.path,
        enabled: Boolean(created.enabled),
        recursive: Boolean(created.recursive),
        maxDepth: created.max_depth,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      },
    });
  } catch (error) {
    console.error('[scan-paths] Add failed:', error);
    return res.status(500).json({ ok: false, error: 'Failed to add scan path' });
  }
});

app.put('/api/scan-paths/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid ID' });
    }

    const existing = getScanPathById.get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Scan path not found' });
    }

    const { path: scanPath, enabled, recursive, maxDepth } = req.body;
    const normalizedPath = scanPath ? path.normalize(scanPath.trim()) : existing.path;

    const now = new Date().toISOString();
    updateScanPath.run({
      id,
      path: normalizedPath,
      enabled: enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled,
      recursive: recursive !== undefined ? (recursive ? 1 : 0) : existing.recursive,
      max_depth: maxDepth !== undefined ? maxDepth : existing.max_depth,
      updated_at: now,
    });

    const updated = getScanPathById.get(id);
    return res.json({
      ok: true,
      path: {
        id: updated.id,
        path: updated.path,
        enabled: Boolean(updated.enabled),
        recursive: Boolean(updated.recursive),
        maxDepth: updated.max_depth,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error('[scan-paths] Update failed:', error);
    return res.status(500).json({ ok: false, error: 'Failed to update scan path' });
  }
});

app.delete('/api/scan-paths/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid ID' });
    }

    const existing = getScanPathById.get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Scan path not found' });
    }

    deleteScanPath.run({ id });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[scan-paths] Delete failed:', error);
    return res.status(500).json({ ok: false, error: 'Failed to delete scan path' });
  }
});

app.listen(PORT, () => console.log(`Bridge active on http://localhost:${PORT}`));
