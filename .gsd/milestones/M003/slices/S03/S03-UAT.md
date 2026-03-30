# S03: Safe apply engine + approval gates — UAT

**Milestone:** M003
**Written:** 2026-03-30T04:31:52.751Z

# UAT S03: Safe Apply Engine

## Conflict Detection
1. Find a project with a bootstrap gap (e.g. missing `PROJECT.md`).
2. Manually create the file at that path.
3. Select the project and locate the "Apply" button in the Bootstrap Plan.
4. Click "Apply" — verify that a yellow conflict warning appears in the confirmation panel.
5. Confirm that the message identifies the specific file path and explains it will be overwritten.

## Undo Guidance
1. Click "Confirm" anyway — verify the file is created/overwritten.
2. Observe the "To undo: delete <path>" hint that appears below the "Bootstrap Plan" heading.
3. Click the "×" on the hint — verify it is dismissed.

## Clean Apply (No Conflict)
1. Find a project with a bootstrap gap where no file exists at the target path.
2. Click "Apply" — verify that the confirmation panel opens WITHOUT a yellow warning.
3. Click "Confirm" — verify successful apply and appearance of the undo hint.

