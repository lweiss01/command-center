# M001: 

## Vision
Create a trustworthy local foundation that can discover repos, detect planning artifacts, import canonical planning entities, and render a useful project cockpit from repo-backed state instead of seed/demo data.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Workspace discovery | high | — | ✅ | After this: the app can scan configured roots, discover likely repos, persist project metadata, and show them in the dashboard. |
| S02 | Source artifact detection | high | S01 | ✅ | After this: the app can classify GSD/GSD2 and roadmap-like planning artifacts in discovered repos. |
| S03 | Canonical planning schema | high | S01, S02 | ✅ | After this: the backend persists projects, artifacts, import runs, milestones, slices, tasks, requirements, decisions, and evidence links in a normalized model. |
| S04 | Milestone import | medium | S03 | ✅ | After this: `.gsd/PROJECT.md` milestones can be imported through the live app and rendered in the cockpit. |
| S05 | Requirements import | medium | S03 | ✅ | After this: `.gsd/REQUIREMENTS.md` requirements can be imported through the live app and rendered in the cockpit. |
| S06 | Decisions import | medium | S03 | ✅ | After this: `.gsd/DECISIONS.md` decisions can be imported through the live app and rendered in the cockpit. |
| S07 | Import UX and validation | medium | S04, S05, S06 | ✅ | After this: import controls, warning surfaces, and stale imported row cleanup exist in the cockpit, with the known caveat that richer review semantics remain for later work. |
