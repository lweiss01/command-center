# S05: Beads context in health breakdown

**Goal:** Detect .beads/ directory presence and last-modified timestamp. Add a beads_context contributor to computeRepoHealth. Surface in health breakdown.
**Demo:** After this: After this: repos with Beads installed show a Beads contributor in the health breakdown — a small signal that context bead files exist and when they were last touched.

## Tasks
- [x] **T01: Added Beads context contributor to health calculation** — 1. Create `getBeadsInfo(projectRoot)` in `server.js` that checks for `.beads/`:
   - If missing, return `null`.
   - If present, count files and get latest modified time.
   - Return `{ count, lastModified }`.

2. Update `computeReadiness` to return beads info, or fetch it separately and pass into `computeRepoHealth`. Let's just fetch it in the portfolio/plan loops and pass it: `const beads = getBeadsInfo(projectForCompute.root_path)`.

3. Update `computeRepoHealth({ ..., beads })`:
   - Add `beads_context` contributor.
   - If `beads` is `null`, `contribution: 0`, `status: 'missing'`, `note: 'No .beads directory'`.
   - If `beads` present, `contribution: 0.10` (maybe scale down other maxContributions? e.g., Readiness to 0.15, Import recency to 0.15, or keep them and just cap at 1.0. Let's keep them and let it be additive, cap at 1.0).
   - If present, `status: 'ok'`, `note: N files (latest: X days ago)`.
  - Estimate: 40m
  - Files: server.js
  - Verify: Test using `node -e` on `command-center` (which has no beads) and a repo that has `.beads` to see the new contributor in the health breakdown.
- [ ] **T02: Browser verification of Beads context** — 1. Start dev server + backend.
2. Select `command-center` in UI, assert 'Beads context' appears in health breakdown as missing.
3. Select a project with `.beads` (or create a dummy one), assert 'Beads context' appears as ok with a file count.
4. No console errors.
  - Estimate: 15m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert confirms Beads context is visible in the health breakdown.
