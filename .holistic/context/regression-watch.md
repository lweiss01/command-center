# Regression Watch

Use this before changing existing behavior. It is the short list of fixes and outcomes that future agents should preserve.

No regression watch items yet. Add them during checkpoints and handoffs when a change must stay fixed.

## 2026-03-29 — Backend status/data visibility contract

- Keep backend reachability distinct from data availability in the left-rail indicator.
- `online + zero projects` must render as an explicit warning state (not healthy-green).
- Preserve the empty-data callout near the status indicator so users see "connected but no indexed data" immediately.
- Preserve the top-level project detail error banner (`Project data unavailable ... /api/projects/:id/plan`) so endpoint-level failures are obvious.
