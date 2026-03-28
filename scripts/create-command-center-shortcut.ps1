[CmdletBinding()]
param(
  [string]$ShortcutName = 'Command Center',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

try {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $launcherScript = Join-Path $PSScriptRoot 'start-command-center.ps1'

  if (-not (Test-Path -LiteralPath $launcherScript)) {
    throw "Launcher script not found: $launcherScript"
  }

  $desktopPath = [Environment]::GetFolderPath('Desktop')
  if ([string]::IsNullOrWhiteSpace($desktopPath)) {
    throw 'Unable to resolve Desktop path for current user.'
  }

  $shortcutPath = Join-Path $desktopPath ("$ShortcutName.lnk")

  if ((Test-Path -LiteralPath $shortcutPath) -and (-not $Force)) {
    Write-Host "[command-center] Shortcut already exists: $shortcutPath"
    Write-Host '[command-center] Re-run with -Force to overwrite.'
    exit 0
  }

  $pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
  $targetPath = if ($pwshCommand) { $pwshCommand.Source } else { 'powershell.exe' }

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $targetPath
  $shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$launcherScript`""
  $shortcut.WorkingDirectory = $repoRoot
  $shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
  $shortcut.Description = 'Launch Command Center backend + frontend and open browser.'
  $shortcut.Save()

  Write-Host "[command-center] Shortcut created: $shortcutPath"
  Write-Host "[command-center] Target: $targetPath"
  Write-Host "[command-center] Arguments: $($shortcut.Arguments)"
  exit 0
}
catch {
  Write-Error "[command-center] Failed to create desktop shortcut: $($_.Exception.Message)"
  exit 1
}
