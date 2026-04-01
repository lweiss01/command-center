---
estimated_steps: 12
estimated_files: 1
skills_used: []
---

# T01: Database schema and health scoring for repo tags

1. Update database schema in `server.js`:
   - Add `ALTER TABLE projects ADD COLUMN repo_tag TEXT DEFAULT 'active'` (in a try/catch, like proof_level).
   - Update `insertProject` to include `repo_tag`.
   - Update `updateProject` to NOT overwrite `repo_tag` when scanning.
   - Update `serializeProjectRow` to return `repoTag`.

2. Update `computeRepoHealth` in `server.js`:
   - Accept `project` object to read `repo_tag`.
   - If `repo_tag === 'archive'`, maybe return `grade: '–'`, `score: 0`, and a neutral breakdown. But the plan says "neutral score floor (no penalties)". Actually, let's just make it return `score: 0.5`, `grade: '–'` or `N/A`, and empty breakdown, or just zero out the contributions and return "Archived". Wait, plan says "no penalties". If it's archived, just skip health calculation or cap it neutrally so it doesn't show up as D.
   - For `minimal`, skip `proof_coverage` and `import_recency` checks (grant full points or 0 maxContribution so they don't lower the score). Let's say if `minimal`, `import_recency` and `proof_coverage` give full contribution but mark note as "Skipped (minimal)".

3. Update `computeUrgencyScore`:
   - If `repo_tag === 'archive'`, return -1 (to sink it to the bottom).

4. Add `POST /api/projects/:id/tag` endpoint to update the tag in the database.

## Inputs

- `server.js - existing schemas and health functions`

## Expected Output

- `DB migration, API endpoint, updated health functions`

## Verification

Call the new endpoint via node script to set a project to 'archive', then fetch portfolio and verify it moved to the bottom with a negative urgency score.
