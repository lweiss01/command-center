---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T02: Add stop companion flow and dual desktop shortcuts

Add a companion stop flow for launcher ergonomics: implement `scripts/stop-command-center.ps1` to stop listeners on ports 3001/5173 with clear status output; update `scripts/create-command-center-shortcut.ps1` to create both `Command Center.lnk` and `Command Center (Stop).lnk`; add `cc:stop` npm alias; document launch/stop usage in README.

## Inputs

- `Existing launcher script and shortcut script from S07/T01`
- `Current backend/frontend port contract (3001/5173)`

## Expected Output

- `scripts/stop-command-center.ps1`
- `Updated create-command-center-shortcut.ps1 creating launch+stop shortcuts`
- `package.json with cc:stop script`
- `README launcher usage block`

## Verification

powershell -ExecutionPolicy Bypass -File scripts/create-command-center-shortcut.ps1 -Force
powershell -ExecutionPolicy Bypass -File scripts/stop-command-center.ps1
powershell -ExecutionPolicy Bypass -File scripts/start-command-center.ps1 -NoBrowser
npx tsc --noEmit

## Observability Impact

Stop script emits explicit status lines and failure reasons; launcher+stop shortcuts provide user-visible control points.
