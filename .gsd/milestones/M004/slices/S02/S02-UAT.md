# S02: SUMMARY import: parse and persist proof signals — UAT

**Milestone:** M004
**Written:** 2026-03-31T04:06:25.673Z

## S02 UAT\n\n1. POST /api/projects/1/import/summaries → {ok:true, milestonesUpdated:5, proofLinksWritten:10, warnings:[]}\n2. DB: M001/M002/M003 show proof_level='proven'\n3. DB: 10 evidence_links rows with reason='requirements_validated'\n4. GET /api/projects/1/plan → milestones include proofLevel field\n5. Second import run → milestonesUpdated:0 (idempotent)\n6. No regressions to other projects
