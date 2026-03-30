---
id: T01
parent: S02
milestone: M003
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["BOOTSTRAP_STUBS kept as alias to BOOTSTRAP_STUBS_MINIMAL for backward compatibility with any future direct usage", "getStepPreviewContent placed at line 2732 (after apply endpoint) — hoisting handles the forward reference correctly in ESM"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "curl 'http://localhost:3001/api/projects/7/plan?templateId=starter' confirmed previewContent present with multi-line starter content for gsd-doc-project step. templateId field confirmed present. Apply wrote starter content to pdf2epub/.gsd/PROJECT.md and file confirmed on disk."
completed_at: 2026-03-30T01:38:42.266Z
blocker_discovered: false
---

# T01: Added starter template presets and previewContent field to bootstrap plan steps

> Added starter template presets and previewContent field to bootstrap plan steps

## What Happened
---
id: T01
parent: S02
milestone: M003
key_files:
  - server.js
key_decisions:
  - BOOTSTRAP_STUBS kept as alias to BOOTSTRAP_STUBS_MINIMAL for backward compatibility with any future direct usage
  - getStepPreviewContent placed at line 2732 (after apply endpoint) — hoisting handles the forward reference correctly in ESM
duration: ""
verification_result: passed
completed_at: 2026-03-30T01:38:42.267Z
blocker_discovered: false
---

# T01: Added starter template presets and previewContent field to bootstrap plan steps

**Added starter template presets and previewContent field to bootstrap plan steps**

## What Happened

Added BOOTSTRAP_STUBS_STARTER with 5 richer doc templates containing example section headers and placeholder comments. Added getBootstrapStubs(templateId) and getStepPreviewContent(componentId, projectName, templateId) helper functions. Updated computeBootstrapPlan to accept templateId and projectName parameters, calling getStepPreviewContent for every step to add previewContent and templateId fields. Updated the plan route to forward ?templateId query param, and the apply endpoint to accept templateId in the POST body and select the correct stub set when writing files.

## Verification

curl 'http://localhost:3001/api/projects/7/plan?templateId=starter' confirmed previewContent present with multi-line starter content for gsd-doc-project step. templateId field confirmed present. Apply wrote starter content to pdf2epub/.gsd/PROJECT.md and file confirmed on disk.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `curl http://localhost:3001/api/projects/7/plan?templateId=starter | node -e (check previewContent)` | 0 | ✅ pass — previewContent[:80]: '# pdf2epub\n\n## What this project is...' | 120ms |


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
