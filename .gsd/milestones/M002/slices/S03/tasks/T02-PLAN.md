---
estimated_steps: 28
estimated_files: 1
skills_used: []
---

# T02: Add readiness panel to App.tsx and run browser verification

Add StackComponent and ReadinessReport TypeScript interfaces to App.tsx, extend ProjectPlan to include readiness, add a getReadinessClassName helper, and render a Readiness panel in the cockpit JSX. Then run end-to-end browser verification.

Steps:
1. In src/App.tsx, after the NextAction interface (~L107), add:
   ```typescript
   interface StackComponent {
     id: string;
     label: string;
     kind: 'repo-doc' | 'machine-tool' | 'repo-dir';
     status: 'present' | 'missing';
     note: string | null;
     required: boolean;
   }
   interface ReadinessReport {
     overallReadiness: 'ready' | 'partial' | 'missing';
     components: StackComponent[];
     gaps: string[];
   }
   ```
2. In the ProjectPlan interface, add `readiness: ReadinessReport;` alongside the existing fields.
3. Add a helper function getReadinessClassName(status: 'ready' | 'partial' | 'missing'): string that returns 'status-fresh' for ready, 'status-stale' for partial, 'status-missing' for missing (reuse existing CSS class pattern from continuity panel).
4. In the JSX where the existing Workflow State, Continuity, and Next Action panels are rendered, add a Readiness panel section after the Workflow State panel. The panel should:
   - Show a section heading 'Workflow Readiness'
   - Show an overall status badge using getReadinessClassName with the overallReadiness value
   - Render each component in a list: show label, a present/missing indicator, and note if present
   - When gaps.length > 0, show a 'Gaps' list with each gap string
   - Guard against null: only render when projectPlan?.readiness exists
5. Run `npx tsc --noEmit` — fix any type errors before proceeding.
6. Start the dev server if not running. Run browser verification: navigate to the cockpit for project 1, assert readiness panel is visible, overall status badge is present, component list renders (>= 1 item visible), zero console errors.

## Inputs

- `server.js`
- `src/App.tsx`

## Expected Output

- `src/App.tsx`

## Verification

npx tsc --noEmit
