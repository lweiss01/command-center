---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T01: Preflight safety check endpoint

Add GET /api/projects/:id/bootstrap/preflight endpoint to server.js.

Accepts ?componentId=<id> as a query param.

For each componentId, determine:
- wouldCreate: the absolute path that would be created (file or dir)
- conflict: whether that path already exists
- conflictDetail: human-readable description if conflict (e.g. 'File already exists at .gsd/PROJECT.md — applying will overwrite it')
- parentWritable: whether the parent directory is accessible (use fs.accessSync with W_OK on the parent)
- safe: true if no conflict AND parentWritable; false otherwise

For machine-tool components: return { safe: false, wouldCreate: null, conflict: false, conflictDetail: 'Machine-level tools cannot be preflight-checked', parentWritable: false }

For gsd-dir / holistic-dir: check if the directory already exists.
For gsd-doc-*: check if the file already exists.

Return shape: { ok: true, componentId, wouldCreate, conflict, conflictDetail, parentWritable, safe }

Log: [bootstrap/preflight] project=X component=Y conflict=true/false

## Inputs

- `server.js — getValidatedProjectOrSend, component path logic from apply endpoint`

## Expected Output

- `GET /api/projects/2/bootstrap/preflight?componentId=gsd-doc-project returns conflict:true when .gsd/PROJECT.md exists`

## Verification

curl 'http://localhost:3001/api/projects/2/bootstrap/preflight?componentId=gsd-dir' after .gsd exists in filetrx — should return conflict:true. curl same endpoint for a missing component — should return conflict:false, safe:true.

## Observability Impact

[bootstrap/preflight] log line
