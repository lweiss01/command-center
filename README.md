# Command Center

Command Center is a lightweight, local-first task and planning hub for agentic AI coding work across all of my projects.

The goal is to make it easy to:

- discover projects in my local workspace
- import existing planning state from repo docs
- normalize milestones, slices, tasks, and decisions into one view
- bootstrap planning for repos that do not have roadmap docs yet
- stay fast and personal instead of growing into a bloated agent operating system

## Current status

This project is in the early dashboard/prototype stage.

The current app includes:

- a Vite + React frontend
- a small Express bridge
- a local SQLite database
- seed scripts for project discovery and sample roadmap data

## Direction

The planned first major milestone is:

- **M001 — Core planning model + import-first foundation**

That milestone will focus on:

- runtime project discovery
- canonical planning entities
- source artifact detection
- import runs and provenance
- a project overview UI based on imported repo state instead of static seed data

## Tech stack

- React 19
- TypeScript
- Vite
- Express
- SQLite via better-sqlite3
- Tailwind CSS

## Local development

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

The current Express bridge can be started with:

```bash
node server.js
```

## Notes

This repo is intentionally starting small. The goal is to build a fast planning center for real repos and real workflows, not a full clone of larger task orchestration systems.
