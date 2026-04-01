# Command Center User Guide (Operator Playbook)

This guide explains **how to use Command Center to drive real work**.

It is intentionally procedural:

- what you can see,
- what each state means,
- exactly what to do next,
- how to verify your fix worked.

If you only need install/start/stop commands, see [README.md](../README.md).

Tip: the app header includes a **User Guide** button that opens this guide in a new tab.

---

## 1) Your goal in Command Center

Your target is to move a repo into a **clear execution state**:

- Health = `A` or `B` (or `–` if intentionally archived)
- Readiness = `ready`
- Continuity Status = `fresh` (or at least not missing)
- Checkpoint Hygiene = `ok` (or at least not missing)
- Workflow State = `active`
- Proof = at least one milestone `proven`
- Next Action = `Clear`
- Repair Queue = empty (or all low-severity items you're deferring intentionally)

When any panel is not in that state, Command Center is telling you where risk is.

---

## 2) Fast daily workflow (10 minutes)

For each repo you plan to touch today:

1. Open Command Center and select the repo card from the portfolio.
2. Check panels in this order:
   1. **Health** — what's the overall grade? Any critical repairs needed?
   2. **Readiness** — is the workflow stack present?
   3. **Continuity** — is context safe to resume?
   4. **Workflow State** — what phase and confidence?
   5. **Proof** — what is actually proven vs only written down?
   6. **Next Action** — what should happen right now?
   7. **Open Loops** — what is still unresolved?
3. Apply the remediation steps in this guide, starting with the Repair Queue if present.
4. Re-check each panel after each fix.
5. Start implementation only after Next Action is clear enough.

Why this order: Health gives you the big picture. Readiness and continuity are foundational. Phase and proof are less trustworthy if either is broken.

---

## 3) Exactly how to "re-check" after a change

You'll see this phrase repeatedly below. Here is the concrete re-check loop:

1. If you changed repo files or tooling outside the app, click **Scan Workspace**.
2. Re-select the project card.
3. In the project detail view:
   - review **Health** grade and repair queue,
   - review **Readiness** badge and gaps,
   - review **Continuity** badge/hygiene note,
   - review **Workflow State** phase + reasons,
   - review **Proof** claimed/proven counts,
   - review **Next Action** blockers.
4. If you edited planning docs (`.gsd/PROJECT.md`, `REQUIREMENTS.md`, `DECISIONS.md`), run the relevant **Import** buttons.
5. After completing milestone/slice work, click **Import Summaries** in the Proof panel.
6. Re-check until the target state is reached.

---

## 4) Health (repo condition overview)

### What you can see

**Grade values:** `A` / `B` / `C` / `D` / `F` / `–` (for archived repos)

**Score:** 0–100%

**Contributor breakdown:** shows which signals contribute to the score:
- Continuity Status (fresh/stale/missing): 0–25%
- Checkpoint Hygiene (ok/stale/missing): 0–10%
- Readiness (ready/partial/missing): 0–25%
- Import Recency (≤7 days / ≤30 days / older): 0–20%
- Proof Coverage (proven milestones / total): 0–20%

Each contributor shows: signal value, contribution amount, max possible, status indicator (✓ ok / ⚠ warn / ✗ danger / — missing), and explanatory note.

**Repair Queue:** if any contributor is degraded, you see a prioritized list of actionable repairs with severity badges (🔴 critical / 🟠 high / 🟡 medium / ⚫ low). Click a repair item to navigate to the relevant panel.

### Why this matters

Health gives you one honest number that combines all workflow hygiene signals. It tells you whether a repo is in good operating shape, not just whether it has planning docs.

### Grade thresholds

| Grade | Score Range | Meaning |
|---|---|---|
| A | 90–100% | Excellent shape — all signals healthy |
| B | 70–89% | Good shape — minor issues only |
| C | 50–69% | Needs attention — multiple degraded signals |
| D | 30–49% | Poor shape — significant gaps |
| F | 0–29% | Critical issues — most signals missing or broken |
| – | n/a | Archived repo (health scoring skipped) |

### What to do by grade

#### A) Grade = `A` or `B`

No health remediation needed. Move to Readiness.

#### B) Grade = `C`, `D`, or `F`

1. Expand the **Repair Queue** in the Health panel.
2. Fix items in order — critical first, then high, medium, low.
3. Each repair item links to the relevant panel (e.g., "Refresh imports" → Import panel, "Run handoff" → Continuity panel).
4. Re-check after each fix — the score updates in real time.

Verify: grade improves, repair queue shrinks.

#### C) Grade = `–` (archived)

This is intentional. Archive-tagged repos bypass health scoring and appear at the bottom of the portfolio. If the repo should be active again, change its tag in the project detail header (see Section 16).

### Repo tagging (affects health)

You can tag repos in the project detail header dropdown:

- **active** (default): full health scoring
- **minimal**: skips import recency and proof coverage penalties — useful for experimental repos or small projects that don't maintain GSD artifacts
- **archive**: removes repo from health scoring entirely (grade becomes `–`) and sinks it to the bottom of the urgency-sorted portfolio

Use `minimal` for repos you want visible but don't want penalized for missing imports/proof. Use `archive` for truly inactive repos.

---

## 5) Readiness (workflow stack gate)

### What you can see

Readiness badge values:

- `ready`
- `partial`
- `missing`

You also see a per-component checklist of what is present (✓) or absent (✗), with required components marked `(req)`.

### Why this matters

Readiness tells you whether the repo and machine have enough workflow infrastructure to trust cockpit recommendations.

### What Command Center checks (required)

A repo is considered fully ready only when all required components are present:

- `.gsd/` directory
- `.gsd/PROJECT.md`
- `.holistic/` directory (repo-local)
- Holistic tool callable on machine
- GSD tool callable on machine

Optional components (shown but not required): GSD v2 workflow file, requirements, decisions, knowledge docs, Beads directory.

### What to do for each value

#### A) Readiness = `ready`

1. No readiness remediation needed.
2. Move to **Continuity**.

#### B) Readiness = `partial`

1. Read the missing required components listed in the Gaps section.
2. Fix repo-level gaps first — use the **Bootstrap Plan** panel (see Section 11) to apply fixes with guided confirmation.
3. Fix machine-tool gaps second using the **Bootstrap Plan** machine-level assistant.
4. Re-scan and re-check.

Verify: gaps list shrinks, readiness moves to `ready`.

#### C) Readiness = `missing` (hard blocker)

Use the **Bootstrap Plan** panel — it will detect all gaps and generate a staged repair plan with one-click apply.

Alternatively, bootstrap manually:

```powershell
mkdir .gsd -ErrorAction SilentlyContinue
mkdir .holistic -ErrorAction SilentlyContinue
if (-not (Test-Path .gsd/PROJECT.md)) { "# Project`n`n## Milestones`n- [ ] M001: First milestone" | Out-File .gsd/PROJECT.md -Encoding utf8 }
```

Then check tools are callable:

```powershell
gsd --version        # or gsd.cmd --version on Windows
holistic --version   # or holistic.cmd --version on Windows
```

Verify: readiness is no longer `missing`.

---

## 6) Continuity (resume safety gate)

### What you can see

**Status values:** `fresh` / `stale` / `missing`

**Checkpoint hygiene values:** `ok` / `stale` / `missing`

Continuity also shows:
- age in hours since last activity
- latest work summary from Holistic state
- handoff command (pre-populated for your OS)

### Why this matters

Continuity protects you from resuming blind and duplicating work or missing known blockers.

### What to do by combination

#### A) `fresh` + `ok` (ideal)

Continue to Workflow State. No remediation needed.

#### B) `fresh` + `stale`

Continue work. Add a checkpoint before switching context.

#### C) `stale` + `ok`

Read latest work context before touching code. Review open loops. Add a fresh handoff when done.

#### D) `stale` + `stale`

Spend 2–5 minutes reconstructing context from roadmap + summaries. Make your first action a verification step.

#### E) `stale` + `missing` (hard blocker)

Run the handoff command shown in the Continuity panel, or:

```powershell
.\.holistic\system\holistic.cmd handoff
```

Re-check until the blocker clears.

Verify: Next Action no longer says "Refresh continuity before continuing."

#### F) `missing` (hard blocker)

Initialize continuity using the repo-local helper:

```powershell
.\.holistic\system\holistic.cmd resume --agent gsd
.\.holistic\system\holistic.cmd handoff
```

Verify: continuity status is no longer `missing`.

---

## 7) Workflow State (phase + confidence)

### What you can see

**Phase values:** `no-data` / `import-only` / `active` / `stalled` / `blocked`

**Confidence:** 0–100%. Higher is more trustworthy.

Confidence is built from additive signals:
- Milestones imported: +15%
- Requirements imported: +20%
- Decisions imported: +10%
- Recent import (within 3 days): +25%
- Fresh continuity: +30%
- Proven milestones (M004+): +10%
- Capped at 100%

You also see **Evidence** (the signals that produced this reading) and **Reasons** (plain-language explanation).

### Why this matters

Phase tells current execution posture. Confidence tells how trustworthy that interpretation is.

### What to do by phase

#### A) `no-data`

Run all three imports: milestones, requirements, decisions (Import section at the bottom of the detail panel). Re-check.

#### B) `import-only`

Import whichever artifact classes are missing. Resolve any import warnings. Re-check.

#### C) `active`

Move to Next Action. Execute recommended work. Keep continuity healthy.

#### D) `stalled`

Refresh continuity (handoff/checkpoint). Re-import stale artifacts. Re-check Evidence/Reasons.

#### E) `blocked`

Read Next Action blockers line by line. Resolve readiness/continuity blockers first. Re-check.

---

## 8) Proof (claimed vs verified)

### What you can see

- Summary pills: **N proven** (green) / **N claimed-only** (muted) / total milestones
- Per-milestone list: ✓ (proven) or ○ (claimed) with title and proof level badge
- **Import Summaries** button — re-parses SUMMARY.md files to refresh proof state
- Collapsible **Requirement proof** section — links each validated requirement to the slice that proved it, with the exact proof text

### Why this matters

Command Center distinguishes between "a milestone is marked done in PROJECT.md" (claimed) and "a SUMMARY.md file exists for that milestone with `verification_result: passed`" (proven). A high-confidence cockpit needs both.

### Proof level definitions

| Level | Meaning |
|---|---|
| `claimed` | Milestone status is `done` in imported planning data, but no passing SUMMARY file has been parsed |
| `proven` | At least one slice SUMMARY for this milestone has `verification_result: passed` — evidence exists in the repo |

### What to do

**After completing milestone or slice work:**
1. Click **Import Summaries** in the Proof panel.
2. Verify the milestone upgrades from `claimed` to `proven`.
3. Expand Requirement proof to confirm validated requirements have traceability entries.

**If a milestone stays `claimed` after Import Summaries:**
- Confirm the SUMMARY.md file exists under `.gsd/milestones/M###/slices/S##/S##-SUMMARY.md`
- Confirm the frontmatter contains `verification_result: passed`
- Run Scan Workspace, then Import Summaries again

**If requirement proof links are missing:**
- Confirm the relevant slice SUMMARY has a `## Requirements Validated` section
- Format: `- R001 — <proof text describing what was verified>`
- Re-run Import Summaries

---

## 9) Bootstrap Plan (workflow stack repair)

### What you can see

- Overall status badge: `ready` / `needs-bootstrap` / `blocked`
- Summary counts: N repo-local steps, N machine-level steps
- Drift badge (if any previously applied component is now missing again)
- **Template selector**: `minimal` (placeholders only) / `starter` (more complete stubs)
- Per-step cards with rationale, risk level, and action buttons
- **Action history** toggle — collapsible audit trail of every applied bootstrap action

### How the staged plan works

Bootstrap steps are always ordered repo-local first, machine-level second:

**Repo-local steps** (can be applied automatically):
- Create `.gsd/` directory
- Create GSD planning docs (`PROJECT.md`, `REQUIREMENTS.md`, `DECISIONS.md`, `KNOWLEDGE.md`, `preferences.md`)
- Initialize Holistic (`.holistic/`)

**Machine-level steps** (instructions only — cannot be applied automatically):
- Install GSD CLI
- Install Holistic CLI

### Stage gate

The machine-level section is locked (buttons greyed, warning banner shown) until all repo-local steps are complete. This ensures you have a functioning repo skeleton before touching machine-level configuration.

### Applying a repo-local step

1. Click **Apply** on a step.
2. A confirmation panel opens showing:
   - the step's rationale
   - a conflict warning (if the file/directory already exists)
   - a file preview of what will be created (for doc stubs)
   - the risk level
3. Click **Confirm** to apply, or **Cancel** to abort.
4. The step marks as done; the plan refreshes.

To undo: delete the path shown in the undo hint (appears after successful apply).

### Machine-level install steps

1. Repo-local steps must all be complete first (stage gate).
2. Click **View Instructions** on a machine-level step.
3. An install panel opens showing:
   - the recommended install command for your OS (npm / brew / winget tab selector)
   - a **Copy** button (clipboard, 2s feedback)
4. Run the command in your terminal.
5. Click **I installed this — verify** to re-probe tool presence.
   - If found: step marks as done.
   - If not found: inline error with guidance to retry.

### Drift detection

If you previously applied a step and the created file/directory is later deleted or moved, the action history entry shows a `drift` indicator and a warning appears on the step card. Re-apply the step to clear the drift.

---

## 10) Continuity Panel (detail)

### What you can see

In addition to what is described in Section 5:

- **Handoff command** — the exact command to run for your OS (Windows: `holistic.cmd`, macOS/Linux: `holistic`)
- **Checkpoint count** and **last checkpoint reason**
- Hygiene states: `ok` (recent checkpoint), `stale` (checkpoint exists but old), `missing` (no checkpoint recorded)

### When to use the handoff command

- Before switching to a different repo
- Before ending a session
- After any significant decision or context shift

---

## 11) Open Loops (work risk map)

### What you can see

Summary counts: unresolved requirements / pending milestones / blocked milestones / deferred items

Detailed lists:
- **Next milestone** — first non-done milestone
- **Blocked milestones** — milestones in blocked status
- **Unresolved requirements** — active requirements without validated proof (capped at 5, with overflow count)
- **Deferred items** — requirements or decisions intentionally deferred
- **Revisable decisions** — decisions whose `revisable` field starts with "yes"

### Why this matters

Open Loops tells you where hidden delivery risk is accumulating.

### What to do

**If blocked milestones > 0:** Prioritize unblocking over new scope.

**If unresolved requirements > 0:** For each: choose validate now, defer intentionally, or re-scope.

**If deferred items > 0:** Confirm defer is still intentional. Promote only when needed for current milestone.

**If revisable decisions > 0:** Revisit only when it unblocks current work or reduces risk. Avoid churn without trigger evidence.

---

## 12) Import Controls (recency + parser health)

### What you can see

Per artifact class (Milestones, Requirements, Decisions):
- Status: `success` / `partial` / `failed` / `none`
- Warning count and summary

Also: **Import Summaries** (in the Proof panel) for proof signal refresh.

### What to do by status

**`success`** — No remediation needed.

**`partial`** — Expand warnings. Open the source doc named in the warning. Fix the flagged lines. Re-import.

**`failed`** — Read the import summary (it usually states the problem). Apply the fix from the failure matrix below. Re-import until `partial` or `success`.

**`none`** — Run initial import for that artifact class.

### Import failure matrix

| What you see | What it means | Fix |
|---|---|---|
| `No .gsd/PROJECT.md artifact found` | Source file missing or not yet scanned | Create the file, Scan Workspace, re-import |
| `Artifact file not found on disk` | File was moved/deleted after last scan | Restore file or rescan workspace, re-import |
| `No milestone section found in .gsd/PROJECT.md` | PROJECT.md exists but lacks a parseable `## Milestones` heading | Add heading + milestone bullet lines, re-import |
| `No valid milestone lines were parsed` | Heading exists but line format is not parseable | Use format `- [ ] M001: Title`, re-import |
| `No requirement blocks found` | REQUIREMENTS.md has no `### R001 — Title` blocks | Add requirement headings + descriptions, re-import |
| `No decision entries found` | DECISIONS.md has no table rows or bullet decisions | Add decision entries in supported format, re-import |
| `status: partial` with warnings | Parse succeeded but some items were skipped | Fix flagged lines one by one, re-import |

### Minimal valid content examples

**`.gsd/PROJECT.md`**

```md
## Milestones
- [ ] M001: Initial milestone
```

**`.gsd/REQUIREMENTS.md`**

```md
## Active
### R001 — First requirement
- Description: Define the first shippable requirement.
```

**`.gsd/DECISIONS.md`**

```md
| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | Initial | architecture | Source of truth | Repo-local docs | Portable and inspectable | Yes | human |
```

---

## 13) Cross-repo portfolio view

### What you can see

The left column shows all discovered projects as cards. Each card shows:

- Phase badge (active / stalled / blocked / no-data / import-only)
- Health grade (A–F or – for archived)
- Continuity status and age
- Readiness status
- Repo tag (minimal / archive) if set — active repos show no tag badge

Cards are sorted by urgency score (default) or name (toggle at top).

Archive-tagged repos always sink to the bottom of the urgency sort.

### Adding projects

- **Scan Workspace** button: scans configured workspace root and auto-imports planning data for any newly discovered projects with GSD docs
- **New** input at bottom of sidebar: type a directory path and press Enter to add a project without running a full workspace scan

### Urgency scoring

Urgency is computed from:
- Fresh continuity: +40%
- Unresolved requirements: +25%
- Stalled/no-data phase with non-missing continuity: +20%
- Readiness gaps: +15%

Archive-tagged repos get urgency = -1 (forced to bottom).

Higher urgency = repo deserves attention sooner.

### What to do

**Prioritize repos with:**
- Health grade A or B + Continuity not missing + Next Action clear (for active execution)
- High urgency score (for triage)

**Use blocked repos** only when your goal is to unblock them.

**Tag repos appropriately:**
- Leave active repos untagged or explicitly `active`
- Tag experimental/small repos as `minimal` if you don't want import recency or proof penalties
- Tag truly inactive repos as `archive` to remove them from health scoring and sink them to the bottom

---

## 14) Concrete operating scenarios

### Scenario A — "I just scanned a new project and it has GSD docs"

1. If the project is brand new to Command Center: imports happen automatically during scan.
2. If it shows a **First Run** onboarding card: click **Import All** to populate milestones, requirements, and decisions in one click.
3. Re-check: panels should now show data instead of being empty.

### Scenario B — "I opened a repo and everything looks broken"

1. Check Health → if repair queue has items, start there (click each to navigate to the right panel).
2. Check Readiness → if `missing`, use Bootstrap Plan (or Section 5C manual bootstrap).
3. Check Continuity → if `missing`, run resume/handoff (Section 6F).
4. Run all three imports if needed (Section 12).
5. Re-check until Next Action is no longer hard-blocked.

### Scenario C — "I'm active but health/confidence is low"

1. Check **Health panel** repair queue — apply fixes in priority order.
2. Read Workflow State reasons.
3. Fix whichever signal is flagged: missing artifacts, stale imports, stale/missing continuity.
4. Run Import Summaries in the Proof panel if milestones are showing `claimed` after actual completion.
5. Re-check health grade and confidence.

### Scenario D — "I have several repos; what should I touch today?"

1. Open the portfolio list (left column).
2. Sort by urgency (default).
3. Prioritize: health grade A or B + non-missing continuity + clear Next Action.
4. Use blocked repos only if your goal is unblocking.
5. Tag repos as `minimal` (experimental) or `archive` (inactive) to remove noise from the portfolio.

### Scenario E — "I just completed a milestone/slice"

1. Run `holistic handoff` to record the session.
2. Click **Import Summaries** in the Proof panel to upgrade proof status.
3. Verify the milestone now shows ✓ `proven`.
4. Check Health grade — proof coverage should improve.
5. Check Open Loops — unresolved requirement count should decrease.

### Scenario F — "I want to add a specific repo without scanning my entire workspace"

1. Type or paste the repo directory path into the **New** input at the bottom of the portfolio sidebar.
2. Press Enter.
3. The project is added and auto-imported if it has GSD docs.

### Scenario G — "End of day"

1. Run handoff from the Continuity panel command.
2. Ensure imports are not mid-broken (no `failed` import runs).
3. Stop services: `npm run cc:stop`.

---

## 15) FAQ

### Why do milestone IDs sometimes skip numbers?

Milestone IDs are durable identifiers. They are not always contiguous — intermediate milestones may have been merged, superseded, or retired without renumbering.

### Why does Proof show milestones as `claimed` when they are clearly done?

Click **Import Summaries** in the Proof panel. Proof requires parsing SUMMARY.md files in `.gsd/milestones/` — it is not inferred from PROJECT.md alone. The Import Summaries button re-scans those files and upgrades proof level.

### What's the difference between `minimal` and `archive` tags?

- **minimal**: repo still shows up normally in the portfolio, but health scoring skips import recency and proof coverage penalties — useful for experimental repos or small projects you're actively working on but don't maintain full GSD artifacts for
- **archive**: repo health grade becomes `–`, repo sinks to the bottom of urgency sort, and it's effectively invisible unless you scroll — use this for truly inactive repos you want to keep in the workspace but never see

### When should I use auto-import vs manual import buttons?

Auto-import happens during workspace scans for **newly discovered** projects with GSD docs. If you edit planning docs for an **existing** project, you need to click the manual import buttons (Milestones, Requirements, Decisions) to refresh that data.

### What's the "First Run" card?

If you open a project that has planning docs (`.gsd/PROJECT.md`, etc.) but has never been imported before, Command Center shows a prominent "Import All" card instead of empty panels. Click it to import milestones, requirements, and decisions in one action.

### Why does the Bootstrap Plan stage gate block my machine-level steps?

The stage gate is intentional: repo-local steps (creating directories and files) should be complete before machine-level tool installs, because the tool install may depend on the repo being properly initialized.

### Why do I see weird terminal glyphs around Vite output?

Usually encoding/font mismatch in the terminal, not an app failure. Launcher scripts force UTF-8 output to reduce this.

### The backend is still running after I killed it — how do I force-kill it?

```powershell
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### What determines my repo's health grade?

Five signals contribute to the score:
- Continuity status (fresh/stale/missing): up to 25%
- Checkpoint hygiene (ok/stale/missing): up to 10%
- Readiness (ready/partial/missing): up to 25%
- Import recency (≤7 days excellent, ≤30 days ok, older degraded): up to 20%
- Proof coverage (proven milestones / total): up to 20%

Grade thresholds: A=90+, B=70-89, C=50-69, D=30-49, F=0-29, –=archived

---

## 16) Appendix — command quick reference

```bash
npm run cc:shortcut       # Create/update desktop shortcuts
npm run cc:doctor         # Preflight diagnostics
npm run cc:launch         # Start backend + frontend + open browser
npm run cc:launch -- -NoBrowser   # Start without opening browser
npm run cc:stop           # Stop services on ports 3001/5173
npm run build             # Type-check + production build
npm run dev               # Frontend dev server only
node server.js            # Backend only
```

Planning truth sources for this repo:
- [README.md](../README.md) — overview + quick start
- [.gsd/](../.gsd/) — milestone, slice, task planning and summaries
- [.holistic/](../.holistic/) — continuity artifacts
