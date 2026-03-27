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
const insertEvidenceLink = db.prepare(`
  INSERT INTO evidence_links (
    entity_type, entity_id, source_artifact_id, excerpt, line_start, line_end, confidence, reason, created_at
  ) VALUES (
    @entity_type, @entity_id, @source_artifact_id, @excerpt, @line_start, @line_end, @confidence, @reason, @created_at
  )
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
    startedAt: importRun.started_at,
    completedAt: importRun.completed_at,
    summary: importRun.summary,
    warningsJson: importRun.warnings_json,
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
    strategy: 'docs_only',
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

    return res.json({
      project: serializeProjectRow(validation.project),
      milestones,
      slices,
      tasks,
      requirements,
      decisions,
      latestImportRun: importRuns[0] ?? null,
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
