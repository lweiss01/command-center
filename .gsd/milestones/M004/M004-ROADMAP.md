# M004: 

## Vision
Make Command Center distinguish imported or claimed progress from proven completion: parse proof signals from SUMMARY artifacts, build a traceability map connecting requirements to their slice-level evidence, and update the cockpit to show what is actually proven versus merely written down.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | SUMMARY artifact discovery and schema extension | high | — | ⬜ | After this: source_artifacts includes SUMMARY entries for the command-center repo; proof_links table exists and is queryable. |
| S02 | SUMMARY import: parse and persist proof signals | high | S01 | ⬜ | After this: POST import/summaries on command-center populates proof_links; GET plan returns milestone proof_level=proven for M001–M003. |
| S03 | Proof signal in workflowState confidence + plan response | medium | S02 | ⬜ | After this: command-center shows higher confidence (proven milestones) vs a bare repo (no proof data). |
| S04 | Proof panel and requirement traceability in the cockpit | medium | S03 | ⬜ | After this: opening command-center shows M001–M003 as proven, R013 as in-progress, and R007 as validated with its proof source slice. |
