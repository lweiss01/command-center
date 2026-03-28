# Regression Watch

Use this before changing existing behavior. It is the short list of fixes and outcomes that future agents should preserve.

## RW001 — GSD auto-mode runtime unit cache drift

**Fixed:** 2026-03-28  
**Status:** Active — must not regress

### Symptom
Auto-mode stops with one of:
- "Stuck: derived N consecutive times without progress"
- "Rogue file write detected" on a planner-owned artifact

This happens even when the work actually succeeded. The cause is that `.gsd/runtime/units/*.json` files stay at `phase: "dispatched"` after an abnormal auto-mode stop (crash, stuck-loop detection, Ctrl+C), while the journal at `.gsd/journal/*.jsonl` correctly records the `unit-end` completed event.

### Root cause
The journal is the durable source of truth. The runtime unit cache is a fast-path overlay that is not automatically reconciled against the journal when the controller exits mid-run. The divergence causes the dispatcher to re-derive the same unit repeatedly until it trips the stuck-detection limit.

### Fix
A repo-local reconciliation script reads the journal and updates stale cache files:

```bash
# Dry-run: see what would change without writing
npm run gsd:reconcile-runtime -- --check

# Apply: converge stale runtime units to journal truth
npm run gsd:reconcile-runtime
```

Script: `scripts/reconcile-gsd-runtime.mjs`

### What reintroduces it
Any abnormal auto-mode stop can leave cache files stale again. The script is idempotent and safe to run at any time. Run it whenever auto-mode exits with a stuck or rogue-write error before attempting to re-dispatch.

### Do not regress
- Do not delete `scripts/reconcile-gsd-runtime.mjs`
- Do not remove the `gsd:reconcile-runtime` entry from `package.json`
- Do not manually edit `.gsd/runtime/units/*.json` to a completed state without running the script — the script ensures timestamps, progressCount, and other fields are consistent with the journal record, not guessed
