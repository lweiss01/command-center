# Command Center

Command Center is a **local-first planning cockpit** for code repositories.

It pulls planning state you already maintain (GSD docs, Holistic continuity artifacts, roadmap summaries), normalizes it into a canonical SQLite model, and answers:

- Where is this repo in the workflow loop?
- What is actually proven complete vs only written down?
- What is blocked right now, and what should happen next?
- How does this compare across all repos?

---

## ✨ Current Progress Snapshot

| Milestone | Status | What it delivered |
|---|---|---|
| M001 | ✅ complete | Import-first foundation: discovery, artifact detection, canonical SQLite model, plan API |
| M002 | ✅ complete | Resume-first cockpit: workflow state, continuity hygiene, readiness detection, cross-repo portfolio view |
| M003 | ✅ complete | Bootstrap assistant: gap detection → staged plan → template preview → safe apply → machine-level install guidance → audit trail with drift signals |
| M004 | ✅ complete | Validation and proof model: SUMMARY import, claimed-vs-proven milestone tracking, requirement traceability, Proof panel |
| M005 | ✅ complete | Health score + repair queue: unified repo health grade, contributor breakdown, portfolio health badges, prioritized repair queue in cockpit |
| M006 | ✅ complete | Sharp ecosystem expansion: auto-import on scan, add project by path, first-run onboarding card, repo tagging (active/minimal/archive) |

For full planning detail, see [.gsd/milestones/](.gsd/milestones/) or the [GSD roadmap](.gsd/milestones/M004/M004-ROADMAP.md).

---

## 🧠 What Works Today

### Planning ingestion + normalization

- Workspace project discovery (scans a configured root path)
- Source artifact detection for GSD and Holistic files
- Canonical SQLite planning model (`mission_control.db`)
- Plan snapshot API (`GET /api/projects/:id/plan`)
- Imports from repo-local planning docs:
  - `.gsd/PROJECT.md` → milestones
  - `.gsd/REQUIREMENTS.md` → requirements
  - `.gsd/DECISIONS.md` → decisions
  - `.gsd/milestones/**/S##-SUMMARY.md` → proof signals (via Import Summaries)
- Import provenance, recency, and warning tracking

### Workflow intelligence panels

- **Next Action** — blocker-aware recommendation with suggested command
- **Workflow State** — phase + additive confidence model with evidence and reasons
- **Health** — unified repo health score (0–100%), grade (A–F, or – for archived), contributor breakdown showing which signals (continuity, readiness, checkpoint hygiene, import recency, proof coverage) contribute to the score
- **Proof** — claimed vs proven milestone status, requirement traceability, Import Summaries trigger
- **Bootstrap Plan** — staged repo-first setup derived from readiness gaps
- **Readiness** — per-component stack audit (GSD, Holistic, Beads)
- **Continuity** — Holistic freshness, checkpoint hygiene, handoff command
- **Open Loops** — next milestone, blocked milestones, unresolved requirements, deferred items, revisable decisions
- **Milestones / Requirements / Decisions** — imported planning entities with provenance labels
- **Import** — per-artifact import controls with status, warnings, and re-sync buttons

### Bootstrap assistant (M003)

- Detects workflow stack gaps (missing GSD dirs, docs, Holistic, CLI tools)
- Generates a staged plan: repo-local steps first, machine-level second
- Template presets (`minimal` / `starter`) with file preview before apply
- Preflight checks + conflict detection before every apply
- Safe apply engine with explicit confirmation gates
- Machine-level install assistant: OS-aware commands (npm/brew/winget), clipboard copy, verify round-trip
- Stage gate — blocks machine-level steps until all repo-local steps are complete
- Audit trail: every applied action persisted in SQLite with drift detection
- Drift signals: alerts when a previously-applied component goes missing again

### Proof model (M004)

- Scans `.gsd/milestones/**/S##-SUMMARY.md` for `verification_result` and `## Requirements Validated` sections
- Upgrades milestone `proof_level` from `claimed` → `proven` when slice summaries show passing verification
- Writes requirement proof links (which slice validated which requirement, with proof text)
- +0.10 confidence increment in workflowState when proven milestones exist
- **Proof panel** in cockpit: ✓/○ per milestone, summary counts, expandable requirement traceability
- One-click **Import Summaries** button refreshes proof data on demand

### Health score and repair queue (M005)

- Unified **repo health score** (0–100%) and grade (A–F, or – for archived repos)
- Health breakdown shows per-signal contributions:
  - Continuity status (fresh/stale/missing): 0–25%
  - Checkpoint hygiene (ok/stale/missing): 0–10%
  - Readiness gaps: 0–25%
  - Import recency (≤7 days/≤30 days/older): 0–20%
  - Proof coverage (proven/total milestones): 0–20%
- Health panel in repo detail view with grade badge, contributor breakdown, and status for each signal
- **Repair queue**: prioritized list of actionable fixes with severity badges (critical/high/medium/low) and one-click navigation to the right panel
- Portfolio cards show health grade at a glance

### Auto-import and repo tagging (M006)

- **Auto-import on scan**: running a workspace scan automatically imports planning data for any newly discovered project with GSD docs — no manual import button required
- **Add project by path**: type a directory path into the "New" input and add a project without running a full workspace scan
- **First-run onboarding**: projects with planning docs but zero imports show a prominent "Import All" card — one click to populate milestones, requirements, and decisions
- **Repo tagging**: tag repos as `active`, `minimal`, or `archive`
  - `archive`: removes repo from health scoring (grade becomes –) and sinks it to the bottom of the urgency-sorted portfolio
  - `minimal`: skips import recency and proof coverage penalties in health scoring — useful for small/experimental repos that don't maintain full GSD artifacts
  - Tag selector in project detail header; tags shown in portfolio cards

### Cross-repo portfolio view

- `GET /api/portfolio` — urgency-scored portfolio across all discovered projects
- Cards show phase, continuity status, readiness, health grade, and repo tag at a glance
- Sort by urgency (default) or name
- Urgency scoring considers continuity freshness, open loops, readiness gaps, and repo health
- Archive-tagged repos sink to the bottom of the urgency sort

### Windows launcher ergonomics

- One-click desktop **Launch** shortcut
- One-click desktop **Stop** shortcut
- `cc:doctor` preflight diagnostics
- Logs to `.logs/command-center-backend.log` and `.logs/command-center-frontend.log`

---

## 📋 Requirements

- Node.js 20+ (tested with Node 24)
- npm
- Windows PowerShell (for launcher scripts)
- GSD and Holistic CLIs (optional — readiness detection will show them as missing if absent)

---

## ⚙️ Quick Start

### 1) Clone and install

```bash
git clone https://github.com/lweiss01/command-center.git
cd command-center
npm install
```

### 2) Create desktop shortcuts (Windows)

```bash
npm run cc:shortcut
```

Creates:
- `Command Center.lnk` — Launch
- `Command Center (Stop).lnk` — Stop

### 3) Run preflight diagnostics

```bash
npm run cc:doctor
```

PASS/WARN/FAIL checks for host tooling, ports, shortcuts, and logs.

### 4) Launch

Desktop: double-click **Command Center**

Terminal:
```bash
npm run cc:launch
```

### 5) Verify the app is running

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api/projects`

### 6) Stop services

Desktop: double-click **Command Center (Stop)**

Terminal:
```bash
npm run cc:stop
```

---

## 🔁 Daily Operating Flow

1. Launch (`cc:launch` or desktop shortcut)
2. Select a project card from the portfolio list
3. Read panels in this order:
   1. **Health** — unified score and repair queue (if any)
   2. **Readiness** — is the workflow stack present?
   3. **Continuity** — is context safe to resume?
   4. **Workflow State** — what phase and confidence?
   5. **Proof** — what is actually proven vs claimed?
   6. **Next Action** — what should happen now?
   7. **Open Loops** — what is still unresolved?
4. Apply fixes from the **Repair Queue** (shown in Health panel) — items are prioritized by severity
5. Use **Bootstrap Plan** to repair any missing workflow stack components
6. Run the suggested command from Next Action when blocked
7. Use **Import Summaries** (in the Proof panel) after completing work to update proof status
8. Stop services when done (`cc:stop`)

**For new projects:**
- If you just scanned and the project has GSD docs, imports happen automatically
- If it shows a "First Run" card, click **Import All** to populate milestones, requirements, and decisions
- If it has no GSD docs yet, use the **Bootstrap Plan** to initialize

**For repos you don't actively maintain:**
- Tag as `minimal` (if it has basic planning but no proof artifacts) or `archive` (if truly inactive)
- Archive-tagged repos drop to the bottom of the portfolio and show grade – instead of A–F

---

## 🧰 Command Reference

| Command | What it does |
|---|---|
| `npm run cc:shortcut` | Create/update Launch + Stop desktop shortcuts |
| `npm run cc:doctor` | Run launcher preflight diagnostics |
| `npm run cc:launch` | Start backend + frontend and open browser |
| `npm run cc:launch -- -NoBrowser` | Start backend + frontend without opening browser |
| `npm run cc:stop` | Stop backend/frontend on ports 3001/5173 |
| `npm run dev` | Start Vite frontend only (dev mode) |
| `node server.js` | Start backend only |
| `npm run build` | Type-check + production build |

---

## 🌐 API Surface

| Endpoint | What it does |
|---|---|
| `GET /api/projects` | List all discovered projects |
| `POST /api/scan` | Trigger workspace scan (auto-imports GSD docs for newly discovered projects) |
| `POST /api/projects/add` | Add project by path without full workspace scan |
| `GET /api/projects/:id/plan` | Full plan snapshot (workflow state, proof, bootstrap, open loops, health, repair queue, etc.) |
| `GET /api/portfolio` | Cross-repo urgency-scored portfolio with health grades |
| `POST /api/projects/:id/import-gsd-project` | Import milestones from PROJECT.md |
| `POST /api/projects/:id/import-gsd-requirements` | Import requirements from REQUIREMENTS.md |
| `POST /api/projects/:id/import-gsd-decisions` | Import decisions from DECISIONS.md |
| `POST /api/projects/:id/import/summaries` | Import proof signals from SUMMARY.md files |
| `POST /api/projects/:id/tag` | Update repo tag (active/minimal/archive) |
| `GET /api/projects/:id/bootstrap/preflight` | Pre-flight check before applying a bootstrap step |
| `POST /api/projects/:id/bootstrap/apply` | Apply a bootstrap step (repo-local only) |
| `GET /api/projects/:id/bootstrap/verify-tool` | Re-probe a machine tool after install |
| `GET /api/projects/:id/bootstrap/audit` | Bootstrap action history + drift detection |
| `GET /api/projects/:id/proof` | Requirement proof traceability |

---

## 🧯 Troubleshooting Quick Matrix

| Symptom | Command to run | Where to inspect |
|---|---|---|
| Launch shortcut does nothing | `npm run cc:shortcut` | Desktop (`Command Center*.lnk`) |
| Launch hangs / fails | `npm run cc:doctor` then `npm run cc:launch -- -NoBrowser` | `.logs/command-center-backend.log`, `.logs/command-center-frontend.log` |
| Ports already in use | `npm run cc:stop` | Re-run `npm run cc:doctor` |
| Old server still running (stale code) | Kill by PID: `powershell -c "Get-NetTCPConnection -LocalPort 3001 \| ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force }"` | Re-run `npm run cc:launch` |
| Clean reset | `npm run cc:stop` then `npm run cc:launch -- -NoBrowser` | Launcher console + `.logs/*` |

For full panel-by-panel guidance, see [docs/USER-GUIDE.md](./docs/USER-GUIDE.md).

---

## 🏗️ Tech Stack

- React 19 + TypeScript
- Vite
- Express 5
- better-sqlite3
- Tailwind CSS v4

---

## 🧭 Repo Planning Context

- [docs/USER-GUIDE.md](./docs/USER-GUIDE.md) — panel-by-panel operator playbook
- [HOLISTIC.md](./HOLISTIC.md) — continuity and handoff state
- [AGENTS.md](./AGENTS.md) — agent startup instructions
- `.gsd/` — milestone/slice/task planning, summaries, and proof artifacts
- `.holistic/` — Holistic continuity artifacts
