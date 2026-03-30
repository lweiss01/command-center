---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T01: Create Windows desktop launcher for one-click startup

Create a Windows launcher entrypoint that orchestrates backend + frontend startup and opens the browser at the local app URL. Add a shortcut-creation script that places/updates a desktop icon pointing at the launcher. Ensure process startup emits clear success/failure status and exits with non-zero code on startup failure.

## Inputs

- `Existing frontend/backend start commands in repo`
- `Windows desktop path environment`
- `Current local URL and ports`

## Expected Output

- `scripts/start-command-center.ps1`
- `scripts/create-command-center-shortcut.ps1`
- `Desktop shortcut created/updated for Command Center`
- `Launcher usage notes in task summary`

## Verification

pwsh -File scripts/create-command-center-shortcut.ps1
pwsh -File scripts/start-command-center.ps1
# Confirm browser opens and both services start successfully
