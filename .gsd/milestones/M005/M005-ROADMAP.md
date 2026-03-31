# M005: 

## Vision
Make Command Center genuinely useful for managing multiple repos: richer portfolio cards that show what each repo actually needs, a health score that combines all known signals into one honest number, a per-repo drift panel that surfaces exactly what has gone stale or out of alignment, and a repair queue that tells you what to fix first and links to the right action.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | computeRepoHealth — health score and repair queue functions | medium | — | ✅ | After this: computeRepoHealth and computeRepairQueue exist as pure functions and produce correct output for both a healthy repo and a broken one. |
| S02 | Portfolio upgrade — health in cards and portfolio route | low | S01 | ✅ | After this: portfolio cards show at a glance which repos are healthy vs degraded — health badge, proof count, import age visible without opening each repo. |
| S03 | Health panel in repo detail | medium | S01, S02 | ✅ | After this: opening any repo shows a Health panel that summarizes its overall state in one place — no more hunting across five panels to understand what is wrong. |
| S04 | Repair queue in Health panel | medium | S03 | ✅ | After this: a repo with problems shows a prioritized repair queue telling the user exactly what to fix first, in what order, with one click to the right place. |
