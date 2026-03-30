# S03: Action Hierarchy and In-App Onboarding Surface — UAT

**Milestone:** M008
**Written:** 2026-03-28T22:19:25.271Z

# UAT — S03 Action Hierarchy\n\n## Steps\n1. Open http://localhost:5173\n2. Confirm header shows three controls in order: User Guide (muted text), New Project (ghost/disabled), Scan Workspace (blue filled)\n3. Hover New Project — confirm tooltip reads \"Coming soon\" and it is not clickable\n4. Click Scan Workspace — confirm scan starts\n5. Click User Guide — confirm opens docs URL in new tab\n\n## Expected Result\nNo high-prominence button with a dead-end flow. Scan Workspace is the clear primary action.
