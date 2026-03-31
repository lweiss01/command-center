---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T02: Browser verification of repair queue

Start dev server + backend.
1. Select command-center → assert Health panel shows 'No repairs needed'
2. Select paydirt-backend → assert repair queue shows 'Initialize continuity' as first item with critical badge
3. Assert paydirt-backend shows at least 2 repair items
4. No console errors throughout

## Inputs

- `running dev + backend`

## Expected Output

- `browser verification passed`

## Verification

browser_assert: No repairs needed for command-center, critical repair item for paydirt-backend, no console errors.
