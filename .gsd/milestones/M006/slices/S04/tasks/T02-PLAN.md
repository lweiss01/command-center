---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T02: Add Tag UI to Portfolio and Project Detail

1. Update `Project` interface in `App.tsx` to include `repoTag: 'active' | 'minimal' | 'archive'`.
2. Portfolio Card:
   - Render a tag badge if the tag is not 'active'. 'Archive' (muted), 'Minimal' (info).
3. Project Detail Header:
   - Add a dropdown or set of buttons next to the project name to change the tag.
   - Hitting the button calls `POST /api/projects/:id/tag`, updates `selectedProject`, and reloads the plan/portfolio.
4. Render the Tag state in the UI.

## Inputs

- `src/App.tsx - portfolio cards and project header`

## Expected Output

- `Updated App.tsx with tag UI`

## Verification

Build clean. Can see the tag options in the UI, clicking them updates the backend and visually changes the portfolio list ordering.
