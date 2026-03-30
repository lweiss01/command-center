---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T01: Focus-visible system, transition cleanup, and sidebar logo neutralization

1. Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 to: project cards, search input, sort toggle, header buttons (Scan, User Guide), nav Dashboard button, import buttons, task submit button.
2. Replace transition-all with transition-colors on all buttons and inputs.
3. Replace LW initials badge in sidebar with Layout icon in a blue rounded container.
4. Run npm run build.

## Inputs

- `.gsd/milestones/M008/slices/S01/S01-RESEARCH.md`

## Expected Output

- `Updated src/App.tsx with focus-visible system and cleaned transitions`

## Verification

npm run build passes; grep confirms focus-visible:ring-2 present on interactive controls; no LW in source.
