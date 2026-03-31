---
estimated_steps: 18
estimated_files: 1
skills_used: []
---

# T02: Health panel in repo detail

1. Add types to App.tsx:
   - HealthBreakdownItem: { signal: string; label: string; contribution: number; maxContribution: number; status: 'ok'|'warn'|'danger'|'missing'; note: string }
   - RepoHealth: { score: number; grade: 'A'|'B'|'C'|'D'; breakdown: HealthBreakdownItem[] }
   - RepairItem: { priority: number; severity: 'critical'|'high'|'medium'|'low'; action: string; rationale: string; targetPanel: string }
   - Add repoHealth: RepoHealth | null and repairQueue: RepairItem[] to ProjectPlan

2. Add repoHealth state: const [repoHealth, setRepoHealth] = useState<RepoHealth|null>(null)
   Populate it from projectPlan.repoHealth after plan load (no extra fetch needed)

3. Add Health section to cockpit between Proof and Bootstrap Plan:
   - Section title='Health' sub='Overall repo operating health'
   - Header row: health score (as %) + grade badge (colored by healthGradeColor)
   - Breakdown list: for each contributor, show:
     • label (e.g. 'Continuity', 'Readiness')
     • a small status dot (ok=green, warn=amber, danger=red, missing=muted)
     • contribution bar (thin horizontal bar, contribution/maxContribution fill)
     • note text
   - Staleness callout: if any contributor status is 'danger' or 'missing', show a muted summary line
     e.g. '2 signals need attention'

4. No repair queue UI in this slice — that is S04.

## Inputs

- `src/App.tsx — existing panel pattern, Section/Pill/Note components`

## Expected Output

- `src/App.tsx with Health panel`

## Verification

Build clean. Health section renders between Proof and Bootstrap Plan. command-center shows A badge with all-green dots. paydirt-backend shows D with red/missing dots.
