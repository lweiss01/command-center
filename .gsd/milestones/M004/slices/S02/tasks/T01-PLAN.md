---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T01: Write and test SUMMARY file parsers

Write parseSummaryFrontmatter(content) and parseSummaryRequirementsValidated(content):

1. parseSummaryFrontmatter(content): string
   - If content starts with '---', extract YAML block up to the second '---'
   - Parse: id, milestone, verification_result, completed_at from the block (simple regex, no YAML lib)
   - Return { id, milestone, verificationResult, completedAt } — null for missing fields

2. parseSummaryRequirementsValidated(content): Array<{reqKey, proofText}>
   - Find the '## Requirements Validated' section (case-insensitive header match)
   - Extract lines matching /^-\s+(R\d+)\s+[—-]\s+(.+)$/
   - Return array of { reqKey: 'R001', proofText: '<rest of line>' }
   - Return [] if section absent or no matching lines

3. Unit-test both parsers inline (console.assert) against two real SUMMARY files before proceeding:
   - M002/slices/S01/S01-SUMMARY.md (has Requirements Validated)
   - M001/slices/S01/S01-SUMMARY.md (no Requirements Validated section)

## Inputs

- `.gsd/milestones/M002/slices/S01/S01-SUMMARY.md`
- `.gsd/milestones/M001/slices/S01/S01-SUMMARY.md`

## Expected Output

- `parseSummaryFrontmatter and parseSummaryRequirementsValidated functions in server.js`

## Verification

Node: inline console.assert tests on two real SUMMARY files pass — correct frontmatter parsed, correct requirement entries extracted.
