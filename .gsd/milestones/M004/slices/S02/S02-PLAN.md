# S02: SUMMARY import: parse and persist proof signals

**Goal:** Parse SUMMARY.md files for proof signals, persist them in evidence_links and milestones.proof_level, and expose a POST /api/projects/:id/import/summaries endpoint.
**Demo:** After this: After this: POST import/summaries on command-center populates proof_links; GET plan returns milestone proof_level=proven for M001–M003.

## Tasks
- [x] **T01: Wrote and tested SUMMARY frontmatter and requirements-validated parsers** — Write parseSummaryFrontmatter(content) and parseSummaryRequirementsValidated(content):

1. parseSummaryFrontmatter(content): string
   - If content starts with '---', extract YAML block up to the second '---'
   - Parse: id, milestone, verification_result, completed_at from the block (simple regex, no YAML lib)
   - Return { id, milestone, verificationResult, completedAt } — null for missing fields

2. parseSummaryRequirementsValidated(content): Array<{reqKey, proofText}>
   - Find the '## Requirements Validated' section (case-insensitive header match)
   - Extract lines matching /^-\s+(R\d+)\s+[—-]\s+(.+)$/
   - Return array of { reqKey: 'R001', proofText: '<rest of line>' }
   - Return [] if section absent or no matching lines

3. Unit-test both parsers inline (console.assert) against two real SUMMARY files before proceeding:
   - M002/slices/S01/S01-SUMMARY.md (has Requirements Validated)
   - M001/slices/S01/S01-SUMMARY.md (no Requirements Validated section)
  - Estimate: 25m
  - Files: server.js
  - Verify: Node: inline console.assert tests on two real SUMMARY files pass — correct frontmatter parsed, correct requirement entries extracted.
- [x] **T02: importGsdSummaries function and import/summaries endpoint implemented and verified** — Write importGsdSummaries(projectId) function and POST /api/projects/:id/import/summaries endpoint:

1. importGsdSummaries(projectId):
   a. Get project, verify exists
   b. Get all gsd_summary artifacts for projectId (listArtifactsByProjectId filtered to artifact_type='gsd_summary')
   c. For each artifact:
      - Read file content
      - parseSummaryFrontmatter → { id, milestone, verificationResult, completedAt }
      - Determine type: milestone summary (matches /^M\d+$/) vs slice summary (matches /^S\d+$/)
      - For SLICE summaries with verificationResult==='passed':
        i. Find the parent milestone row in DB: SELECT * FROM milestones WHERE project_id=? AND external_key=?
           using the milestone field from frontmatter
        ii. If milestone found AND all slice summaries for that milestone have verification_result=passed:
            UPDATE milestones SET proof_level='proven' WHERE id=milestone.id
        iii. Parse body for requirementsValidated entries
        iv. For each { reqKey, proofText }:
            - Find requirement row by project_id + external_key
            - Upsert evidence_link: DELETE WHERE entity_type='requirement' AND entity_id=req.id AND source_artifact_id=artifact.id, then INSERT
      - For MILESTONE summaries:
        i. Find milestone row
        ii. If status==='complete' AND verificationResult==='passed' (or equivalent):
            UPDATE milestones SET proof_level='proven'
   d. Return { milestonesUpdated: N, proofLinksWritten: N, warnings: string[] }

2. POST /api/projects/:id/import/summaries endpoint:
   - Call importGsdSummaries(projectId)
   - Return result
   - Log [import/summaries] project=X milestones=N proof_links=N warnings=M

3. Include milestones.proof_level in serializeMilestoneRow (add proofLevel field).
  - Estimate: 50m
  - Files: server.js
  - Verify: POST /api/projects/1/import/summaries returns { milestonesUpdated:3, proofLinksWritten:N, warnings:[] }. DB: SELECT external_key,proof_level FROM milestones WHERE project_id=1 — M001/M002/M003 show proof_level='proven'. evidence_links rows exist for validated requirements.
- [x] **T03: End-to-end import pipeline verified — proof data flows from SUMMARY files into DB and plan response** — 1. Start server, run POST /api/projects/1/import/summaries
2. Verify response: milestonesUpdated=3 (M001, M002, M003), proofLinksWritten >= 9 (one per validated requirement)
3. DB: SELECT m.external_key, m.proof_level FROM milestones m WHERE m.project_id=1 — confirm proven
4. DB: SELECT r.external_key, el.excerpt FROM evidence_links el JOIN requirements r ON r.id=el.entity_id WHERE el.reason='requirements_validated' AND r.project_id=1 ORDER BY r.external_key — confirm proof text rows
5. GET /api/projects/1/plan — confirm milestones include proofLevel field
6. Re-run import — confirm idempotent (same result, no duplicates)
7. Check no regressions: GET /api/projects/2/plan still works normally
  - Estimate: 20m
  - Files: server.js
  - Verify: All DB assertions above pass. Import is idempotent. No regressions.
