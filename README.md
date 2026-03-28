# 🚀 Command Center

Command Center is a **local-first planning cockpit** for code repositories.

It pulls planning state you already maintain (GSD/GSD2 docs, Holistic context, roadmap artifacts), normalizes it, and helps you answer:

- Where is this repo in the workflow loop?
- What is blocked right now?
- What should happen next?
- How does this compare across repos?

---

## ✨ Current Progress Snapshot

Milestone status (current):

- ✅ **M001 complete** — import-first foundation
- ✅ **M002 complete** — resume-first cockpit intelligence + trust surfaces
- ✅ **M007 complete** — launcher hardening + cockpit actionability iteration
- ⏳ No active milestone in execution

For planning detail, see [ROADMAP.md](./ROADMAP.md).

### ✅ Latest launcher verification

The launcher lifecycle is verified in this environment:

- `npm run cc:doctor` ✅
- `npm run cc:launch -- -NoBrowser` ✅
- `npm run cc:stop` ✅

Launcher diagnostics and stop now use resilient port probing to avoid earlier PowerShell networking-call hangs in this setup.

---

## 🧠 What Works Today

### Planning ingestion + normalization

- Workspace project discovery
- Source artifact detection
- Canonical SQLite planning model
- Plan snapshot API
- Imports for:
  - `.gsd/PROJECT.md`
  - `.gsd/REQUIREMENTS.md`
  - `.gsd/DECISIONS.md`
- Import provenance + warning tracking

### Cockpit intelligence

- Workflow State panel (confidence + evidence)
- Workflow Readiness panel (stack/component gaps)
- Continuity panel (freshness + checkpoint hygiene)
- Next Action panel (blocker-aware recommendation)
- Open Loops panel (next, blocked, unresolved, deferred)
- Explicit interpreted/provenance labels on trust-sensitive surfaces

### Windows launcher ergonomics

- One-click desktop **Launch** shortcut
- One-click desktop **Stop** shortcut
- Launcher diagnostics command (`cc:doctor`)
- Troubleshooting matrix + logs

### Version visibility

- Footer version is package-driven from `package.json` (`L.W. Hub vX.Y.Z`)

---

## 📋 Requirements

- Node.js 20+ (tested with Node 24)
- npm
- Windows PowerShell (for launcher scripts)

---

## ⚙️ Quick Start

### 1) Clone and install

```bash
git clone <your-repo-url>
cd command-center
npm install
```

### 2) Create desktop shortcuts (Windows)

```bash
npm run cc:shortcut
```

Creates/updates:

- `Command Center.lnk` (Launch)
- `Command Center (Stop).lnk` (Stop)

### 3) Run preflight diagnostics

```bash
npm run cc:doctor
```

You’ll get PASS/WARN/FAIL checks for host tooling, ports, shortcuts, and logs.

### 4) Launch

Desktop:
- Double-click **Command Center**

Terminal:
```bash
npm run cc:launch
```

### 5) Verify app is running

- Frontend: `http://localhost:5173` (or the next port Vite reports)
- Backend API: `http://localhost:3001/api/projects`

### 6) Stop services

Desktop:
- Double-click **Command Center (Stop)**

Terminal:
```bash
npm run cc:stop
```

---

## 🔁 Daily Operating Flow

1. Launch (`cc:launch` or desktop shortcut)
2. Select a project card
3. Read panels in this order:
   - Workflow State
   - Workflow Readiness
   - Continuity
   - Next Action
   - Open Loops
4. Run the suggested command in Next Action when blocked
5. Stop services when done (`cc:stop`)

---

## 🧰 Command Reference

| Command | What it does |
|---|---|
| `npm run cc:shortcut` | Create/update Launch + Stop desktop shortcuts |
| `npm run cc:doctor` | Run launcher preflight diagnostics |
| `npm run cc:launch` | Start backend + frontend and open browser |
| `npm run cc:launch -- -NoBrowser` | Start backend + frontend without opening browser |
| `npm run cc:stop` | Stop backend/frontend listeners on ports 3001/5173 |
| `npm run dev` | Start Vite frontend only |
| `node server.js` | Start backend only |
| `npm run build` | Type-check + production build |

---

## 🧯 Troubleshooting Quick Matrix

| Symptom | Command to run | Where to inspect |
|---|---|---|
| Launch shortcut does nothing | `npm run cc:shortcut` | Desktop shortcuts (`Command Center*.lnk`) |
| Launch hangs/fails readiness | `npm run cc:doctor` then `npm run cc:launch -- -NoBrowser` | `.logs/command-center-backend.log`, `.logs/command-center-frontend.log` |
| Ports already in use | `npm run cc:stop` | Re-run `npm run cc:doctor` |
| Need a clean reset | `npm run cc:stop` then `npm run cc:launch -- -NoBrowser` | Launcher console + `.logs/*` |

For full walkthroughs and panel-by-panel guidance, see [docs/USER-GUIDE.md](./docs/USER-GUIDE.md).

---

## 🏗️ Tech Stack

- React 19
- TypeScript
- Vite
- Express
- better-sqlite3
- Tailwind CSS

---

## 🧭 Repo Planning Context

This repo keeps planning + continuity artifacts close to the code:

- [ROADMAP.md](./ROADMAP.md)
- [HOLISTIC.md](./HOLISTIC.md)
- [AGENTS.md](./AGENTS.md)
- `.holistic/` continuity artifacts
- `.gsd/` milestone/slice/task planning and summaries
