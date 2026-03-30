# S02: Project Card Redesign for Semantic Clarity

**Goal:** Replace ambiguous project-card shorthand pills with explicitly labeled semantic chips so users can interpret card signals without prior product knowledge.
**Demo:** After this: Project cards show labeled, understandable signals that communicate what each status means at a glance.

## Tasks
- [x] **T01: Replaced ambiguous card pills with explicitly labeled semantic chips and converted card containers to semantic buttons.** — In src/App.tsx:

1. Replace the Phase chip text from `{entry.workflowPhase} · interp` to `Phase: {entry.workflowPhase}`.
2. Replace the Continuity chip text from `{continuityLabel} · interp` to `Continuity: {continuityLabel}` (drop age from label — show as metadata subline instead).
3. Add a `Plan:` prefix to the planning-status chip.
4. Change card container from a `<div onClick=...>` to a `<button type='button' onClick=...>` with matching layout styles, removing cursor-pointer.
5. Ensure risk summary line (gaps + unresolved) renders below chips with clear wording.
6. Run npm run build to verify no TypeScript/build errors.
  - Estimate: S
  - Files: src/App.tsx
  - Verify: npm run build && echo 'build-ok' — confirm no errors; visually confirm labeled chips in browser.
