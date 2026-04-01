# M006: 

## Vision
Sharpen Command Center for real daily use: eliminate friction for new projects (auto-import + add-by-path), make intentionally-inactive repos invisible to health noise (tagging), surface Beads context for agents that use it, and make stale imports impossible to ignore (Next Action reminder). Every addition must earn its place by improving truthful understanding without adding ceremony.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Auto-import on scan | medium | — | ✅ | After this: running a scan automatically imports planning data for any discovered project that has GSD docs — no manual import buttons required for fresh projects. |
| S02 | Add project by path | medium | — | ✅ | After this: user can type a directory path into the 'New' input and add a project without running a full workspace scan. |
| S03 | First-run onboarding card | low | S01 | ✅ | After this: opening a project that has planning docs but zero imports shows a prominent 'Import All' card instead of empty panels — one click to populate everything. |
| S04 | Repo tagging (active / minimal / archive) | medium | — | ✅ | After this: repos that are intentionally inactive can be tagged as 'archive' or 'minimal', removing health noise and deprioritizing them in the urgency sort. |
| S05 | Beads context in health breakdown | low | — | ⬜ | After this: repos with Beads installed show a Beads contributor in the health breakdown — a small signal that context bead files exist and when they were last touched. |
| S06 | Import age reminders and portfolio card polish | low | S01 | ⬜ | After this: a repo where imports are >14 days old and there is no harder blocker gets a clear Next Action suggestion to re-import, not just a buried health signal. |
