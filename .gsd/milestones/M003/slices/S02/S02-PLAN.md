# S02: Template-based bootstrap source + preview

**Goal:** Before applying a bootstrap step, show the user exactly what will be written to disk — file contents for doc steps, path description for dir/tool steps. Add two built-in template presets (minimal stub vs. starter with example sections) so the user can pick richer boilerplate before confirming.
**Demo:** After this: After this: user can choose a known-good template source (repo/preset), preview planned file changes before apply, and see template origin/provenance.

## Tasks
- [x] **T01: Added starter template presets and previewContent field to bootstrap plan steps** — Two parts:

1. Define two template presets in server.js:
   - 'minimal': current BOOTSTRAP_STUBS (single-line placeholders)
   - 'starter': richer stubs with example sections (2-4 lines each with concrete prompts)

2. Update computeBootstrapPlan to accept an optional templateId param (defaulting to 'minimal'). Add previewContent field to each step: for doc steps, the rendered stub string; for dir/tool steps, a short description string (e.g. 'Creates .gsd/ directory at <path>').

3. Update GET /api/projects/:id/plan to forward templateId query param into computeBootstrapPlan.

4. Update POST /api/projects/:id/bootstrap/apply to accept optional templateId in body and use the correct stub content when writing files.
  - Estimate: 45m
  - Files: server.js
  - Verify: curl 'http://localhost:3001/api/projects/2/plan?templateId=starter' | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const p=JSON.parse(d); console.log(p.bootstrapPlan.steps[0].previewContent)" — should show multi-line starter content
- [x] **T02: Added template selector to Bootstrap Plan header and file preview to confirmation panel** — Two parts:

1. Add a templateId state to App ('minimal' | 'starter'), defaulting to 'minimal'. Add a small toggle/selector in the Bootstrap Plan section header (e.g. 'Template: minimal | starter' as two pill-buttons). When the template changes, re-fetch the project plan with ?templateId=<id> so previewContent updates.

2. Expand the confirmation panel:
   - For steps with previewContent that looks like file content (multi-line or starts with '#'): show a scrollable code block labelled 'File preview' inside the confirmation panel
   - For steps with previewContent that is a short description: show it as italic secondary text
   - Show a small provenance note: 'template: minimal' or 'template: starter'

3. Pass templateId in the POST body of handleBootstrapConfirm so the apply endpoint writes the right content.
  - Estimate: 50m
  - Files: src/App.tsx
  - Verify: Browser: open project with bootstrap gaps. Switch template to 'starter'. Click Apply on a doc step — confirmation panel shows richer file preview. Confirm — check written file matches starter content.
- [x] **T03: End-to-end browser verification passed: template selector, file preview, apply with correct template content all confirmed** — End-to-end verification:
1. Open a project with at least one doc-creation bootstrap step
2. Verify template selector shows 'minimal' and 'starter' options
3. Switch to 'starter' — verify step preview content updates
4. Click Apply on a doc step in starter mode — confirm panel shows file preview with richer content
5. Confirm — verify written file on disk matches starter template
6. Switch back to minimal — verify preview content reverts
7. No console errors throughout
  - Estimate: 20m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: template selector visible, preview content present in confirmation panel. cat written file to confirm content matches template.
