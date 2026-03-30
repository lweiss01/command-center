# S04: Visual Polish, Accessibility, and Interaction Consistency

**Goal:** Add consistent focus-visible system across all interactive controls, replace transition-all on interactive elements with transition-colors, and remove hardcoded owner initials from sidebar.
**Demo:** After this: UI feels professional and intentional: consistent focus states, motion, spacing, and typography hierarchy.

## Tasks
- [x] **T01: Added consistent focus-visible ring system, cleaned transitions on interactive controls, removed owner initials from sidebar.** — 1. Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 to: project cards, search input, sort toggle, header buttons (Scan, User Guide), nav Dashboard button, import buttons, task submit button.
2. Replace transition-all with transition-colors on all buttons and inputs.
3. Replace LW initials badge in sidebar with Layout icon in a blue rounded container.
4. Run npm run build.
  - Estimate: S
  - Files: src/App.tsx
  - Verify: npm run build passes; grep confirms focus-visible:ring-2 present on interactive controls; no LW in source.
