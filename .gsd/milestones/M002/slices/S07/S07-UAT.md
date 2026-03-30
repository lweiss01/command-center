# S07: One-click local launch UX — UAT

**Milestone:** M002
**Written:** 2026-03-28T18:13:02.366Z

# UAT — S07 One-click local launch UX

## Scenario
User starts and stops Command Center from desktop without typing commands.

## Steps
1. Run shortcut generator (`npm run cc:shortcut`) to ensure desktop icons exist.
2. Double-click `Command Center` desktop icon and wait for startup.
3. Confirm backend (`/api/projects`) and frontend (`http://localhost:5173`) are reachable.
4. Re-run launcher while services are already running and confirm idempotent success.
5. Double-click `Command Center (Stop)` and confirm listeners on 3001/5173 are cleared.
6. Launch again and verify successful restart.

## Expected
- Launch and stop desktop icons both function.
- Startup is deterministic and reports readiness.
- Stop command clears service listeners cleanly.
- Restart after stop succeeds without manual cleanup.

