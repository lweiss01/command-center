---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T03: Deepen computeContinuity to return structured freshness and hygiene signals

Rewrite computeContinuity(project) to return { status: 'fresh'|'stale'|'missing', freshAt: string|null, ageHours: number|null, latestWork: string|null, checkpointHygiene: 'ok'|'stale'|'missing', hygieneNote: string|null }. Read from Holistic state.json if present at {rootPath}/.holistic/state.json. If absent, status is 'missing'. If present, derive freshness from lastUpdated timestamp. Keep existing basic freshness behavior as the fallback.

## Inputs

- `T01 audit notes`

## Expected Output

- `server.js: updated computeContinuity returning structured freshness object`

## Verification

GET /api/projects/:id/plan returns continuity with status, freshAt, ageHours, latestWork, checkpointHygiene fields.
