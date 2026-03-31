# M003: 

## Vision
Turn readiness detection into a safe, staged bootstrap workflow: detect gaps, explain impact, offer repo-local fixes first, and machine-level setup second with explicit approvals and visible provenance.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Staged bootstrap planner (repo-first) | high | — | ✅ | After this: for a selected repo, Command Center can generate a staged bootstrap plan from current readiness gaps, prioritizing repo-local actions and showing why each step matters. |
| S02 | Template-based bootstrap source + preview | high | S01 | ✅ | After this: user can choose a known-good template source (repo/preset), preview planned file changes before apply, and see template origin/provenance. |
| S03 | Safe apply engine + approval gates | high | S01, S02 | ✅ | After this: approved repo-local bootstrap actions can be applied with dry-run preview, rollback guidance, and explicit confirmations for higher-risk mutations. |
| S04 | Machine-level setup assistant (secondary stage) | medium | S03 | ✅ | After this: when repo-local setup is complete but tools are missing, Command Center offers machine-level setup instructions/assisted commands with strict confirmation boundaries. |
| S05 | Bootstrap audit trail + drift signals | medium | S03, S04 | ⬜ | After this: every bootstrap action has an inspectable audit trail (what changed, why, source template, when), and drift warnings appear when repo state diverges from applied setup intent. |
