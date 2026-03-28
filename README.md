# Command Center

Command Center is a local-first planning cockpit for code repos.

It is built for an existing working style:

- discuss
- research
- plan
- implement
- validate

The purpose is not to become a general-purpose agent operating system.
The purpose is to make repo planning state easier to discover, import, compare, resume, and advance across real projects.

## What Command Center Does

Command Center is designed to:

- discover projects across a local workspace
- detect planning artifacts already living in those repos
- import repo planning state into a canonical local model
- normalize milestones, requirements, decisions, and related planning entities into one cockpit
- preserve continuity with Holistic repo memory
- move toward apples-to-apples progress comparison across repos
- eventually understand Beads issue graphs as part of the same planning picture

## Current Product Direction

Command Center follows a docs-first approach.

That means the source of truth should remain in repo-local planning artifacts whenever possible, especially:

- GSD / GSD2 planning docs
- Holistic continuity docs
- Beads issue/task graphs
- lightweight repo-local roadmap artifacts

Command Center imports and interprets that state instead of trying to replace it with a bloated central system.

## Current Status

Command Center is now beyond the initial seed/demo stage and has a real M001 foundation in place plus a meaningful first pass of M002 cockpit intelligence.

### Working today

- workspace project discovery
- source artifact detection
- canonical SQLite planning schema
- canonical project plan snapshot API
- milestone import from `.gsd/PROJECT.md`
- requirements import from `.gsd/REQUIREMENTS.md`
- decisions import from `.gsd/DECISIONS.md`
- provenance / import run tracking
- per-artifact import review state for milestones / requirements / decisions
- stale imported row cleanup when source entries are removed from docs
- unified import controls in the project cockpit
- first-pass workflow-state computation (`discuss` / `plan`)
- Holistic-backed continuity summary and freshness signals in the cockpit
- continuity-aware workflow confidence
- inline confidence notes explaining stale downgrade or fresh support
- first-pass next-action recommendation with priority and rationale
- project dashboard with imported planning surfaces
- Holistic repo memory and roadmap docs committed into the repo

### Still in progress

- richer import warning/review UI beyond first-pass status and warnings
- slice/task import into the canonical model
- richer phase inference beyond `discuss` / `plan`
- blockers / current milestone / active work summaries
- cross-repo apples-to-apples progress semantics
- deeper Holistic + Beads integration in the cockpit

## Why This Exists

I work across multiple repos and want one place that can tell me:

- what this repo is trying to do
- what milestone is active
- what decisions and requirements matter
- what happened last session
- what I should do next
- how this repo compares to other repos without mental translation

Mission Control-style orchestration ideas are useful, but Command Center is intentionally narrower and more personal:

- local-first
- repo-first
- docs-first
- continuity-aware
- consistency-focused

## Workflow Model

Command Center is being shaped around a repeatable workflow loop:

1. **Discuss** — shape the problem and intent
2. **Research** — retire unknowns and compare options
3. **Plan** — define milestones, slices, tasks, requirements, and decisions
4. **Implement** — execute against the plan
5. **Validate** — prove the work is done and correct

This loop is intended to repeat within a repo over time.
A project does not go through it only once. Each milestone or major body of work may restart the cycle.

## Milestone Roadmap

### M001 — Core planning model + import-first foundation

M001 is focused on building a trustworthy import and cockpit foundation:

- discover repos
- detect source artifacts
- import canonical planning entities
- show imported planning state in the UI
- track provenance and import runs

M001 now includes working milestone, requirement, and decision imports plus unified import controls.

### M002 — Consistent project cockpit + continuity intelligence

M002 is focused on turning imported planning state into a normalized, resumable, comparable project view across repos.

Key themes:

- workflow-state contract
- Holistic continuity integration
- Beads translation layer
- progress normalization
- richer cockpit and cross-repo dashboard surfaces

For the full evolving plan, see [ROADMAP.md](./ROADMAP.md).

## Tech Stack

- React 19
- TypeScript
- Vite
- Express
- SQLite via better-sqlite3
- Tailwind CSS

## Local Development

Install dependencies:

```bash
npm install
```

Run the frontend dev server:

```bash
npm run dev
```

Run the backend bridge:

```bash
node server.js
```

### Windows one-click launcher

Create/update desktop shortcuts (Launch + Stop):

```bash
npm run cc:shortcut
```

Launch Command Center from terminal:

```bash
npm run cc:launch
```

Stop Command Center services (ports 3001 and 5173):

```bash
npm run cc:stop
```

#### Launcher troubleshooting

| Symptom | Command to run | Where to inspect |
|---|---|---|
| Launch shortcut does nothing or opens wrong script | `npm run cc:shortcut` | Desktop shortcuts: `Command Center.lnk`, `Command Center (Stop).lnk` |
| Launch fails or hangs waiting for readiness | `npm run cc:doctor` then `npm run cc:launch -- -NoBrowser` | `.logs/command-center-backend.log`, `.logs/command-center-frontend.log` |
| Ports 3001/5173 already in use and launch is blocked | `npm run cc:stop` | Re-run `npm run cc:doctor` to confirm ports are clear |
| Need clean lifecycle reset | `npm run cc:stop` then `npm run cc:launch -- -NoBrowser` | Launcher console output + `.logs/*` |

Build the app:

```bash
npm run build
```

## Repo Memory and Planning Context

This repo now carries its own planning and continuity context, including:

- [ROADMAP.md](./ROADMAP.md)
- [HOLISTIC.md](./HOLISTIC.md)
- [AGENTS.md](./AGENTS.md)
- `.holistic/` repo memory and continuity artifacts

That is intentional. Command Center is being built to reduce context loss and make interruptions less costly.

## Notes

Command Center should stay small, sharp, and honest.

It should help me understand and advance real repo plans, not drown that work in generic PM ceremony or overbuilt agent orchestration.