import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const journalDir = path.join(cwd, '.gsd', 'journal');
const runtimeDir = path.join(cwd, '.gsd', 'runtime', 'units');
const checkOnly = process.argv.includes('--check');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function listFiles(dirPath, suffix) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((name) => name.endsWith(suffix))
    .map((name) => path.join(dirPath, name))
    .sort((a, b) => a.localeCompare(b));
}

function readJsonl(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Failed to parse JSONL line in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

function toMillis(ts) {
  const value = Date.parse(ts);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid timestamp: ${ts}`);
  }

  return value;
}

function getUnitKey(unitType, unitId) {
  return `${unitType}:${unitId}`;
}

function collectLatestCompletedEvents() {
  const latestByUnit = new Map();

  for (const journalPath of listFiles(journalDir, '.jsonl')) {
    for (const entry of readJsonl(journalPath)) {
      if (entry?.eventType !== 'unit-end') continue;

      const unitType = entry?.data?.unitType;
      const unitId = entry?.data?.unitId;
      if (!unitType || !unitId) continue;

      const key = getUnitKey(unitType, unitId);
      const tsMillis = toMillis(entry.ts);
      const previous = latestByUnit.get(key);

      if (!previous || tsMillis >= previous.tsMillis) {
        latestByUnit.set(key, {
          unitType,
          unitId,
          ts: entry.ts,
          tsMillis,
          status: entry?.data?.status ?? 'completed',
          artifactVerified: Boolean(entry?.data?.artifactVerified),
        });
      }
    }
  }

  return latestByUnit;
}

function reconcileRuntimeUnits() {
  const latestByUnit = collectLatestCompletedEvents();
  const runtimeFiles = listFiles(runtimeDir, '.json');
  const results = [];

  for (const runtimePath of runtimeFiles) {
    const current = readJson(runtimePath);
    const unitType = current?.unitType;
    const unitId = current?.unitId;
    const completed = latestByUnit.get(getUnitKey(unitType, unitId));

    if (!completed) {
      results.push({ file: runtimePath, status: 'no-journal-match' });
      continue;
    }

    const desired = {
      ...current,
      updatedAt: Math.max(Number(current.updatedAt || 0), completed.tsMillis),
      phase: completed.status === 'completed' ? 'completed' : current.phase,
      lastProgressAt: Math.max(Number(current.lastProgressAt || 0), completed.tsMillis),
      progressCount: Math.max(Number(current.progressCount || 0), 1),
      lastProgressKind: 'unit-end',
      status: completed.status,
      artifactVerified: completed.artifactVerified,
      completedAt: completed.tsMillis,
    };

    const changed = JSON.stringify(current) !== JSON.stringify(desired);

    if (changed && !checkOnly) {
      writeJson(runtimePath, desired);
    }

    results.push({
      file: runtimePath,
      status: changed ? (checkOnly ? 'stale' : 'updated') : 'ok',
      unitType,
      unitId,
      completedAt: completed.ts,
    });
  }

  return results;
}

try {
  const results = reconcileRuntimeUnits();
  const counts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});

  for (const result of results) {
    const relativePath = path.relative(cwd, result.file);
    console.log(`${result.status.toUpperCase()}: ${relativePath}${result.completedAt ? ` <- ${result.completedAt}` : ''}`);
  }

  console.log(`Summary: ${JSON.stringify(counts)}`);

  if (checkOnly && counts.stale) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
