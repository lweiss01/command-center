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
    const projects = listProjects.all().map((project) => ({
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
    }));

    return res.json(projects);
  } catch (error) {
    console.error('Failed to list projects:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects/:id/artifacts', (req, res) => {
  try {
    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: 'Project id must be numeric' });
    }

    const artifacts = listArtifactsByProjectId.all(projectId).map((artifact) => ({
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
