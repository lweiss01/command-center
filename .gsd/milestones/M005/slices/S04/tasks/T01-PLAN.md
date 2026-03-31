---
estimated_steps: 11
estimated_files: 1
skills_used: []
---

# T01: Repair queue UI in Health panel

Below the contributor breakdown in the Health section, add a repair queue sub-section:

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

## Inputs

- `src/App.tsx — existing Health panel, Pill component`
- `projectPlan.repairQueue from plan response`

## Expected Output

- `src/App.tsx with repair queue in Health panel`

## Verification

Build clean. paydirt-backend shows repair queue with critical item. command-center shows 'No repairs needed'.
