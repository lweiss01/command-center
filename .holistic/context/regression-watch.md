# Regression Watch

Use this before changing existing behavior. It is the short list of fixes and outcomes that future agents should preserve.

## Import trust and review state

- Preserve per-artifact import review state for milestones, requirements, and decisions.
- Preserve stale imported row cleanup so rows removed from source docs do not linger in canonical tables.
- If import behavior changes, verify both import creation and import deletion paths against a real repo or fixture.

## Workflow-state conservatism

- Preserve the conservative first-pass workflow-state model.
- Do not overclaim `research`, `implement`, or `validate` until stronger signals exist.
- Preserve continuity-aware confidence behavior:
  - stale continuity reduces confidence one step
  - fresh continuity supports confidence but does not inflate phase claims

## Cockpit guidance surfaces

- Preserve the `workflowState`, `continuity`, and `nextAction` fields in the project plan payload.
- Preserve inline confidence notes that explain stale downgrade and fresh support cases.
- Preserve the first-pass next-action recommendation panel and its explainable rule-set.

## Browser verification discipline

- Automated browser sessions may diverge from real Chrome during resize/responsiveness testing.
- When the automated browser disagrees with the user’s real browser, do not assume the app is wrong until that divergence is verified independently.
- Do not introduce viewport/document hacks based solely on a contaminated automated-browser session.
