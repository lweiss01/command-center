---
id: T01
parent: S04
milestone: M003
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["selectInstallCommand picks winget→npm on Windows, brew→npm on macOS, npm on Linux", "verify-tool re-runs computeReadiness fresh (no caching) for accurate post-install probe"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "curl verify-tool returned {ok:true, componentId:'gsd-tool', status:'present'}. curl verify-tool on a repo-doc component returned 400 with 'verify-tool is only available for machine-tool components'. plan response confirmed platform field present with value 'win32'."
completed_at: 2026-03-31T00:38:26.363Z
blocker_discovered: false
---

# T01: Added verify-tool endpoint and OS-aware install commands to server.js

> Added verify-tool endpoint and OS-aware install commands to server.js

## What Happened
---
id: T01
parent: S04
milestone: M003
key_files:
  - server.js
key_decisions:
  - selectInstallCommand picks winget→npm on Windows, brew→npm on macOS, npm on Linux
  - verify-tool re-runs computeReadiness fresh (no caching) for accurate post-install probe
duration: ""
verification_result: passed
completed_at: 2026-03-31T00:38:26.363Z
blocker_discovered: false
---

# T01: Added verify-tool endpoint and OS-aware install commands to server.js

**Added verify-tool endpoint and OS-aware install commands to server.js**

## What Happened

The server-side T01 work was already fully implemented in a prior session. computeBootstrapPlan received a COMPONENT_META table with installCommands for holistic-tool and gsd-tool, a selectInstallCommand helper that picks the right variant by platform (win32→winget/npm, darwin→brew/npm, linux→npm), and the addStep function attaches installCommands to machine-level steps. The GET /api/projects/:id/bootstrap/verify-tool endpoint re-probes tool presence via computeReadiness and returns {ok, componentId, status}. The plan response already included platform: process.platform.

## Verification

curl verify-tool returned {ok:true, componentId:'gsd-tool', status:'present'}. curl verify-tool on a repo-doc component returned 400 with 'verify-tool is only available for machine-tool components'. plan response confirmed platform field present with value 'win32'.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node -e "fetch('http://localhost:3001/api/projects/2/bootstrap/verify-tool?componentId=gsd-tool').then(r=>r.json()).then(d=>console.log(JSON.stringify(d)))"` | 0 | ✅ pass | 120ms |
| 2 | `node -e "fetch('http://localhost:3001/api/projects/1/bootstrap/verify-tool?componentId=gsd-dir').then(r=>Promise.all([r.status,r.json()])).then(([s,b])=>console.log(s,JSON.stringify(b)))"` | 0 | ✅ pass — 400 returned for non-machine-tool | 110ms |


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
