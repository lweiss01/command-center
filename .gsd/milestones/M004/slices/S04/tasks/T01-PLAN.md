---
estimated_steps: 13
estimated_files: 2
skills_used: []
---

# T01: Proof endpoint and cockpit Proof panel

1. Add proofLinks state: fetch GET /api/projects/:id/proof (new endpoint) alongside the plan to get requirement proof traceability. The /proof endpoint queries evidence_links JOIN requirements for reason='requirements_validated' and returns [{reqKey, proofText, sourceArtifactTitle, sliceId}].

2. Add the endpoint to server.js:
   GET /api/projects/:id/proof:
   - Query evidence_links JOIN requirements JOIN source_artifacts WHERE el.reason='requirements_validated' AND r.project_id=?
   - Return [{reqKey: r.external_key, proofText: el.excerpt, sourceTitle: sa.title, appliedAt: el.created_at}]

3. Update loadProjectPlan in App.tsx to fetch /proof in parallel.

4. Add a Proof section to the cockpit (after Workflow State, before Bootstrap Plan):
   - Header: 'Proof' with sub 'Claimed vs verified completion'
   - Summary pills: N proven (green), N claimed-only (muted)
   - Import Summaries button: POST /import/summaries, then reload plan + proof
   - Per-milestone list: externalKey + title, proven pill (green) or claimed pill (muted)
   - Per-requirement proof list (collapsible, default collapsed): R### badge + proof text truncated to 80 chars + source SUMMARY title
5. No new imports needed — use existing C, Pill, Section, Note components.

## Inputs

- `server.js evidence_links, requirements, source_artifacts tables`
- `src/App.tsx existing section pattern`

## Expected Output

- `server.js with GET /proof endpoint`
- `src/App.tsx with Proof panel`

## Verification

Browser: Proof panel visible for command-center. Proven milestone badges shown. Import Summaries button calls endpoint. No console errors.
