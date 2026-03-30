---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T02: Template selector + file preview in confirmation panel UI

Two parts:

1. Add a templateId state to App ('minimal' | 'starter'), defaulting to 'minimal'. Add a small toggle/selector in the Bootstrap Plan section header (e.g. 'Template: minimal | starter' as two pill-buttons). When the template changes, re-fetch the project plan with ?templateId=<id> so previewContent updates.

2. Expand the confirmation panel:
   - For steps with previewContent that looks like file content (multi-line or starts with '#'): show a scrollable code block labelled 'File preview' inside the confirmation panel
   - For steps with previewContent that is a short description: show it as italic secondary text
   - Show a small provenance note: 'template: minimal' or 'template: starter'

3. Pass templateId in the POST body of handleBootstrapConfirm so the apply endpoint writes the right content.

## Inputs

- `src/App.tsx — handleBootstrapConfirm, bootstrap plan section`
- `T01 output: previewContent in step shape`

## Expected Output

- `Template selector visible in Bootstrap Plan header`
- `Confirmation panel shows file preview for doc steps`
- `Apply writes content matching selected template`

## Verification

Browser: open project with bootstrap gaps. Switch template to 'starter'. Click Apply on a doc step — confirmation panel shows richer file preview. Confirm — check written file matches starter content.
