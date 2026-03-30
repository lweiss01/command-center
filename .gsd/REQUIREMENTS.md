# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

Guidelines:
- Keep requirements capability-oriented, not a giant feature wishlist.
- Requirements should be atomic, testable, and stated in plain language.
- Every **Active** requirement should be mapped to a slice, deferred, blocked with reason, or moved out of scope.
- Each requirement should have one accountable primary owner and may have supporting slices.
- Research may suggest requirements, but research does not silently make them binding.
- Validation means the requirement was actually proven by completed work and verification, not just discussed.

## Active

### R001 — Truthful repo cockpit
- Class: core-capability
- Status: active
- Description: Command Center must show a repo’s current workflow state, continuity, uncertainty, and next safe step in a way that is explainable rather than magical.
- Why it matters: The product only earns trust if it helps the user resume work quickly and truthfully.
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S04, M002/S06
- Validation: mapped
- Notes: Imported facts and interpreted conclusions must stay visibly distinct.

### R002 — Cross-repo prioritization view
- Class: primary-user-loop
- Status: active
- Description: Command Center must help the user see across repos which ones are current, stale, blocked, unresolved, or most deserving of time next.
- Why it matters: The main value is prioritizing attention across many repos without manually reloading context for each one.
- Source: user
- Primary owning slice: M002/S05
- Supporting slices: M005/S02
- Validation: mapped
- Notes: Avoid fake precision; comparisons must remain honest.

### R003 — Continuity freshness and memory surfaces
- Class: continuity
- Status: active
- Description: Command Center must surface freshness, latest meaningful work, and resume context from repo-local continuity artifacts.
- Why it matters: The system should still provide useful memory after the user has not touched a repo for weeks.
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: M002/S04
- Validation: mapped
- Notes: Holistic-backed freshness is already partially present and needs to become more actionable.

### R004 — Workflow readiness detection for the standard stack
- Class: integration
- Status: active
- Description: Command Center must detect whether the standard workflow stack is present for a repo and machine: GSD, GSD2, Beads, Holistic, and expected repo-local artifacts.
- Why it matters: A repo is not actually ready for normal work if the workflow substrate is missing or only partially set up.
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: M003/S01
- Validation: mapped
- Notes: Readiness includes repo-local docs and machine-callable tools.

### R005 — Missing-component verification surface
- Class: failure-visibility
- Status: active
- Description: Command Center must explicitly show what workflow components are present, missing, stale, or still blocking normal use.
- Why it matters: Missing workflow pieces should be obvious and inspectable instead of hidden inside trial-and-error.
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: M002/S06
- Validation: mapped
- Notes: This should include actionable reasons, not only red/yellow badges.

### R006 — Repo drill-down for what’s next and what’s unresolved
- Class: primary-user-loop
- Status: active
- Description: A repo view must show where things are, what’s next up, and what is still up in the air instead of only listing imported planning entities.
- Why it matters: The user wants to see across projects and then into one project without losing open questions or unresolved work.
- Source: user
- Primary owning slice: M002/S04
- Supporting slices: M002/S02, M002/S03
- Validation: mapped
- Notes: Discussion and research uncertainty must stay visible.

### R008 — Low-hidden-state interpretation model
- Class: quality-attribute
- Status: active
- Description: Command Center must minimize hidden internal state and keep durable truth in repo-local docs/artifacts wherever practical.
- Why it matters: Hidden state makes the product feel opaque and brittle, which is exactly what the user wants to avoid.
- Source: user
- Primary owning slice: M002/S06
- Supporting slices: M001/S03, M003/S04
- Validation: mapped
- Notes: Internal canonical state is allowed, but it should support repo truth rather than replace it.

### R009 — Staged bootstrap / install / configure flows
- Class: operability
- Status: active
- Description: When workflow components are missing, Command Center must offer staged repair: detect first, explain second, then offer repo-local bootstrap first and machine-level setup second.
- Why it matters: The user wants missing workflow infrastructure fixed, but not through reckless hidden automation.
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M003/S03
- Validation: mapped
- Notes: Explicit approval is required for higher-blast-radius actions.

### R010 — Template-based workflow bootstrap reuse
- Class: differentiator
- Status: active
- Description: Command Center should reuse known-good repo patterns or templates when bootstrapping missing workflow pieces instead of hand-rolling setup every time.
- Why it matters: Reusing a proven template is faster, more consistent, and less error-prone than ad hoc setup.
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: M003/S01
- Validation: mapped
- Notes: Template origin and intended effect should stay inspectable.

### R011 — Discussion and research visibility
- Class: differentiator
- Status: active
- Description: Command Center must preserve and surface discussion/research context, not collapse the workflow into only planning and execution artifacts.
- Why it matters: The user explicitly does not want a tool that skips the thinking stages or forgets what is still uncertain.
- Source: user
- Primary owning slice: M002/S04
- Supporting slices: M003/S04
- Validation: mapped
- Notes: “What’s still up in the air” is part of the product, not extra commentary.

### R012 — Holistic checkpoint hygiene reminders
- Class: continuity
- Status: active
- Description: Command Center should remind the user when continuity/checkpoint hygiene appears stale, missing, or overdue.
- Why it matters: Continuity quality degrades quietly unless the product nudges the user to keep the memory surfaces fresh.
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: M005/S01
- Validation: mapped
- Notes: These reminders should feel helpful, not naggy or ceremonial.

### R013 — Claimed-vs-proven validation model
- Class: validation
- Status: active
- Description: Command Center must eventually distinguish imported or claimed progress from validated, proven completion with evidence.
- Why it matters: The user wants the product to know the difference between “someone wrote it down” and “it was actually proven.”
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: M004/S02, M004/S03
- Validation: mapped
- Notes: This is deferred until after the resume-first cockpit and bootstrap flows are in place.

### R014 — Anti-bloat product boundary
- Class: constraint
- Status: active
- Description: Command Center must remain small, sharp, and personal to this workflow rather than drifting into Mission Control-style orchestration or generic PM software.
- Why it matters: The product exists specifically because heavier tools felt too complex, too bloated, and too buggy.
- Source: user
- Primary owning slice: M002/S06
- Supporting slices: M006/S01
- Validation: mapped
- Notes: This is a durable product constraint, not a temporary preference.

## Validated

### R007 — Docs-first durable source of truth
- Class: quality-attribute
- Status: validated
- Description: Command Center must use repo-local planning and continuity artifacts as the durable source of truth whenever practical.
- Why it matters: Repo-local artifacts are the memory the user can trust across interruptions, tools, and time.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: M001/S05, M001/S06
- Validation: validated
- Notes: M001 audit confirmed working import paths for `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, and `.gsd/DECISIONS.md`, plus a live cockpit that renders imported planning state.

## Deferred

### R015 — Cross-repo normalized progress scoring
- Class: quality-attribute
- Status: deferred
- Description: Command Center should eventually support explainable progress normalization across repos.
- Why it matters: Portfolio comparison will eventually be stronger if “75% done” means something comparable across projects.
- Source: inferred
- Primary owning slice: none
- Supporting slices: M005/S02
- Validation: unmapped
- Notes: Deferred until the cockpit truth model is strong enough to avoid fake certainty.

### R016 — Deep Beads graph translation
- Class: integration
- Status: deferred
- Description: Command Center should eventually translate richer Beads graph state into the canonical planning model.
- Why it matters: Beads is part of the standard workflow stack and will matter for deeper readiness and prioritization.
- Source: user
- Primary owning slice: none
- Supporting slices: M005/S03, M006/S01
- Validation: unmapped
- Notes: Start with honest readiness detection before deep graph semantics.

### R017 — Full multi-tool bootstrap automation
- Class: operability
- Status: deferred
- Description: Command Center may later automate more of the end-to-end workflow setup path across repo and machine layers.
- Why it matters: Full automation could reduce setup friction once the staged model is proven safe.
- Source: inferred
- Primary owning slice: none
- Supporting slices: M003/S03
- Validation: unmapped
- Notes: Keep staged, inspectable, and approval-driven by default.

## Out of Scope

### R018 — Generic PM workspace / team coordination suite
- Class: anti-feature
- Status: out-of-scope
- Description: Command Center is not a generic project-management workspace for broad team coordination.
- Why it matters: This prevents the product from drifting into the exact PM-software feel the user rejects.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The product is intentionally personal and workflow-specific.

### R019 — Hidden central state replacing repo docs
- Class: anti-feature
- Status: out-of-scope
- Description: Command Center must not replace repo-local docs as the only durable truth with opaque central-only state.
- Why it matters: That would break the memory and portability model the user wants.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Internal state may exist, but it must remain subordinate to inspectable repo artifacts.

### R020 — Mission Control-style orchestration platform
- Class: anti-feature
- Status: out-of-scope
- Description: Command Center must not become a Mission Control-style orchestration platform with unnecessary complexity, bloat, and fragility.
- Why it matters: The product was born from frustration with that category’s failure mode.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: This anti-feature should be re-checked whenever roadmap scope grows.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M002/S01 | M002/S04, M002/S06 | mapped |
| R002 | primary-user-loop | active | M002/S05 | M005/S02 | mapped |
| R003 | continuity | active | M002/S02 | M002/S04 | mapped |
| R004 | integration | active | M002/S03 | M003/S01 | mapped |
| R005 | failure-visibility | active | M002/S03 | M002/S06 | mapped |
| R006 | primary-user-loop | active | M002/S04 | M002/S02, M002/S03 | mapped |
| R007 | quality-attribute | validated | M001/S04 | M001/S05, M001/S06 | validated |
| R008 | quality-attribute | active | M002/S06 | M001/S03, M003/S04 | mapped |
| R009 | operability | active | M003/S01 | M003/S03 | mapped |
| R010 | differentiator | active | M003/S02 | M003/S01 | mapped |
| R011 | differentiator | active | M002/S04 | M003/S04 | mapped |
| R012 | continuity | active | M002/S02 | M005/S01 | mapped |
| R013 | validation | active | M004/S01 | M004/S02, M004/S03 | mapped |
| R014 | constraint | active | M002/S06 | M006/S01 | mapped |
| R015 | quality-attribute | deferred | none | M005/S02 | unmapped |
| R016 | integration | deferred | none | M005/S03, M006/S01 | unmapped |
| R017 | operability | deferred | none | M003/S03 | unmapped |
| R018 | anti-feature | out-of-scope | none | none | n/a |
| R019 | anti-feature | out-of-scope | none | none | n/a |
| R020 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 12
- Mapped to slices: 12
- Validated: 1
- Unmapped active requirements: 0
