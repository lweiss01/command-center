# S06: Trust and anti-hidden-state surfaces — UAT

**Milestone:** M002
**Written:** 2026-03-28T17:51:24.839Z

# UAT — S06 Trust and anti-hidden-state surfaces

## Scenario
Open a repo in the cockpit and inspect interpreted panels, imported-data headers, and portfolio badges.

## Steps
1. Open Command Center and select a repo card.
2. Confirm Workflow State/Readiness/Continuity/Next Action/Open Loops subtitles communicate interpreted/derived status.
3. Confirm Imported Milestones/Requirements/Decisions headers show `Last synced ... · source ...`.
4. Confirm portfolio phase and continuity badges include `· interp`.

## Expected
- Users can see which surfaces are interpreted vs imported facts.
- Import freshness/source is visible without opening backend logs.
- No layout bloat or style-system drift is introduced.

