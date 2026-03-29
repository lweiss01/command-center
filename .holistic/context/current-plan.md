# Current Plan

## Goal

Wire backendStatus UI: wordmark dot + offline callout in project list.

## Latest Status

Committed: feat: backend status polling with auto-recovery (a63446c)

## What Was Done This Session

- Full design system v2: two-layer CSS token system (primitives → semantic)
- Retro palette applied: teal accent (#028391), lighter teal ok (#4BBFC9),
  peach warn (#FAA968), burnt orange danger (#F85525), cream info (#F6DCAC)
- Fonts: Space Grotesk (UI) + Space Mono (mono) — loaded in index.html, wired through CSS tokens
- Section reorder: Next Action is now the hero at top; Import moved to bottom
- Project rows: colored dot + phase label replaces G:{}/U:{} debug notation
- Focus-visible styles, CSS transitions added
- gitignored: design-preview.html, palette-preview.html, retro-palette.jpg
- Backend polling loop added: 30s when online, 5s when offline, auto-recovers

## Planned Next Steps

1. **Wire backendStatus to UI** — two things needed in App.tsx:
   - Rename `_backendStatus` back to `backendStatus` (temp suppression for build)
   - Add colored dot to wordmark: dim=#3A342C checking, #4BBFC9 online, #F85525 offline
   - Replace old error banner with prominent offline callout in project list area
   - Remove the now-duplicate initial projects `useEffect` (lines ~230-237) — polling handles it

2. Validate full UI end-to-end with backend up and down

## Key Files

- `src/App.tsx` — all UI logic
- `src/index.css` — design token system
- `index.html` — font imports

## References

- Design tokens: see `src/index.css` `:root` block — primitives then semantic layer
- Retro palette source: `retro-palette.jpg` (local only, gitignored)
