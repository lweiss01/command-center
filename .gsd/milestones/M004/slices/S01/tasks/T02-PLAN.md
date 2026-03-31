---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T02: Audit SUMMARY file parser inputs across M001-M003

Write a focused audit script that walks all SUMMARY files in command-center and confirms the parser will find what it needs:
1. Parse frontmatter from each S##-SUMMARY.md: extract id, milestone, verification_result, completed_at
2. Parse body from each S##-SUMMARY.md: extract ## Requirements Validated section, parse - R### — <proof text> lines
3. Parse frontmatter from each M###-SUMMARY.md: extract id, status, completed_at
4. Print a table: file, verification_result, req_validated_count, body_parse_ok
5. Identify any edge cases: missing sections, malformed lines, duplicate R### entries

This is a pure audit — no DB writes. Output feeds directly into T01 parser implementation confidence.

## Inputs

- `.gsd/milestones/**/*-SUMMARY.md files`

## Expected Output

- `audit report printed to stdout confirming parser inputs`

## Verification

Run node audit script — output shows 25 slice summaries with verification_result=passed, 9 with requirements_validated entries, 3 milestone summaries with status=complete. No parse errors.
