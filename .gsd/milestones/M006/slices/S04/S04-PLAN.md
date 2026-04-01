# S04: Repo tagging (active / minimal / archive)

**Goal:** Add a tag field (active/minimal/archive) to projects. Store in DB. Show tag badge on portfolio cards and in project detail header. Adjust health scoring: archived repos get a neutral score floor (no penalties), minimal repos skip proof/import-age contributors.
**Demo:** After this: After this: repos that are intentionally inactive can be tagged as 'archive' or 'minimal', removing health noise and deprioritizing them in the urgency sort.

## Tasks
- [x] **T01: Added database schema for `repo_tag`, updated health/urgency logic, and added the `/tag` endpoint.** — 1. Update database schema in `server.js`:
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
  - Estimate: 40m
  - Files: server.js
  - Verify: Call the new endpoint via node script to set a project to 'archive', then fetch portfolio and verify it moved to the bottom with a negative urgency score.
- [x] **T02: Added tag UI to portfolio cards and project detail header.** — 1. Update `Project` interface in `App.tsx` to include `repoTag: 'active' | 'minimal' | 'archive'`.
2. Portfolio Card:
   - Render a tag badge if the tag is not 'active'. 'Archive' (muted), 'Minimal' (info).
3. Project Detail Header:
   - Add a dropdown or set of buttons next to the project name to change the tag.
   - Hitting the button calls `POST /api/projects/:id/tag`, updates `selectedProject`, and reloads the plan/portfolio.
4. Render the Tag state in the UI.
  - Estimate: 35m
  - Files: src/App.tsx
  - Verify: Build clean. Can see the tag options in the UI, clicking them updates the backend and visually changes the portfolio list ordering.
- [x] **T03: Browser verification passed for Repo Tagging functionality.** — 1. Start dev server + backend.
2. Select a project (e.g. `filetrx` which was D).
3. Change tag to `minimal`. Assert health score improves and breakdown shows minimal notes.
4. Change tag to `archive`. Assert it drops to the bottom of the portfolio list (urgency < 0).
5. Assert portfolio card shows "Archive" badge.
6. No console errors.
  - Estimate: 15m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert confirms the tagging UI changes the card and list order.
