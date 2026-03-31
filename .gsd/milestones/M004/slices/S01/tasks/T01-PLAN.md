---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T01: Add proof_level to milestones and gsd_summary artifact discovery

1. Add ALTER TABLE milestones ADD COLUMN IF NOT EXISTS proof_level TEXT DEFAULT 'claimed' — but since SQLite doesn't support IF NOT EXISTS on ADD COLUMN, use a try/catch around db.exec('ALTER TABLE milestones ADD COLUMN proof_level TEXT DEFAULT claimed') and silently ignore 'duplicate column name' errors.
2. Add two new artifact rules to the ARTIFACT_RULES array (near line 17):
   - { relativePath: '.gsd/milestones', artifactType: 'gsd_milestones_dir' } already exists — leave it
   - Add a scan function that walks .gsd/milestones/**/S*-SUMMARY.md and M*-SUMMARY.md files and registers each as a gsd_summary artifact with path=absolutePath, title derived from filename
3. The scan for gsd_summary artifacts should happen in the existing scanProjectArtifacts function (or equivalent) — find where gsd_milestones_dir is detected and add the SUMMARY walk there.
4. Confirm evidence_links table schema is sufficient for proof links: entity_type='requirement', entity_id=requirement.id, source_artifact_id=summary artifact id, excerpt=proof text, reason='requirements_validated'. No new table needed.

## Inputs

- `server.js — existing ARTIFACT_RULES, scanProjectArtifacts, evidence_links table`

## Expected Output

- `server.js with proof_level column migration and gsd_summary artifact discovery`

## Verification

Start server, scan command-center project (POST /api/scan), then GET /api/projects/1/artifacts — confirm gsd_summary entries appear. Query DB directly: SELECT proof_level FROM milestones LIMIT 3 — should return 'claimed'.
