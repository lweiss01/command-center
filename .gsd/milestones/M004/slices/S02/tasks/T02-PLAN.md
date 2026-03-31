---
estimated_steps: 27
estimated_files: 1
skills_used: []
---

# T02: importGsdSummaries function and import endpoint

Write importGsdSummaries(projectId) function and POST /api/projects/:id/import/summaries endpoint:

1. importGsdSummaries(projectId):
   a. Get project, verify exists
   b. Get all gsd_summary artifacts for projectId (listArtifactsByProjectId filtered to artifact_type='gsd_summary')
   c. For each artifact:
      - Read file content
      - parseSummaryFrontmatter → { id, milestone, verificationResult, completedAt }
      - Determine type: milestone summary (matches /^M\d+$/) vs slice summary (matches /^S\d+$/)
      - For SLICE summaries with verificationResult==='passed':
        i. Find the parent milestone row in DB: SELECT * FROM milestones WHERE project_id=? AND external_key=?
           using the milestone field from frontmatter
        ii. If milestone found AND all slice summaries for that milestone have verification_result=passed:
            UPDATE milestones SET proof_level='proven' WHERE id=milestone.id
        iii. Parse body for requirementsValidated entries
        iv. For each { reqKey, proofText }:
            - Find requirement row by project_id + external_key
            - Upsert evidence_link: DELETE WHERE entity_type='requirement' AND entity_id=req.id AND source_artifact_id=artifact.id, then INSERT
      - For MILESTONE summaries:
        i. Find milestone row
        ii. If status==='complete' AND verificationResult==='passed' (or equivalent):
            UPDATE milestones SET proof_level='proven'
   d. Return { milestonesUpdated: N, proofLinksWritten: N, warnings: string[] }

2. POST /api/projects/:id/import/summaries endpoint:
   - Call importGsdSummaries(projectId)
   - Return result
   - Log [import/summaries] project=X milestones=N proof_links=N warnings=M

3. Include milestones.proof_level in serializeMilestoneRow (add proofLevel field).

## Inputs

- `server.js — parsers from T01, gsd_summary artifacts, evidence_links insert/delete prepared statements`

## Expected Output

- `importGsdSummaries function`
- `POST /api/projects/:id/import/summaries endpoint`
- `serializeMilestoneRow updated with proofLevel`

## Verification

POST /api/projects/1/import/summaries returns { milestonesUpdated:3, proofLinksWritten:N, warnings:[] }. DB: SELECT external_key,proof_level FROM milestones WHERE project_id=1 — M001/M002/M003 show proof_level='proven'. evidence_links rows exist for validated requirements.
