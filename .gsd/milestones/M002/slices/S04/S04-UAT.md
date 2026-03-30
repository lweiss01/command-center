# S04: Repo drill-down for open loops — UAT

**Milestone:** M002
**Written:** 2026-03-28T16:50:51.363Z

## UAT: S04 — Repo drill-down for open loops

### Preconditions
- Server running on :3001
- Frontend running on :5173
- At least one project imported with milestones, requirements, and decisions
- Project `command-center` selected in the cockpit (has 13 unresolved requirements, 3 deferred, next milestone M002)

---

### Test 1 — API response includes openLoops with correct shape

**Steps:**
1. `node --input-type=module -e "const r = await fetch('http://localhost:3001/api/projects/1/plan'); const d = await r.json(); console.log(JSON.stringify(d.openLoops?.summary));"`

**Expected:** `{"unresolvedCount":N,"pendingMilestoneCount":N,"blockedCount":N,"deferredCount":N}` — all four keys present, all numeric, unresolvedCount ≥ 1.

---

### Test 2 — nextMilestone is the first non-done milestone

**Steps:**
1. Fetch `/api/projects/1/plan`, inspect `openLoops.nextMilestone`.

**Expected:** Object with `key`, `title`, `status` where `status !== 'done'`. For command-center: key=M002, title includes 'Resume-first cockpit', status='planned'.

---

### Test 3 — Open Loops panel renders in cockpit

**Steps:**
1. Open `http://localhost:5173/`, click on `command-center` project.
2. Scroll to the Open Loops section.

**Expected:**
- Heading "OPEN LOOPS" visible.
- Sub-label "WHAT'S NEXT, BLOCKED, AND STILL UNRESOLVED." visible.
- Summary badges showing unresolved count and deferred count.
- "NEXT MILESTONE" sub-section with M002 title visible.
- "UNRESOLVED REQUIREMENTS" sub-section with at least R001 listed.
- "DEFERRED" sub-section with R015, R016, R017 listed.
- "REVISABLE DECISIONS" sub-section with at least one decision listed.

---

### Test 4 — Unresolved Requirements overflow cap

**Steps:**
1. With command-center selected (13 unresolved), inspect the Unresolved Requirements sub-section.

**Expected:** Exactly 5 requirements listed, followed by a line showing '+ 8 more' (or similar overflow indicator).

---

### Test 5 — TypeScript compilation clean

**Steps:**
1. `npx tsc --noEmit && echo OK`

**Expected:** Exit code 0, "OK" printed. No type errors.

---

### Test 6 — Blocked milestones sub-section is absent when blockedCount is 0

**Steps:**
1. Inspect the cockpit for command-center (blockedCount=0).

**Expected:** No "BLOCKED" sub-section heading or blocked milestone cards visible. The sub-section is conditionally rendered and correctly hidden.

---

### Test 7 — Panel is absent for a project with no openLoops data

**Steps:**
1. Import a project with no milestones/requirements/decisions (or before first import).

**Expected:** Open Loops panel does not render (guard `projectPlan?.openLoops` fires). No errors in console.

---

### Edge Cases

- **All milestones done:** `nextMilestone` should be null and the panel should show 'All milestones complete'.
- **Zero deferred requirements:** Deferred sub-section renders empty or is omitted.
- **Zero revisable decisions:** Revisable Decisions sub-section renders empty or is omitted.
- **Decision revisable field is 'No':** Should not appear in revisableDecisions list (startsWith('yes') filter rejects it).

