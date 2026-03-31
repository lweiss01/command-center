# S02: Portfolio upgrade — health in cards and portfolio route

**Goal:** Add healthScore, healthGrade, proofCoverage, and importAgeDays to portfolio entries. Upgrade urgency scoring to use health. Update portfolio cards to show health badge and proof coverage.
**Demo:** After this: After this: portfolio cards show at a glance which repos are healthy vs degraded — health badge, proof count, import age visible without opening each repo.

## Tasks
- [x] **T01: Health wired into portfolio route and urgency score** — In the portfolio route, compute proofSummary from raw milestone rows, call computeRepoHealth, add health fields to each entry. Update computeUrgencyScore signature to accept repoHealth and replace +0.15 readiness-gap check with grade-aware increments (D:+0.20, C:+0.10, A:-0.10 floored at 0). Update the single call site.
  - Estimate: 35m
  - Files: server.js
  - Verify: GET /api/portfolio: each entry has healthScore, healthGrade, proofCoverage, importAgeDays. command-center grade A, paydirt-backend grade D.
- [x] **T02: Portfolio cards show Health A/B/C/D badge and proof coverage** — Update PortfolioEntry interface in App.tsx (add healthScore, healthGrade, proofCoverage, importAgeDays). Add healthGradeColor helper. Add health grade badge and proof coverage to portfolio card subtitle row, keeping existing phase/continuity labels.
  - Estimate: 30m
  - Files: src/App.tsx
  - Verify: Build passes. Health grade badge visible on cards in dev server.
- [x] **T03: Browser verification passed — health grades and proof coverage visible on all portfolio cards** — Start dev server + backend. browser_assert: portfolio cards visible, health grade letter appears on cards, no console errors. Verify API response includes all new fields.
  - Estimate: 15m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: health grade visible, no console errors. GET /api/portfolio confirms healthScore/healthGrade/proofCoverage/importAgeDays.
