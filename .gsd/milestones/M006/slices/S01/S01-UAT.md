# S01: Auto-import on scan — UAT

**Milestone:** M006
**Written:** 2026-03-31T16:29:17.372Z

## S01 UAT\n\n1. POST /api/scan on workspace with GSD projects\n2. Response includes autoImportSummary.totalImported > 0\n3. Scan completes in < 10s\n4. Second scan: totalImported=0, totalSkipped=N\n5. GET /api/projects unchanged
