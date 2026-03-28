# Command Center User Guide — How to Get Work Done

This guide is about **operating Command Center for outcomes**, not just running commands.

If you only need install/start/stop commands, see [README.md](../README.md).

---

## 1) What “good state” looks like

Your goal in Command Center is to get each repo into an **optimal execution state**:

- **Workflow State:** `active` (not `stalled`, `no-data`, or `blocked`)
- **Workflow Confidence:** ideally **70%+** (green)
- **Workflow Readiness:** `ready`
- **Continuity Status:** `fresh`
- **Checkpoint Hygiene:** `ok`
- **Next Action:** `Clear` (no blockers)
- **Open Loops:** no surprising `blocked` milestones; unresolved/deferred counts are understood

If you’re not there yet, this guide tells you exactly how to get there.

---

## 2) Daily operating workflow (recommended)

Use this every session:

1. Launch Command Center.
2. Pick your repo card.
3. Triage panels in this order:
   1. **Workflow Readiness**
   2. **Continuity**
   3. **Workflow State**
   4. **Next Action**
   5. **Open Loops**
4. Execute the remediation/action steps in this guide.
5. Re-check until Next Action is clear and actionable.

Why this order? Readiness + continuity are foundational. If they’re broken, everything else can be misleading.

---

## 3) Panel-by-panel: what you can see, what it means, what to do

## 3.1 Workflow Readiness (foundation check)

### Values you can see

- `ready`
- `partial`
- `missing`

### Why it matters

Readiness tells you whether the workflow stack exists enough to trust the cockpit and execute safely.

### What drives readiness

Command Center checks required components (repo + machine):

- `GSD` directory (`.gsd`)
- `GSD project doc` (`.gsd/PROJECT.md`)
- `Holistic (repo)` directory (`.holistic`)
- `Holistic (tool)` available on machine
- `GSD (tool)` available on machine

If required components are missing, they show under gaps/blockers.

### Actions by value

#### If `ready`
1. Move to **Continuity**.
2. No readiness remediation needed.

#### If `partial`
1. Read the missing component labels in gaps.
2. Fix repo-level gaps first (missing `.gsd`, `.holistic`, docs).
3. Fix machine-tool gaps next (install/repair tool availability).
4. Re-run imports if needed (Import Controls).
5. Re-check until `ready`.

#### If `missing`
1. Treat as a hard blocker.
2. Bootstrap required workflow stack for this repo.
3. Do not trust phase guidance until this is at least `partial`.
4. Re-check readiness and continue remediation until `ready`.

---

## 3.2 Continuity (resume safety)

### Values you can see

**Status**:
- `fresh`
- `stale`
- `missing`

**Checkpoint hygiene**:
- `ok`
- `stale`
- `missing`

### Why it matters

Continuity prevents duplicate effort and blind resumption after interruptions.

- `fresh` means recent repo-local Holistic activity (<= 6h)
- `stale` means older than that (or timestamp not parseable)
- `missing` means no repo-local Holistic state file detected

Checkpoint hygiene tells whether there is a usable checkpoint/handoff signal:

- `ok`: recent checkpoint/handoff evidence (<= 24h)
- `stale`: checkpoint exists but old, or state fresh with no explicit checkpoint timestamp
- `missing`: no checkpoint/handoff record found

### Actions by combination

#### `status=fresh` + `hygiene=ok` (ideal)
1. Continue to Workflow State.
2. You can trust resume context strongly.

#### `status=fresh` + `hygiene=stale`
1. Continue work (soft warning).
2. Create a handoff/checkpoint before major context switch.

#### `status=stale` + `hygiene=ok`
1. Continue with caution (not a hard blocker).
2. Read latest work note and current plan before editing.
3. Create updated handoff after your session.

#### `status=stale` + `hygiene=stale`
1. Continue, but first spend 2–5 min reconstructing context from roadmap/summaries.
2. Treat first action as verification/reorientation.
3. Write fresh handoff at end.

#### `status=stale` + `hygiene=missing` (hard blocker in Next Action)
1. Run the handoff command shown in the Continuity panel.
2. Re-open/re-scan the project plan.
3. Continue only after blocker clears.

#### `status=missing` (hard blocker in Next Action)
1. Initialize/restore repo-local Holistic continuity for this repo.
2. Run handoff/resume flow.
3. Re-check until continuity is no longer missing.

---

## 3.3 Workflow State (phase + confidence)

### Phase values you can see

- `no-data`
- `import-only`
- `active`
- `stalled`
- `blocked`

### Why it matters

Phase tells where the repo is in practical execution terms; confidence tells how trustworthy that interpretation is.

### Confidence bands

- **70–100%**: high confidence (green)
- **40–69%**: medium confidence (amber)
- **0–39%**: low confidence (gray)

Confidence is reduced when artifacts are missing, imports are stale, or continuity is missing/stale.

### Actions by phase

#### `no-data`
1. Go to Import Controls.
2. Import milestones, requirements, decisions.
3. Re-check phase/confidence.

#### `import-only`
1. Import missing artifacts (usually requirements/decisions).
2. Re-check confidence and phase transition.

#### `active`
1. Proceed to Next Action.
2. Execute plan deliberately.
3. Keep continuity fresh with checkpoints/handoffs.

#### `stalled`
1. Refresh continuity and imports.
2. Review recency evidence/reasons.
3. Confirm what changed recently before editing code.

#### `blocked`
1. Read blockers in Next Action.
2. Resolve readiness/continuity blockers first.
3. Re-check until phase leaves blocked.

---

## 3.4 Next Action (what to do now)

### Values you can see

Header badge:
- `Blocked`
- `Clear`

Plus:
- Action text
- Rationale text
- Optional blockers list
- Optional suggested command

### Why it matters

This is your **execution trigger**. It translates state into immediate next steps.

### Common action patterns and what to do

#### “Bootstrap the workflow stack before continuing.”
1. Treat as hard stop.
2. Resolve missing required readiness components.
3. Re-check until blocker clears.

#### “Refresh continuity before continuing.”
1. Run handoff/checkpoint flow.
2. Confirm continuity no longer missing/stale+missing-hygiene.
3. Continue.

#### “Import planning artifacts.”
1. Use Import Controls to import milestones, requirements, decisions.
2. Review warnings and fix source docs if needed.
3. Re-check Workflow State.

#### “Import requirements for fuller planning coverage.”
1. Import requirements specifically.
2. Confirm requirement rows appear.
3. Re-check confidence increase.

#### “Import more planning artifacts to build workflow confidence.”
1. Add/import whichever artifact class is absent or stale.
2. Re-check confidence/reasons.

#### “Review the current plan and continue execution.”
1. This is the normal go signal.
2. Follow active milestone/slice/task sequence.
3. Keep continuity hygiene healthy.

---

## 3.5 Open Loops (risk and unfinished work map)

### What you can see

- Summary counts:
  - unresolved requirements
  - pending milestones
  - blocked milestones
  - deferred items
- Lists:
  - blocked milestones
  - unresolved requirements
  - deferred items
  - revisable decisions

### Why it matters

This is your “what can still bite me” panel.

### How to use it

#### If blocked milestones > 0
1. Open those milestone items first.
2. Identify dependency/decision causing block.
3. Resolve block before taking on new scope.

#### If unresolved requirements > 0
1. Review each unresolved requirement.
2. Decide: validate now, defer, or re-scope.
3. Avoid claiming completion while unresolved critical requirements remain.

#### If deferred items > 0
1. Confirm deferment is still intentional.
2. Promote back to active only if needed for current milestone.

#### If revisable decisions > 0
1. Check whether current context invalidates prior assumptions.
2. Revisit only when it unlocks current blockers or reduces risk.

---

## 3.6 Import Controls (data quality and recency)

### What you can see

- Latest import status: `success` / `partial` / `failed` / `none`
- Warning count + warning details
- Per-artifact status cards (milestones/requirements/decisions)
- Import buttons:
  - Import Milestones
  - Import Requirements
  - Import Decisions

### Why it matters

Interpretation quality depends on import quality and freshness.

### Actions by status

#### `success`
- No immediate action unless state is stale.

#### `partial`
1. Read warnings.
2. Fix source docs causing parse/import warnings.
3. Re-import affected artifact.

#### `failed`
1. Fix source structure/path issues first.
2. Re-run import for that artifact.
3. Confirm status becomes `success` or at least warning-backed `partial`.

#### `none`
1. Run initial imports for all three artifact classes.

---

## 4) Practical playbooks (step-by-step)

## Playbook A — “I opened a repo and it says Blocked”

1. Check **Workflow Readiness**.
2. If readiness is `missing`, fix required gaps first.
3. Check **Continuity**.
4. If continuity is `missing` or `stale + hygiene missing`, run handoff/checkpoint flow.
5. Re-check **Next Action**.
6. Only proceed to implementation after status flips to Clear or a soft-warning state.

## Playbook B — “It’s Active but confidence is low”

1. Open Workflow reasons/evidence.
2. Look for missing artifacts, stale imports, or stale/missing continuity.
3. Import missing artifact classes.
4. Refresh continuity.
5. Re-check confidence and reasons.

## Playbook C — “I need to choose what to do today across repos”

1. From project cards, prioritize repos with:
   - clear next action,
   - high confidence,
   - low blocker count,
   - meaningful open-loop impact.
2. Avoid starting on repos that are readiness/continuity blocked unless your goal is unblock work.
3. Commit to one repo until blocker retirement or handoff point.

## Playbook D — “End of day clean exit”

1. Ensure your current action is reflected in planning artifacts.
2. Run handoff/checkpoint so continuity hygiene is not missing.
3. Stop services.
4. Next session should reopen to fresh context instead of reconstruction.

---

## 5) Recommended target state checklist

Use this as your “ready to execute” gate:

- [ ] Readiness = `ready`
- [ ] Continuity status != `missing`
- [ ] If continuity is stale, checkpoint hygiene is not `missing`
- [ ] Workflow phase != `blocked`
- [ ] Next Action blockers are understood or retired
- [ ] Imports are not failed for required artifact classes

If all checked: execute.

---

## 6) FAQ

## Why do milestone IDs skip numbers (e.g., M001, M002, M007)?

Milestone IDs are durable identifiers, not guaranteed contiguous sequence labels in the UI docs snapshot. Gaps can occur when planned milestones are superseded, merged, or retired without renumbering.

## Why does the terminal sometimes show odd symbols around Vite output?

That is typically terminal encoding/font mismatch (mojibake), not an app failure. Launcher windows now force UTF-8 output to reduce this.

---

## 7) Technical appendix (short)

If you still need command-level operations:

```bash
npm run cc:shortcut
npm run cc:doctor
npm run cc:launch
npm run cc:launch -- -NoBrowser
npm run cc:stop
npm run build
```

Planning truth sources:

- Roadmap: [ROADMAP.md](../ROADMAP.md)
- Execution artifacts: `.gsd/`
- Continuity memory: `.holistic/`
