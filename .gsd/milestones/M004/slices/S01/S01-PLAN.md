# S01: SUMMARY artifact discovery and schema extension

**Goal:** Extend the DB schema with proof_level on milestones, register gsd_summary as a recognized artifact type, and wire SUMMARY file discovery into the scan so subsequent slices can import from them.
**Demo:** After this: After this: source_artifacts includes SUMMARY entries for the command-center repo; proof_links table exists and is queryable.

## Tasks
- [x] **T01: Added gsd_summary artifact discovery and proof_level column to milestones** — 1. Add ALTER TABLE milestones ADD COLUMN IF NOT EXISTS proof_level TEXT DEFAULT 'claimed' — but since SQLite doesn't support IF NOT EXISTS on ADD COLUMN, use a try/catch around db.exec('ALTER TABLE milestones ADD COLUMN proof_level TEXT DEFAULT claimed') and silently ignore 'duplicate column name' errors.
2. Add two new artifact rules to the ARTIFACT_RULES array (near line 17):
   - { relativePath: '.gsd/milestones', artifactType: 'gsd_milestones_dir' } already exists — leave it
   - Add a scan function that walks .gsd/milestones/**/S*-SUMMARY.md and M*-SUMMARY.md files and registers each as a gsd_summary artifact with path=absolutePath, title derived from filename
3. The scan for gsd_summary artifacts should happen in the existing scanProjectArtifacts function (or equivalent) — find where gsd_milestones_dir is detected and add the SUMMARY walk there.
4. Confirm evidence_links table schema is sufficient for proof links: entity_type='requirement', entity_id=requirement.id, source_artifact_id=summary artifact id, excerpt=proof text, reason='requirements_validated'. No new table needed.
  - Estimate: 40m
  - Files: server.js
  - Verify: Start server, scan command-center project (POST /api/scan), then GET /api/projects/1/artifacts — confirm gsd_summary entries appear. Query DB directly: SELECT proof_level FROM milestones LIMIT 3 — should return 'claimed'.
- [x] **T02: Confirmed SUMMARY file structure: verification_result in frontmatter, requirements_validated in body** — Write a focused audit script that walks all SUMMARY files in command-center and confirms the parser will find what it needs:
1. Parse frontmatter from each S##-SUMMARY.md: extract id, milestone, verification_result, completed_at
2. Parse body from each S##-SUMMARY.md: extract ## Requirements Validated section, parse - R### — <proof text> lines
3. Parse frontmatter from each M###-SUMMARY.md: extract id, status, completed_at
4. Print a table: file, verification_result, req_validated_count, body_parse_ok
5. Identify any edge cases: missing sections, malformed lines, duplicate R### entries

This is a pure audit — no DB writes. Output feeds directly into T01 parser implementation confidence.
  - Estimate: 20m
  - Files: server.js
  - Verify: Run node audit script — output shows 25 slice summaries with verification_result=passed, 9 with requirements_validated entries, 3 milestone summaries with status=complete. No parse errors.
