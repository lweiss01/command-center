# S01: Launcher UX hardening — UAT

**Milestone:** M007
**Written:** 2026-03-28T18:31:17.103Z

# UAT — S01 Launcher UX hardening

## Scenario
User validates launcher readiness and self-serves common startup issues.

## Steps
1. Run `npm run cc:doctor`.
2. Confirm report includes PowerShell, node/npm, port, shortcut, and log checks.
3. Run `npm run cc:shortcut`, `npm run cc:launch -- -NoBrowser`, and `npm run cc:stop`.
4. Cross-check README troubleshooting matrix against executed commands.

## Expected
- Preflight output is actionable and non-ambiguous.
- Troubleshooting docs reflect real, working commands.
- Launch/stop lifecycle commands execute successfully.

