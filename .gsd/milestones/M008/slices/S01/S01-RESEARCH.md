# S01 Research — UX Baseline Audit and Signal Taxonomy

## Scope

This audit establishes the redesign contract for M008 by documenting current UX/UI issues with severity, user impact, and implementation anchors.

Primary surfaces reviewed:

- Header actions and first-use affordances
- Project discovery cards
- Cockpit panel stack (Workflow State, Readiness, Continuity, Next Action, Open Loops)
- Import Controls and trust/provenance signals
- Onboarding wayfinding (README, User Guide, in-app help link)

## Method

- Code audit of `src/App.tsx` interaction + rendering semantics
- Docs/product-contract audit of `README.md`, `docs/USER-GUIDE.md`, `ROADMAP.md`
- Runtime verification of launcher and lifecycle behavior (doctor/launch/stop)
- Browser-level walkthrough of primary workflow

---

## Executive Summary

Command Center now has strong workflow intelligence but still asks users to decode too much from visual shorthand. The highest-value redesign direction is:

1. make card-level signals explicit and labeled,
2. remove deceptive/dead-end affordances,
3. keep onboarding discoverable in the app,
4. reduce visual noise while preserving density.

The UI should shift from “power-user cockpit requiring interpretation” to “professional operations console with explicit semantics.”

---

## Prioritized Findings (P0/P1/P2)

### P0 — Must fix first

#### F-001: Unlabeled/ambiguous project-card signal pills
- **Surface:** project cards in main grid
- **Current symptom:** values like `active · interp`, `fresh 1h · interp` appear without explicit dimension labels
- **User impact:** first-time users cannot reliably infer whether a chip means phase, continuity, readiness, or confidence
- **Risk:** incorrect prioritization decisions at the portfolio level
- **Direction:** replace shorthand pills with labeled semantic chips (`Phase:`, `Continuity:`, `Readiness:`)

#### F-002: Deceptive primary CTA risk (`New Project`)
- **Surface:** header CTA cluster
- **Current symptom:** high-prominence button suggests actionable flow but does not complete an onboarding path
- **User impact:** trust break early in first session
- **Risk:** immediate perception of incomplete product behavior
- **Direction:** implement a real flow or demote/remove until flow exists

#### F-003: Non-semantic project-card interaction container
- **Surface:** clickable project cards
- **Current symptom:** card selection is implemented on generic clickable container
- **User impact:** weaker keyboard semantics and discoverability
- **Risk:** accessibility and interaction reliability regressions
- **Direction:** migrate to semantic button/link interaction pattern

### P1 — High-value clarity/polish

#### F-004: Excessive microtext styling noise
- **Surface:** many labels/captions in all-caps microtext treatment
- **Current symptom:** high density of small uppercase metadata with wide tracking
- **User impact:** scan fatigue; signal/noise ratio drops
- **Direction:** reduce decorative emphasis, promote meaning-bearing labels, simplify microtext style system

#### F-005: Generic motion (`transition-all`) over intentional transitions
- **Surface:** action buttons/cards/forms
- **Current symptom:** broad transitions on many elements
- **User impact:** less polished interaction feel; potential animation of unintended properties
- **Direction:** use property-specific transitions (`color`, `background-color`, `transform`, `border-color`, `box-shadow`) with consistent timing tokens

#### F-006: Focus visibility inconsistency
- **Surface:** inputs and interactive controls
- **Current symptom:** outline suppression without a unified focus-visible replacement system on all controls
- **User impact:** keyboard users lose reliable focus orientation
- **Direction:** establish consistent `focus-visible` ring treatment across controls

### P2 — Finish quality and consistency

#### F-007: Header action hierarchy not fully explicit
- **Surface:** top action row
- **Current symptom:** multiple CTAs visually peer-level while user intent priority differs
- **User impact:** choice friction
- **Direction:** define primary/secondary/utility action hierarchy

#### F-008: Provenance and interpreted badges still too terse at card level
- **Surface:** portfolio cards
- **Current symptom:** interpreted status shorthand is compact but not self-explanatory
- **User impact:** requires prior product knowledge
- **Direction:** structured chip labels + optional compact explanatory subline

---

## Signal Taxonomy (Target Contract)

### Card-level signals (portfolio view)

Each card should communicate a fixed semantic set, in a stable order:

1. **Plan Status** — `Structured | Partial | None`
2. **Workflow Phase** — `Active | Stalled | Blocked | Import-only | No-data`
3. **Continuity** — `Fresh | Stale | Missing` (+ optional age)
4. **Risk Summary** — unresolved/gap counts

#### Display contract
- Always include a dimension label in chip text (`Phase: Active` not just `Active`)
- Keep same order on every card
- Reserve color as reinforcement, not sole carrier of meaning
- Keep one-line risk summary text directly under primary metadata

### Detail-panel signal contract

- **Workflow State:** phase + confidence + evidence + reasons
- **Readiness:** overall + required-component gaps
- **Continuity:** status + checkpoint hygiene + remediation command where needed
- **Next Action:** clear vs blocked + rationale + blockers + suggested command
- **Open Loops:** unresolved/blocked/deferred/revisable rollup

### Onboarding signal contract

- In-app **User Guide** entry must always be discoverable from primary workflow surface
- README must clearly route users to the User Guide for usage patterns
- User Guide must include “what you see → what it means → what to do → how to verify” loops

---

## Redesign Acceptance Criteria by Upcoming Slice

## S02 — Project Card Redesign for Semantic Clarity

- Card chips are explicitly labeled by dimension
- Users can identify phase/continuity meaning without external docs
- Card selection remains fast and keyboard-accessible
- Visual density is reduced without hiding critical signals

## S03 — Action Hierarchy and In-App Onboarding Surface

- No deceptive high-prominence CTA with no actionable path
- Header action hierarchy is explicit (primary vs secondary vs utility)
- In-app guide/help path is visible and opens in a usable context

## S04 — Visual Polish, Accessibility, and Interaction Consistency

- Focus-visible system is consistent across interactive controls
- Transition model is property-specific and timing-consistent
- Typography hierarchy balances scannability and professionalism
- No regression in startup/doctor/stop operational lifecycle

---

## Verification Checklist (for redesign implementation)

### Functional
- [ ] Project selection works via mouse and keyboard
- [ ] Header CTAs each map to a real behavior
- [ ] Guide link works in-app and from docs

### Semantics & accessibility
- [ ] Interactive card surface uses semantic control role
- [ ] Visible focus indicator present on all actionable controls
- [ ] No icon-only controls without accessible labels

### UX comprehension
- [ ] Card chips are dimension-labeled
- [ ] First-time user can explain what each card signal means without source reading
- [ ] Next Action remains the primary execution trigger

### Visual polish
- [ ] Reduced metadata noise; improved hierarchy
- [ ] No blanket `transition-all` on major controls
- [ ] Color used as reinforcement, not sole semantic channel

### Operational safety
- [ ] `npm run build` passes
- [ ] `npm run cc:doctor` pass/warn behavior consistent
- [ ] `npm run cc:launch` and `npm run cc:stop` lifecycle still stable

---

## Boundary Decisions for M008

In-scope:
- UI semantics, hierarchy, card clarity, onboarding affordances, interaction polish

Out-of-scope:
- Backend model refactors unrelated to UX clarity
- New planning domain entities
- Broad architecture changes outside cockpit UX surfaces

---

## Recommendation

Start implementation with S02 card semantics immediately after this audit baseline.

Reason: it addresses the single largest first-use comprehension issue and unlocks the rest of the redesign with clear success criteria.
