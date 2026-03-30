# S05: Cross-repo prioritization view — UAT

**Milestone:** M002
**Written:** 2026-03-28T17:07:20.016Z

## UAT: S05 — Cross-repo prioritization view

### Preconditions
- Server running on http://localhost:3001
- At least 2 projects registered in the DB with varying continuity/readiness states
- App running on http://localhost:5173 (or equivalent dev port)
- TypeScript compiles clean (`npx tsc --noEmit` exits 0)

---

### Test 1 — /api/portfolio returns valid JSON array sorted by urgency

**Steps:**
1. `curl -s http://localhost:3001/api/portfolio > check.json`
2. `node -e "const p=JSON.parse(require('fs').readFileSync('check.json','utf8')); let prev=2,ok=true; p.forEach(e=>{if(e.urgencyScore>prev)ok=false;prev=e.urgencyScore;}); console.log('count:',p.length,'sorted:',ok); require('fs').unlinkSync('check.json');"`

**Expected:**
- count ≥ 1
- sorted: true
- No JSON parse error

---

### Test 2 — Each portfolio entry contains all required fields

**Steps:**
1. Fetch `/api/portfolio` and inspect the first entry.
2. Verify fields: `project.id`, `project.name`, `workflowPhase`, `workflowConfidence`, `continuityStatus`, `continuityAgeHours`, `checkpointHygiene`, `overallReadiness`, `readinessGaps` (array), `unresolvedCount`, `pendingMilestoneCount`, `blockedCount`, `nextActionLabel`, `urgencyScore`.

**Expected:**
- All fields present on every entry
- `urgencyScore` is a number between 0 and 1 (inclusive)
- `continuityStatus` is one of 'fresh', 'stale', 'missing'
- `overallReadiness` is one of 'ready', 'partial', 'missing'

---

### Test 3 — computeUrgencyScore additive increments are correct

**Steps:**
1. Find a project with `continuityStatus: 'fresh'` in the portfolio response.
2. Check that its `urgencyScore ≥ 0.40`.
3. Find a project with `continuityStatus: 'missing'` and `workflowPhase: 'no-data'`.
4. Check that its urgencyScore does NOT include the stalled/no-data +0.20 increment (since continuity is 'missing').

**Expected:**
- Fresh project: urgencyScore ≥ 0.40
- Missing-continuity no-data project: urgencyScore excludes the +0.20 stalled increment (score should reflect only remaining signals)

---

### Test 4 — UI card grid renders portfolio badges

**Steps:**
1. Open the app in a browser.
2. Wait for project cards to appear.
3. Observe: skeleton pills ('···') briefly visible on cards during load.
4. After data loads: each card should show a phase badge (e.g. 'active', 'no-data', 'stalled') and a continuity badge (e.g. 'fresh 2h', 'stale', 'missing').
5. For cards with gaps or unresolved requirements: a gap indicator line appears at the card bottom (e.g. '2 gaps · 13 unresolved').

**Expected:**
- Phase and continuity badges render on cards after load
- Skeleton pill disappears after data arrives
- Cards without gaps/unresolved show no indicator line
- Cards with ≥1 gap or unresolvedCount > 0 show the indicator line

---

### Test 5 — Sort toggle switches between urgency and name order

**Steps:**
1. Open the app.
2. Note the default sort order of project cards (should be urgency-descending).
3. Click the sort toggle button (labeled "Sort: Urgency" or "Sort: Name").
4. Observe cards re-sort alphabetically by name.
5. Click the toggle again.
6. Observe cards return to urgency-descending order.

**Expected:**
- Default order matches urgencyScore descending from /api/portfolio
- After toggle: cards sorted A→Z by project name
- After second toggle: back to urgency order

---

### Test 6 — Tool probe fires once per portfolio request (not per project)

**Steps:**
1. Add a temporary console.log to the portfolio route in server.js at the probeToolStatus calls (just for this test).
2. Fetch /api/portfolio.
3. Count how many times the probe log appears in server output.

**Expected:**
- Probe log appears exactly twice (once for holistic, once for gsd) regardless of how many projects are registered.

---

### Test 7 — Portfolio degrades gracefully if /api/portfolio fails

**Steps:**
1. Temporarily stop the server or block the portfolio route.
2. Reload the app.
3. Observe project cards.

**Expected:**
- Project cards render without badges (no phase/continuity badge)
- No JavaScript error in the browser console that breaks the UI
- Sort toggle still appears (though sorting by urgency will use fallback -1 score)

---

### Edge Cases

- **Zero projects registered:** /api/portfolio returns `[]`, no cards shown, no JS error.
- **Project with all signals at zero (missing continuity, ready stack, no unresolved):** urgencyScore is 0.0, sorts last.
- **Multiple projects with same urgencyScore:** sort is stable (order preserved from original DB query).
- **Project with readinessGaps.length > 0 but unresolvedCount === 0:** gaps indicator shows only the gaps count (e.g. '4 gaps').
- **continuityAgeHours is null:** continuity badge shows just the status word (e.g. 'fresh') without the age suffix.

