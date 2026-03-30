---
depends_on: [M004]
draft: true
---

# M005: Drift repair and portfolio prioritization — Context Draft

**Gathered:** 2026-03-27
**Status:** Draft — needs dedicated discussion before planning

## Seed Material from Current Discussion

M005 should help the user see across repos what is stale, blocked, unresolved, or drifting out of date, then prioritize time effectively.

The user wants Command Center to feel like it is helping them:
- see across all projects
- understand what is still up in the air
- notice when a repo has gone stale after a long gap
- keep repos current and up to date through durable memory and truthful status

## What This Milestone Likely Unlocks

- drift detection around stale continuity, missing artifacts, and inconsistent workflow setup
- stronger portfolio-level prioritization across many repos
- better repair suggestions when a repo has fallen out of alignment with the standard workflow

## Constraints Already Clear

- avoid fake universal scoring if the evidence is weak
- keep the product grounded in repo truth and visible uncertainty
- preserve the anti-bloat boundary; cross-repo visibility must stay sharper than generic dashboards

## Open Questions for Dedicated Discussion

- What portfolio signals actually deserve first-class ranking: freshness, readiness, proof state, blocker severity, unresolved uncertainty?
- When should drift be a warning versus a hard blocker?
- How much automated repair should be offered at the portfolio level versus only inside a repo drill-down?
