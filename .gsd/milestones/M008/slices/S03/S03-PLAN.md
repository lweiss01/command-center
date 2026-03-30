# S03: Action Hierarchy and In-App Onboarding Surface

**Goal:** Establish clear header action hierarchy: demote deceptive CTA, promote the real primary action, keep guide link as accessible utility.
**Demo:** After this: Header and top-level controls clearly guide first-time users; help entry is always discoverable.

## Tasks
- [x] **T01: Established header action hierarchy: demoted dead-end CTA, promoted Scan Workspace as primary, made User Guide a quiet utility link.** — Update header CTA cluster in src/App.tsx:
1. Demote New Project to disabled ghost outline button with title='Coming soon'
2. Demote User Guide to muted text link (no filled pill)
3. Keep Scan Workspace as filled primary blue CTA
4. Reorder: utility (User Guide) → secondary-disabled (New Project) → primary (Scan Workspace)
5. Switch transition-all to transition-colors on header buttons
6. Run npm run build to verify
  - Estimate: S
  - Files: src/App.tsx
  - Verify: npm run build passes; grep confirms New Project is disabled with Coming soon title; Scan Workspace remains primary.
