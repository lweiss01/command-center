# S02: Cockpit feature iteration — UAT

**Milestone:** M007
**Written:** 2026-03-28T18:51:18.944Z

# UAT — S02 Cockpit feature iteration

## Scenario
User opens a repo and can move from Next Action signal to a concrete command while still seeing explicit trust/provenance context.

## Steps
1. Select `command-center` in the project grid.
2. Confirm Next Action shows blocked-state emphasis and `Suggested command`.
3. Confirm suggested command text is `npm run cc:doctor` for current blocked tool-readiness state.
4. Confirm interpreted/provenance subtitles remain visible across Workflow State, Readiness, Continuity, Next Action, and Open Loops.
5. Confirm footer version reflects package version (`L.W. Hub v1.0.0`).

## Expected
- Next Action is more executable without losing rationale context.
- Trust/provenance labels remain explicit and unchanged in intent.
- Footer version is metadata-driven and matches package version.

