# S02: SUMMARY import: parse and persist proof signals

**Goal:** Parse SUMMARY.md frontmatter for requirementsValidated, verificationResult, and completedAt. Persist proof_links rows and update milestone proof_level. Add a POST /api/projects/:id/import/summaries endpoint.
**Demo:** After this: After this: POST import/summaries on command-center populates proof_links; GET plan returns milestone proof_level=proven for M001–M003.

## Tasks
