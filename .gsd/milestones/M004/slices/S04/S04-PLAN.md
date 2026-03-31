# S04: Proof panel and requirement traceability in the cockpit

**Goal:** Add a Proof panel to the cockpit showing per-milestone claimed/proven status, requirement proof traceability, and an Import Summaries trigger button.
**Demo:** After this: After this: opening command-center shows M001–M003 as proven, R013 as in-progress, and R007 as validated with its proof source slice.

## Tasks
- [x] **T01: Proof panel and requirement traceability rendered in cockpit with Import Summaries trigger** — 1. Add proofLinks state: fetch GET /api/projects/:id/proof (new endpoint) alongside the plan to get requirement proof traceability. The /proof endpoint queries evidence_links JOIN requirements for reason='requirements_validated' and returns [{reqKey, proofText, sourceArtifactTitle, sliceId}].

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
  - Estimate: 60m
  - Files: server.js, src/App.tsx
  - Verify: Browser: Proof panel visible for command-center. Proven milestone badges shown. Import Summaries button calls endpoint. No console errors.
- [x] **T02: End-to-end browser verification of proof panel — all checks pass** — End-to-end browser verification:
1. Start dev server + backend
2. Select command-center
3. Assert Proof section visible
4. Assert proven milestone count matches proofSummary.proven
5. Click Import Summaries button — confirm API call and panel refresh
6. Expand requirement proof list — assert at least one entry with proof text
7. Select filetrx (no proof data) — assert Proof section shows 0 proven gracefully
8. No console errors throughout
  - Estimate: 20m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: Proof section visible, proven counts correct, no console errors.
