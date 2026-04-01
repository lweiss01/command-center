---
estimated_steps: 5
estimated_files: 1
skills_used: []
---

# T03: Verify auto-import end-to-end

1. POST /api/scan with the command-center workspace root
2. Time the full scan — assert < 10s
3. Check DB: SELECT COUNT(*) FROM milestones WHERE project_id = (id of a project that has PROJECT.md) — assert > 0
4. POST /api/scan again immediately — assert all skipped (imported from first run < 24h ago)
5. No regressions: GET /api/projects still returns all projects

## Inputs

- `running server, mission_control.db`

## Expected Output

- `verified auto-import works and is idempotent within 24h`

## Verification

Scan timing < 10s. DB confirmed entities imported. Second scan shows all skipped. GET /api/projects unchanged.
