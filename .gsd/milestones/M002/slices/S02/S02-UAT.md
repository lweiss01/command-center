# S02: Continuity and checkpoint hygiene — UAT

**Milestone:** M002
**Written:** 2026-03-28T16:20:07.845Z

## UAT: S02 — Continuity and checkpoint hygiene

### Preconditions

- Dev server running on port 3001 (`node server.js`)
- Vite dev server running on port 5173 (`npm run dev`) or production build served
- command-center repo is configured as project ID 1 in the database
- `.holistic/state.json` exists in the command-center repo with `passiveCapture.lastCheckpointAt` or `lastAutoCheckpoint` populated

---

### TC-01: Checkpoint hygiene is derived from real Holistic state paths

**Goal:** Verify `checkpointHygiene` reflects the actual checkpoint timestamp, not 'stale/No explicit checkpoint timestamp found'.

**Steps:**
1. Call `GET http://localhost:3001/api/projects/1/plan`
2. Inspect `response.continuity.checkpointHygiene`
3. Inspect `response.continuity.hygieneNote`

**Expected:**
- `checkpointHygiene` is `'ok'` if last checkpoint was within 24h, `'stale'` if older, or `'missing'` if no timestamp found
- `hygieneNote` contains a human-readable elapsed time (e.g. "Last checkpoint recorded 0 h ago.") — NOT the string "No explicit checkpoint timestamp found"
- Exit 0 from: `node -e "const r=JSON.parse(require('fs').readFileSync('check.json')); if(r.continuity.hygieneNote&&r.continuity.hygieneNote.includes('No explicit')) process.exit(1); process.exit(0)"`

---

### TC-02: Enriched continuity fields are present in API response

**Goal:** Verify `checkpointCount`, `lastCheckpointReason`, `handoffCommand`, and resumeRecap-based `latestWork` are all returned.

**Steps:**
1. Call `GET http://localhost:3001/api/projects/1/plan`
2. Inspect `response.continuity`

**Expected:**
- `checkpointCount` is a positive integer (e.g. 21–30)
- `lastCheckpointReason` is a non-null string (e.g. `'post-commit'`)
- `handoffCommand` is a non-empty string (on Windows: `'.holistic\\system\\holistic.cmd handoff'`)
- `latestWork` is a non-null string drawn from `activeSession.resumeRecap[0]` or `currentGoal`, not blank

---

### TC-03: stale continuity + ok hygiene does NOT produce a hard blocker

**Goal:** Verify that a repo with stale freshness but ok checkpoint hygiene still returns an empty blockers array.

**Steps:**
1. Call `GET http://localhost:3001/api/projects/1/plan`
2. Inspect `response.nextAction.blockers`

**Expected:**
- `blockers` is an empty array `[]`
- The response does NOT contain a blocker entry referencing stale continuity or checkpoint hygiene

---

### TC-04: Continuity panel shows visible hygiene callout when hygiene is stale or missing

**Goal:** Verify the UI callout box is rendered — not a footnote — when checkpointHygiene is 'stale' or 'missing'.

**(If hygiene is 'ok' during testing, see TC-05 instead.)**

**Steps:**
1. Open the cockpit in the browser (`http://localhost:5173`)
2. Select the command-center repo
3. Locate the Continuity section
4. Observe the hygiene display area

**Expected:**
- A visually distinct callout box is rendered (not a small grey footnote)
- The callout shows the hygieneNote text
- The callout shows the `handoffCommand` string (e.g. `.holistic\system\holistic.cmd handoff`)
- Callout is styled to draw attention (e.g. amber/yellow background or border)

---

### TC-05: Continuity panel shows compact confirmation when hygiene is ok

**Goal:** Verify no alarming callout is shown when checkpoint hygiene is current.

**Steps:**
1. Open the cockpit in the browser (`http://localhost:5173`)
2. Select the command-center repo
3. Locate the Continuity section
4. Observe the hygiene display area

**Expected:**
- No large callout box is shown
- A compact confirmation line is visible (e.g. "✓ Last checkpoint 0 h ago")
- The hygieneNote text is present but not alarming

---

### TC-06: checkpointCount and lastCheckpointReason appear in the continuity panel

**Goal:** Verify secondary hygiene quality is surfaced in the UI.

**Steps:**
1. Open the cockpit in the browser (`http://localhost:5173`)
2. Select the command-center repo
3. Locate the Continuity section

**Expected:**
- A line shows the checkpoint count and last reason (e.g. "21 passive captures, last reason: post-commit")
- Both values match the API response from TC-02

---

### TC-07: latestWork shows resumeRecap text, not raw currentGoal

**Goal:** Verify the richer resume context is shown when available.

**Steps:**
1. Call `GET http://localhost:3001/api/projects/1/plan`
2. Inspect `response.continuity.latestWork`
3. Compare to the raw `currentGoal` field in Holistic state (optional: read `.holistic/state.json`)

**Expected:**
- `latestWork` reflects `activeSession.resumeRecap[0]` when present — a descriptive sentence about recent work context
- If resumeRecap is absent, falls back to currentGoal gracefully

---

### TC-08: TypeScript compilation passes with no errors

**Steps:**
1. Run `npx tsc --noEmit` from the project root

**Expected:**
- Exit code 0
- No diagnostic output

---

### TC-09: No console errors in the browser

**Steps:**
1. Open the cockpit in the browser
2. Select a repo
3. Open browser DevTools → Console

**Expected:**
- No red errors
- No uncaught exceptions

---

### Edge Cases

**EC-01: Repo with no Holistic state**
- `checkpointHygiene` should be `'missing'`
- `hygieneNote` should say "No Holistic state found" or similar
- `continuity.latestWork` should fall back gracefully (null or empty string, no crash)
- Panel should show the missing callout with the handoffCommand suggestion

**EC-02: Repo with Holistic state but no passiveCapture and no lastAutoCheckpoint**
- `checkpointHygiene` should be `'missing'`
- `checkpointCount` should be 0 or absent
- Panel shows missing callout

**EC-03: stale continuity + missing hygiene**
- `nextAction.blockers` should contain a hard blocker referencing the hygiene issue
- This is the only stale scenario where blockers[] is non-empty
