---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T03: Verify import pipeline end-to-end

1. Start server, run POST /api/projects/1/import/summaries
2. Verify response: milestonesUpdated=3 (M001, M002, M003), proofLinksWritten >= 9 (one per validated requirement)
3. DB: SELECT m.external_key, m.proof_level FROM milestones m WHERE m.project_id=1 — confirm proven
4. DB: SELECT r.external_key, el.excerpt FROM evidence_links el JOIN requirements r ON r.id=el.entity_id WHERE el.reason='requirements_validated' AND r.project_id=1 ORDER BY r.external_key — confirm proof text rows
5. GET /api/projects/1/plan — confirm milestones include proofLevel field
6. Re-run import — confirm idempotent (same result, no duplicates)
7. Check no regressions: GET /api/projects/2/plan still works normally

## Inputs

- `running server`
- `mission_control.db`

## Expected Output

- `verified import result`

## Verification

All DB assertions above pass. Import is idempotent. No regressions.
