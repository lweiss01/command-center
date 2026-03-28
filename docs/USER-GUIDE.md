# Command Center User Guide

This guide is the detailed companion to the project README.

If you want the short version, start with [README.md](../README.md).

### Latest verified launcher status

As of this guide update, the launcher flow is verified in this environment:

- `npm run cc:doctor` ✅
- `npm run cc:launch -- -NoBrowser` ✅
- `npm run cc:stop` ✅

Launcher diagnostics and stop now use resilient port probing to avoid the earlier command hangs seen with PowerShell networking probes.

---

## 1. What Command Center is for

Command Center helps you operate multiple repos with less context loss by surfacing:

- imported planning facts (milestones, requirements, decisions)
- interpreted workflow signals (state/readiness/continuity/next action/open loops)
- cross-repo urgency comparison

It is intentionally local-first and docs-first.

---

## 2. First-Time Setup (Windows)

## Step 1 — Install deps

```bash
npm install
```

## Step 2 — Generate shortcuts

```bash
npm run cc:shortcut
```

Expected desktop icons:

- `Command Center.lnk`
- `Command Center (Stop).lnk`

## Step 3 — Run launcher diagnostics

```bash
npm run cc:doctor
```

Interpretation:

- `PASS`: good
- `WARN`: usable, but you may need action (commonly ports already in use)
- `FAIL`: fix before launch

## Step 4 — Launch

```bash
npm run cc:launch
```

or use the `Command Center` desktop icon.

## Step 5 — Stop

```bash
npm run cc:stop
```

or use the `Command Center (Stop)` desktop icon.

---

## 3. First-Time Setup (Manual / any shell)

If you prefer manual process control:

```bash
# Terminal 1
node server.js

# Terminal 2
npm run dev
```

Then open:

- frontend: `http://localhost:5173` (or Vite-reported port)
- backend health probe: `http://localhost:3001/api/projects`

---

## 4. Understanding Cockpit Panels

## Workflow State

- Interpreted dominant phase + confidence
- Read evidence/reasons for why the phase was chosen

## Workflow Readiness

- Stack/component availability checks
- Review gaps before expecting stable next actions

## Continuity

- Freshness + checkpoint hygiene
- Useful when resuming after interruption

## Next Action

- Recommendation + rationale
- Blockers are explicit
- Suggested command appears when direct remediation is available

## Open Loops

- Next unresolved milestone
- blocked/deferred items
- unresolved requirements and revisable decisions

---

## 5. Daily Operating Loop

1. Launch app
2. Pick repo card
3. Scan Workflow State → Readiness → Continuity
4. Use Next Action + Suggested command
5. Review Open Loops before switching repos
6. Stop services when done

---

## 6. Troubleshooting Playbooks

## A) Launch does not open app

Run:

```bash
npm run cc:doctor
```

If shortcuts look wrong:

```bash
npm run cc:shortcut
```

## B) Launch hangs or fails readiness

Run:

```bash
npm run cc:doctor
npm run cc:launch -- -NoBrowser
```

Inspect:

- `.logs/command-center-backend.log`
- `.logs/command-center-frontend.log`

## C) Port conflict errors

Run:

```bash
npm run cc:stop
npm run cc:doctor
```

## D) Need full reset

Run:

```bash
npm run cc:stop
npm run cc:launch -- -NoBrowser
```

---

## 7. Versioning in UI

The footer displays:

`L.W. Hub v<package.json version>`

To change displayed version, bump `package.json` version and restart frontend dev server.

---

## 8. Helpful Commands

```bash
npm run cc:shortcut
npm run cc:doctor
npm run cc:launch
npm run cc:launch -- -NoBrowser
npm run cc:stop
npm run build
```

---

## 9. Where planning truth lives

- Roadmap: [ROADMAP.md](../ROADMAP.md)
- Milestone/slice/task execution artifacts: `.gsd/`
- Continuity memory: `.holistic/`
