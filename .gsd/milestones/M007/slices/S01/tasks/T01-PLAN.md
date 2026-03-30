---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Add launcher preflight diagnostic command

Add a launcher diagnostics helper script that performs startup preflight checks (PowerShell host, node/npm availability, port occupancy, shortcut target validity) and prints actionable pass/fail output. Integrate as npm alias for quick support checks.

## Inputs

- `Existing launcher scripts`
- `Current port contract 3001/5173`

## Expected Output

- `scripts/check-command-center-launcher.ps1`
- `package.json `cc:doctor` script alias`
- `Clear preflight pass/fail output`

## Verification

powershell -ExecutionPolicy Bypass -File scripts/check-command-center-launcher.ps1
npm run cc:doctor
