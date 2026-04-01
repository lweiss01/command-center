---
estimated_steps: 10
estimated_files: 1
skills_used: []
---

# T01: Add Beads context to Health calculation

1. Create `getBeadsInfo(projectRoot)` in `server.js` that checks for `.beads/`:
   - If missing, return `null`.
   - If present, count files and get latest modified time.
   - Return `{ count, lastModified }`.

2. Update `computeReadiness` to return beads info, or fetch it separately and pass into `computeRepoHealth`. Let's just fetch it in the portfolio/plan loops and pass it: `const beads = getBeadsInfo(projectForCompute.root_path)`.

3. Update `computeRepoHealth({ ..., beads })`:
   - Add `beads_context` contributor.
   - If `beads` is `null`, `contribution: 0`, `status: 'missing'`, `note: 'No .beads directory'`.
   - If `beads` present, `contribution: 0.10` (maybe scale down other maxContributions? e.g., Readiness to 0.15, Import recency to 0.15, or keep them and just cap at 1.0. Let's keep them and let it be additive, cap at 1.0).
   - If present, `status: 'ok'`, `note: N files (latest: X days ago)`.

## Inputs

- `server.js - existing health calculation logic`

## Expected Output

- ``getBeadsInfo` function and updated `computeRepoHealth` in `server.js``

## Verification

Test using `node -e` on `command-center` (which has no beads) and a repo that has `.beads` to see the new contributor in the health breakdown.
