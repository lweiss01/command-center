---
id: T01
parent: S04
milestone: M006
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["'archive' tag forces grade to '-' and score to 0, which then explicitly causes urgencyScore to return -1 and sink to the bottom of the list.", "'minimal' tag skips import_recency and proof_coverage, returning full points with a note 'Skipped (minimal repo)', ensuring it doesn't penalize repositories where these aren't relevant."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Called `POST /api/projects/2/tag` with `{tag: 'archive'}`. The API returned the updated project. Fetching `/api/portfolio` confirmed the project had `urgencyScore: -1` and the correct tag."
completed_at: 2026-03-31T23:19:50.477Z
blocker_discovered: false
---

# T01: Added database schema for `repo_tag`, updated health/urgency logic, and added the `/tag` endpoint.

> Added database schema for `repo_tag`, updated health/urgency logic, and added the `/tag` endpoint.

## What Happened
---
id: T01
parent: S04
milestone: M006
key_files:
  - server.js
key_decisions:
  - 'archive' tag forces grade to '-' and score to 0, which then explicitly causes urgencyScore to return -1 and sink to the bottom of the list.
  - 'minimal' tag skips import_recency and proof_coverage, returning full points with a note 'Skipped (minimal repo)', ensuring it doesn't penalize repositories where these aren't relevant.
duration: ""
verification_result: passed
completed_at: 2026-03-31T23:19:50.484Z
blocker_discovered: false
---

# T01: Added database schema for `repo_tag`, updated health/urgency logic, and added the `/tag` endpoint.

**Added database schema for `repo_tag`, updated health/urgency logic, and added the `/tag` endpoint.**

## What Happened

Added `repo_tag` column to the `projects` table using an idempotent migration. Updated `serializeProjectRow` to return `repoTag`. Updated `computeRepoHealth` to handle 'archive' (returns a neutral empty health) and 'minimal' (grants full points to import recency and proof coverage to avoid unnecessary penalties). Updated `computeUrgencyScore` to force a `-1` score if the repo is archived, sinking it to the bottom of the urgency list. Added `POST /api/projects/:id/tag` to update the tag in the database. Validated via a node script that updates a project to 'archive' and confirms the modified urgency score.

## Verification

Called `POST /api/projects/2/tag` with `{tag: 'archive'}`. The API returned the updated project. Fetching `/api/portfolio` confirmed the project had `urgencyScore: -1` and the correct tag.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node inline test hitting API endpoints` | 0 | ✅ pass | 1500ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `server.js`


## Deviations
None.

## Known Issues
None.
