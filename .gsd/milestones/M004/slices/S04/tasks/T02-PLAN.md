---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T02: End-to-end browser verification

End-to-end browser verification:
1. Start dev server + backend
2. Select command-center
3. Assert Proof section visible
4. Assert proven milestone count matches proofSummary.proven
5. Click Import Summaries button — confirm API call and panel refresh
6. Expand requirement proof list — assert at least one entry with proof text
7. Select filetrx (no proof data) — assert Proof section shows 0 proven gracefully
8. No console errors throughout

## Inputs

- `running dev + backend`

## Expected Output

- `browser verification passed`

## Verification

browser_assert: Proof section visible, proven counts correct, no console errors.
