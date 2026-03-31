---
estimated_steps: 11
estimated_files: 1
skills_used: []
---

# T02: Write computeRepairQueue function

Write computeRepairQueue({ continuity, readiness, workflowState, proofSummary, latestImportRunsByArtifact, bootstrapPlan }) in server.js.

Priority logic — each check produces zero or one repair item:
1. (critical) continuity missing: { priority:1, severity:'critical', action:'Initialize continuity', rationale:'No Holistic state found — resuming blind risks duplicating work.', targetPanel:'continuity' }
2. (critical) readiness missing: { priority:2, severity:'critical', action:'Bootstrap workflow stack', rationale:'Required components missing — cockpit recommendations are unreliable.', targetPanel:'bootstrap' }
3. (high) stale continuity + missing hygiene: { priority:3, severity:'high', action:'Run handoff to record session context', rationale:'Continuity exists but no checkpoint recorded.', targetPanel:'continuity' }
4. (high) readiness partial with required gaps: { priority:4, severity:'high', action:'Apply repo-local bootstrap steps', rationale:'N required components missing.', targetPanel:'bootstrap' }
5. (medium) no imports ever: { priority:5, severity:'medium', action:'Import planning artifacts', rationale:'No milestones, requirements, or decisions imported yet.', targetPanel:'import' }
6. (medium) imports older than 14 days: { priority:6, severity:'medium', action:'Re-import planning artifacts', rationale:'Imports are N days old — cockpit interpretation may be stale.', targetPanel:'import' }
7. (medium) zero proven milestones but milestones exist: { priority:7, severity:'medium', action:'Run Import Summaries', rationale:'Milestones are claimed-only — run Import Summaries after completing work.', targetPanel:'proof' }
8. (low) stale continuity (but hygiene ok): { priority:8, severity:'low', action:'Run a handoff before switching context', rationale:'Continuity is stale — a fresh handoff will improve resume quality.', targetPanel:'continuity' }

Return array sorted by priority ascending (lowest number = fix this first). Empty array if no repairs needed.

## Inputs

- `server.js — same signal shapes as T01`

## Expected Output

- `computeRepairQueue function in server.js`

## Verification

node inline test: call with paydirt-backend signals — expect at least priority-1 or priority-5 item at top. Call with command-center signals — expect empty or only low-severity items.
