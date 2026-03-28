# Command Center User Guide (Operator Playbook)

This guide explains **how to use Command Center to drive real work**.

It is intentionally procedural:

- what you can see,
- what each state means,
- exactly what to do next,
- how to verify your fix worked.

If you only need install/start/stop commands, see [README.md](../README.md).

Tip: the app header includes a **User Guide** button that opens this guide in a new tab for side-by-side use.

---

## 1) Your goal in Command Center

Your target is to move a repo into a **clear execution state**:

- Workflow Readiness = `ready`
- Continuity Status = `fresh` (or at least not missing)
- Checkpoint Hygiene = `ok` (or at least not missing)
- Workflow State = `active`
- Next Action = `Clear` (or blockers fully understood and intentionally accepted)

When any panel is not in that state, Command Center is telling you where risk is.

---

## 2) Fast daily workflow (10 minutes)

For each repo you plan to touch today:

1. Open Command Center and select the repo card.
2. Check panels in this order:
   1. **Workflow Readiness**
   2. **Continuity**
   3. **Workflow State**
   4. **Next Action**
   5. **Open Loops**
3. Apply the remediation steps in this guide.
4. Re-check each panel after each fix.
5. Start implementation only after Next Action is clear enough.

Why this order: readiness and continuity are foundational; phase interpretation is less trustworthy if either is broken.

---

## 3) Exactly how to “re-check” after a change

You’ll see this phrase repeatedly below. Here is the concrete re-check loop:

1. If you changed repo files or tooling outside the app, click **Scan Workspace** (or the header refresh action).
2. Re-select the project card.
3. In the project detail view:
   - review **Workflow Readiness** badge and gaps,
   - review **Continuity** badge/hygiene note,
   - review **Workflow State** phase + reasons,
   - review **Next Action** blockers.
4. If you edited planning docs (`.gsd/PROJECT.md`, `REQUIREMENTS.md`, `DECISIONS.md`), run the relevant **Import** buttons in Import Controls.
5. Re-check until the target state is reached.

---

## 4) Workflow Readiness (first gate)

## What you can see

Readiness badge values:

- `ready`
- `partial`
- `missing`

You also see component-level availability and required gaps.

## Why this matters

Readiness tells you whether the repo + machine has enough workflow infrastructure to trust and act on cockpit recommendations.

## What Command Center checks (required)

A repo is considered fully ready only when required checks are present:

- `.gsd/` directory
- `.gsd/PROJECT.md`
- `.holistic/` directory
- Holistic tool available on machine
- GSD tool available on machine

If one or more required components are absent, readiness drops.

## What to do for each value

### A) Readiness = `ready`

Do this:
1. No readiness remediation needed.
2. Move to **Continuity**.

Verify:
- Readiness badge stays `ready` after workspace rescan.

### B) Readiness = `partial`

Do this:
1. Read the missing required components listed as gaps.
2. Fix repo-level gaps first:
   - create missing directories/files if absent.
3. Fix machine-tool gaps second:
   - ensure required CLI tools are installed and callable.
4. Re-scan and re-check.

Verify:
- Gaps list shrinks.
- Readiness changes to `ready`.

### C) Readiness = `missing` (hard blocker)

Do this in order:

1. **Create minimal repo workflow skeleton** (inside the target repo root):

```powershell
mkdir .gsd -ErrorAction SilentlyContinue
mkdir .holistic -ErrorAction SilentlyContinue
if (-not (Test-Path .gsd/PROJECT.md)) { "# Project" | Out-File .gsd/PROJECT.md -Encoding utf8 }
```

2. Ensure required tools are callable in your shell.

Try these checks in order (Windows examples):

```powershell
holistic --version
holistic.cmd --version
```

```powershell
gsd --version
gsd.cmd --version
```

If both variants fail, treat tooling as missing in this shell and remediate install/PATH before expecting readiness to become `ready`.

3. If your repo includes repo-local holistic helper scripts, run the repo-local resume flow to initialize continuity:

```powershell
.\.holistic\system\holistic.cmd resume --agent gsd
```

If that script path does not exist, use your installed holistic command variant from this repo root instead:

```powershell
holistic resume --agent gsd
# or
holistic.cmd resume --agent gsd
```

4. Return to Command Center and run the re-check loop (Section 3).

Verify:
- Readiness is no longer `missing`.
- Required gaps are gone or reduced to `partial` while you finish remediation.

If still failing:
- confirm you are modifying the same repo path shown on the project card,
- confirm files are at exact paths (`.gsd/PROJECT.md`, `.holistic/`),
- rescan workspace again.

---

## 5) Continuity (resume safety gate)

## What you can see

### Status values
- `fresh`
- `stale`
- `missing`

### Checkpoint hygiene values
- `ok`
- `stale`
- `missing`

## Why this matters

Continuity protects you from resuming blind and duplicating work.

- `fresh`: recent continuity activity (good resume signal)
- `stale`: context exists but old
- `missing`: no continuity state found

Checkpoint hygiene reflects whether a usable checkpoint/handoff record exists.

## What to do by combination

### A) `fresh` + `ok` (best)

Do this:
1. Continue to Workflow State.
2. No continuity remediation required.

Verify:
- Continuity note shows recent update/checkpoint.

### B) `fresh` + `stale`

Do this:
1. Continue work.
2. Add a checkpoint/handoff before context switching.

Verify:
- End-of-session handoff updates hygiene toward `ok`.

### C) `stale` + `ok`

Do this:
1. Continue, but first read latest work context.
2. Review open loops before touching code.
3. Add fresh handoff when done.

Verify:
- No Next Action hard blocker.

### D) `stale` + `stale`

Do this:
1. Spend 2–5 minutes reconstructing context from roadmap + summaries.
2. Make your first action a verification step.
3. Execute and then handoff.

Verify:
- Reasoning panel no longer flags stale continuity as primary risk after next session.

### E) `stale` + `missing` (hard blocker)

Do this:
1. Run repo-local handoff command from the Continuity panel (or use):

```powershell
.\.holistic\system\holistic.cmd handoff
```

2. Re-check continuity status/hygiene.
3. Continue only when blocker clears.

Verify:
- Next Action no longer says “Refresh continuity before continuing.”

### F) `missing` continuity (hard blocker)

Do this:
1. Confirm `.holistic/state.json` exists in the repo.
2. If absent, initialize continuity using repo-local helper:

```powershell
.\.holistic\system\holistic.cmd resume --agent gsd
```

3. Run handoff once there is active state:

```powershell
.\.holistic\system\holistic.cmd handoff
```

4. Re-check in UI.

Verify:
- Continuity status is no longer `missing`.

---

## 6) Workflow State (phase + confidence)

## What you can see

Phase values:
- `no-data`
- `import-only`
- `active`
- `stalled`
- `blocked`

Confidence bands:
- 70–100% (high)
- 40–69% (medium)
- 0–39% (low)

You also see **Evidence** and **Reasons**. These are your debugging surfaces.

## Why this matters

Phase tells current execution posture; confidence tells how trustworthy that interpretation is.

## What to do by phase

### A) `no-data`

Do this:
1. Go to Import Controls.
2. Run all three imports: milestones, requirements, decisions.
3. Re-check phase/confidence.

Verify:
- Evidence now includes imported artifact counts.

### B) `import-only`

Do this:
1. Import whichever artifact classes are missing (usually requirements + decisions).
2. Resolve import warnings.
3. Re-check.

Verify:
- Phase moves toward `active`.
- Confidence increases.

### C) `active`

Do this:
1. Move directly to Next Action.
2. Execute recommended work.
3. Keep continuity healthy during execution.

Verify:
- Next Action remains clear or only shows soft blockers.

### D) `stalled`

Do this:
1. Refresh continuity (handoff/checkpoint).
2. Re-import stale planning artifacts.
3. Re-check Evidence/Reasons.

Verify:
- Stale reasons disappear or are reduced.

### E) `blocked`

Do this:
1. Read Next Action blockers line-by-line.
2. Resolve readiness/continuity blockers first.
3. Re-check.

Verify:
- Phase leaves `blocked`.

---

## 7) Next Action (execution trigger)

## What you can see

- Status badge: `Blocked` or `Clear`
- Action sentence
- Rationale sentence
- Blockers list
- Suggested command (when available)

## Why this matters

This is the highest-value panel for deciding immediate work.

## Action patterns and exact response

### “Bootstrap the workflow stack before continuing.”

Do this:
1. Resolve all required readiness gaps (Section 4C).
2. Re-check.

Verify:
- Blocker list clears or shrinks.

### “Refresh continuity before continuing.”

Do this:
1. Run handoff/resume flow (Section 5E/5F).
2. Re-check continuity and Next Action.

Verify:
- No continuity blocker remains.

### “Import planning artifacts.”

Do this:
1. Use Import Controls.
2. Import missing artifact classes.
3. Resolve warnings.
4. Re-check Workflow State.

Verify:
- Imported counts appear and phase improves.

### “Import requirements for fuller planning coverage.”

Do this:
1. Run Requirements import.
2. Confirm requirements now appear in imported list.
3. Re-check confidence.

Verify:
- Requirements count > 0 and confidence increases.

### “Review the current plan and continue execution.”

Do this:
1. Use open loops to choose highest-impact pending item.
2. Execute that item in your normal workflow toolchain.
3. Update continuity/handoff before switching context.

Verify:
- Open loops trend down over sessions.

---

## 8) Open Loops (work risk map)

## What you can see

Summary counts:
- unresolved requirements
- pending milestones
- blocked milestones
- deferred items

Detailed lists:
- blocked milestones
- unresolved requirements
- deferred items
- revisable decisions

## Why this matters

Open Loops tells you where hidden delivery risk is accumulating.

## What to do

### If blocked milestones > 0
1. Prioritize unblock before new scope.
2. Resolve dependency/decision causing block.
3. Re-check blocked count.

### If unresolved requirements > 0
1. Review each unresolved requirement.
2. Choose: validate now, defer intentionally, or re-scope.
3. Re-check unresolved count.

### If deferred items > 0
1. Confirm defer is still intentional.
2. Promote only when needed for current milestone.

### If revisable decisions > 0
1. Revisit only when it unblocks current work or reduces risk.
2. Avoid churn on stable decisions without trigger evidence.

---

## 9) Import Controls (recency + parser health)

## What you can see

Per artifact class (Milestones, Requirements, Decisions):
- status: `success` / `partial` / `failed` / `none`
- warning count
- summary

## Why this matters

Panel intelligence is only as good as imported source quality and recency.

## What to do by status

### `success`
- No remediation needed.
- Optional: if Workflow State still says stale/no-data, import the other artifact classes too.

### `partial`
1. Expand warnings in Import Controls.
2. Open the source doc named in the artifact label.
3. Fix exactly the line(s) mentioned by warning text.
4. Re-import that artifact.
5. Re-check warning count.

### `failed`
1. Read the import summary first (it usually states missing file vs parse problem).
2. Apply the matching fix from the failure matrix below.
3. Re-import until status becomes `partial` or `success`.

### `none`
1. Run initial import for that artifact class.
2. Continue until all three classes have at least one successful/partial run.

## Import failure matrix (what you’ll see → what to do)

Use this table when an import fails or warns.

| What you see in UI/API | What it means | Recommended next steps | How to verify fix |
|---|---|---|---|
| `No .gsd/PROJECT.md artifact found for this project` (or REQUIREMENTS/DECISIONS variant) | The expected source file is missing from the repo (or not discovered yet). | 1) Create the missing file at the exact path under `.gsd/`. 2) Add minimally valid content (examples below). 3) Run workspace scan/reselect project. 4) Re-run import. | Import status for that artifact changes from `failed/none` to `partial/success`; summary no longer says artifact not found. |
| `Artifact file not found on disk: ...` | Artifact was detected previously, but file path no longer exists (moved/deleted/renamed). | 1) Restore file at expected path or fix the path by rescanning workspace. 2) Re-import. | Import summary stops reporting missing-on-disk path. |
| Milestones: `No milestone section found in .gsd/PROJECT.md` | PROJECT.md exists but lacks parseable milestone section heading. | 1) Add a milestone section heading like `## Milestones` (or milestone sequence heading). 2) Add bullet milestone lines with IDs. 3) Re-import milestones. | Milestone import status becomes `partial/success`; milestones appear in Imported Milestones list. |
| Milestones: `Milestone section found, but no valid milestone lines were parsed` | Heading exists, but lines are not parseable milestone entries. | 1) Format lines as bullets including `M###` key and title. 2) Example: `- [ ] M001: Core foundation`. 3) Re-import milestones. | Warnings reduce; imported milestone count > 0. |
| Requirements: `No requirements were imported from .gsd/REQUIREMENTS.md` and warning `No requirement blocks found...` | REQUIREMENTS.md exists but has no parseable requirement blocks. | 1) Add requirement headings like `### R001 — <title>`. 2) Include at least `- Description: ...` and optional status/validation fields. 3) Re-import requirements. | Requirements import changes to `partial/success`; imported requirements list populates. |
| Decisions: `No decisions were imported from .gsd/DECISIONS.md` with warning `No supported decision entries found...` | DECISIONS.md exists but has no parseable table rows or supported bullet entries. | 1) Add decision entries in supported format (decision table row or bullet decision lines). 2) Re-import decisions. | Decisions import changes to `partial/success`; imported decisions list populates. |
| Status is `partial` with warning count > 0 | Import succeeded but parser skipped one or more items due to formatting/content issues. | 1) Work warning-by-warning. 2) Fix source lines. 3) Re-import same artifact. 4) Repeat until warnings are understood or eliminated. | Warning count decreases; summary stabilizes; downstream panel confidence/reasons improve. |

### Minimal valid content examples (quick bootstrap)

Use these only to get unblocked quickly, then replace with your real project content.

**`.gsd/PROJECT.md` milestone example**

```md
## Milestones
- [ ] M001: Initial milestone
```

**`.gsd/REQUIREMENTS.md` requirement example**

```md
## Active
### R001 — First requirement
- Description: Define the first shippable requirement.
```

**`.gsd/DECISIONS.md` simple decision example**

```md
- Use local-first planning artifacts as source of truth.
```

Verify after any import:
- status updates,
- warnings reduce or are understood,
- imported entity lists populate,
- Workflow State evidence/reasons update accordingly.

---

## 10) Concrete operating scenarios

## Scenario A — “I opened a repo and everything looks broken”

1. Check Readiness.
2. If `missing`, perform Section 4C bootstrap exactly.
3. Check Continuity.
4. If `missing` or `stale+missing hygiene`, perform Section 5E/5F.
5. Run imports (Section 9).
6. Re-check until Next Action is no longer hard-blocked.

## Scenario B — “I’m active but low confidence”

1. Read Workflow reasons.
2. Fix whichever is flagged: missing artifacts, stale imports, stale/missing continuity.
3. Re-check confidence.
4. Proceed only when confidence is acceptable for risk level.

## Scenario C — “I have 8 repos; what should I touch today?”

1. Prefer repos with:
   - Readiness `ready`
   - Continuity not missing
   - Next Action clear
   - meaningful open-loop impact
2. Use blocked repos only if your goal is unblock.

## Scenario D — “End of day”

1. Leave repo in explicit continuity state (handoff/checkpoint).
2. Ensure imports/planning are not mid-broken.
3. Stop services.

---

## 11) FAQ

### Why do milestone IDs skip numbers (for example M001, M002, M007)?

Milestone IDs are durable identifiers. They are not always contiguous in the roadmap snapshot if intermediate planned milestones were superseded/merged/retired.

### Why do I sometimes see weird terminal glyphs around Vite output?

That is usually encoding/font mismatch, not app failure. Launcher service windows are configured to force UTF-8 output to reduce this issue.

---

## 12) Appendix — command quick reference

```bash
npm run cc:shortcut
npm run cc:doctor
npm run cc:launch
npm run cc:launch -- -NoBrowser
npm run cc:stop
npm run build
```

Planning truth sources:
- [ROADMAP.md](../ROADMAP.md)
- `.gsd/`
- `.holistic/`
