# S04: Repair queue in Health panel

**Goal:** Add the repair queue to the Health panel — a prioritized list of concrete fixes with severity badges and action labels. The repairQueue data is already in the plan response from S03.
**Demo:** After this: After this: a repo with problems shows a prioritized repair queue telling the user exactly what to fix first, in what order, with one click to the right place.

## Tasks
- [x] **T01: Repair queue renders in Health panel with severity badges and target panel labels** — Below the contributor breakdown in the Health section, add a repair queue sub-section:

1. If repairQueue.length === 0: show a small 'No repairs needed' line in muted green
2. If repairQueue.length > 0:
   - Show a header line: 'Repair queue · N item(s)'
   - For each item in repairQueue (already sorted by priority):
     • severity badge (critical=danger, high=warn, medium=info, low=muted) using Pill component
     • action text (bold, text-primary)
     • rationale text (smaller, text-secondary, truncated if long)
     • A small target link label showing which panel to navigate to (e.g. '→ continuity', '→ bootstrap')
       Render as a muted mono label — not a real link (panels are on the same page, user scrolls)

3. Keep the repair queue compact — each item should fit in 2 lines max.
  - Estimate: 30m
  - Files: src/App.tsx
  - Verify: Build clean. paydirt-backend shows repair queue with critical item. command-center shows 'No repairs needed'.
- [x] **T02: Browser verification passed \u2014 repair queue correct for both healthy and degraded repos** — Start dev server + backend.
1. Select command-center → assert Health panel shows 'No repairs needed'
2. Select paydirt-backend → assert repair queue shows 'Initialize continuity' as first item with critical badge
3. Assert paydirt-backend shows at least 2 repair items
4. No console errors throughout
  - Estimate: 15m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: No repairs needed for command-center, critical repair item for paydirt-backend, no console errors.
