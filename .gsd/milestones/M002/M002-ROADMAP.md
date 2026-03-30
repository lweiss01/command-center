# M002: 

## Vision
Turn imported planning data into a resume-first cockpit that helps the user see across repos and then into one repo with truthful memory, readiness, and next-step guidance.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Workflow interpretation contract | high | — | ✅ | After this: a selected repo shows an explainable workflow phase, confidence, and evidence trail instead of only imported entities. |
| S02 | Continuity and checkpoint hygiene | high | S01 | ✅ | After this: a selected repo shows freshness, last meaningful work, and reminders when Holistic continuity or checkpoint hygiene is stale or missing. |
| S03 | Workflow readiness detection | high | S01 | ✅ | After this: a repo can be audited against the standard stack — GSD, GSD2, Beads, Holistic, repo docs, and callable tools — with missing pieces surfaced clearly. |
| S04 | Repo drill-down for open loops | medium | S01, S02, S03 | ✅ | After this: a repo view shows what’s next, what’s blocked, and what’s still unresolved or under-defined instead of only imported entities. |
| S05 | Cross-repo prioritization view | medium | S02, S03, S04 | ✅ | After this: the user can compare repos by freshness, readiness, unresolved work, and urgency without manually reading each repo first. |
| S06 | Trust and anti-hidden-state surfaces | medium | S03, S04, S05 | ✅ | After this: the UI clearly distinguishes imported facts, interpreted conclusions, and missing evidence so the cockpit does not feel opaque or PM-ish. |
| S07 | One-click local launch UX | medium | S06 | ✅ | After this: a desktop icon launches backend + frontend and opens Command Center in the browser with no manual terminal steps. |
