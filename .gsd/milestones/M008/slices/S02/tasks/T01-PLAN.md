---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T01: Replace card pills with labeled semantic chips and fix card interaction semantics

In src/App.tsx:

1. Replace the Phase chip text from `{entry.workflowPhase} · interp` to `Phase: {entry.workflowPhase}`.
2. Replace the Continuity chip text from `{continuityLabel} · interp` to `Continuity: {continuityLabel}` (drop age from label — show as metadata subline instead).
3. Add a `Plan:` prefix to the planning-status chip.
4. Change card container from a `<div onClick=...>` to a `<button type='button' onClick=...>` with matching layout styles, removing cursor-pointer.
5. Ensure risk summary line (gaps + unresolved) renders below chips with clear wording.
6. Run npm run build to verify no TypeScript/build errors.

## Inputs

- `.gsd/milestones/M008/slices/S01/S01-RESEARCH.md`
- `src/App.tsx`

## Expected Output

- `Updated src/App.tsx with labeled card chips and semantic button card containers`

## Verification

npm run build && echo 'build-ok' — confirm no errors; visually confirm labeled chips in browser.
