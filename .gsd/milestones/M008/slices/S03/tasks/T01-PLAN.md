---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T01: Establish header action hierarchy and demote dead-end CTA

Update header CTA cluster in src/App.tsx:
1. Demote New Project to disabled ghost outline button with title='Coming soon'
2. Demote User Guide to muted text link (no filled pill)
3. Keep Scan Workspace as filled primary blue CTA
4. Reorder: utility (User Guide) → secondary-disabled (New Project) → primary (Scan Workspace)
5. Switch transition-all to transition-colors on header buttons
6. Run npm run build to verify

## Inputs

- `.gsd/milestones/M008/slices/S01/S01-RESEARCH.md`

## Expected Output

- `Updated src/App.tsx header action cluster`

## Verification

npm run build passes; grep confirms New Project is disabled with Coming soon title; Scan Workspace remains primary.
