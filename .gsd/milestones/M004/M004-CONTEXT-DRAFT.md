---
depends_on: [M003]
draft: true
---

# M004: Validation and proof model — Context Draft

**Gathered:** 2026-03-27
**Status:** Draft — needs dedicated discussion before planning

## Seed Material from Current Discussion

M004 should make Command Center distinguish imported or claimed progress from proven completion.

The user wants the product to know the difference between:
- repo artifacts that merely say something exists
- work that has actually been validated or proven

This milestone likely covers:
- claimed-vs-proven status surfaces
- requirement proof tracking
- milestone/slice validation visibility
- evidence-aware cockpit summaries

## What This Milestone Likely Unlocks

- more trustworthy completion semantics across repos
- a clearer answer to what is actually done versus only written down
- better prioritization because confidence is tied to proof rather than optimism

## Constraints Already Clear

- keep the model inspectable and honest
- avoid heavyweight ceremony or corporate PM feeling
- do not overclaim certainty when evidence is partial or stale

## Open Questions for Dedicated Discussion

- What proof levels matter most: contract checks, integrated behavior, human UAT, or all of them?
- How much evidence should be surfaced directly in the cockpit versus summarized?
- Where should validation state live primarily: repo docs, canonical model, or both?
