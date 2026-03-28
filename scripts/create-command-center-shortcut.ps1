[CmdletBinding()]
param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function New-CommandCenterShortcut {
  param(
    [Parameter(Mandatory = $true)][string]$DesktopPath,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$TargetPath,
    [Parameter(Mandatory = $true)][string]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string]$Description,
    [Parameter(Mandatory = $true)][string]$IconLocation,
    [switch]$Overwrite
  )

  $shortcutPath = Join-Path $DesktopPath ("$Name.lnk")
  if ((Test-Path -LiteralPath $shortcutPath) -and (-not $Overwrite)) {
    Write-Host "[command-center] Shortcut already exists: $shortcutPath"
    Write-Host '[command-center] Re-run with -Force to overwrite.'
    return
  }

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $TargetPath
  $shortcut.Arguments = $Arguments
  $shortcut.WorkingDirectory = $WorkingDirectory
  $shortcut.IconLocation = $IconLocation
  $shortcut.Description = $Description
  $shortcut.Save()

  Write-Host "[command-center] Shortcut created: $shortcutPath"
  Write-Host "[command-center] Target: $TargetPath"
  Write-Host "[command-center] Arguments: $Arguments"
}

try {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $startScript = Join-Path $PSScriptRoot 'start-command-center.ps1'
  $stopScript = Join-Path $PSScriptRoot 'stop-command-center.ps1'

  if (-not (Test-Path -LiteralPath $startScript)) {
    throw "Launcher script not found: $startScript"
  }

  if (-not (Test-Path -LiteralPath $stopScript)) {
    throw "Stop script not found: $stopScript"
  }

  $desktopPath = [Environment]::GetFolderPath('Desktop')
  if ([string]::IsNullOrWhiteSpace($desktopPath)) {
    throw 'Unable to resolve Desktop path for current user.'
  }

  $pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
  $targetPath = if ($pwshCommand) { $pwshCommand.Source } else { 'powershell.exe' }

  $launchParams = @{
    DesktopPath      = $desktopPath
    Name             = 'Command Center'
    TargetPath       = $targetPath
    Arguments        = "-ExecutionPolicy Bypass -File `"$startScript`""
    WorkingDirectory = $repoRoot
    Description      = 'Launch Command Center backend + frontend and open browser.'
    IconLocation     = "$env:SystemRoot\System32\shell32.dll,220"
    Overwrite        = [bool]$Force
  }
  New-CommandCenterShortcut @launchParams

  $stopParams = @{
    DesktopPath      = $desktopPath
    Name             = 'Command Center (Stop)'
    TargetPath       = $targetPath
    Arguments        = "-ExecutionPolicy Bypass -File `"$stopScript`""
    WorkingDirectory = $repoRoot
    Description      = 'Stop Command Center backend + frontend listeners (ports 3001/5173).'
    IconLocation     = "$env:SystemRoot\System32\shell32.dll,131"
    Overwrite        = [bool]$Force
  }
  New-CommandCenterShortcut @stopParams

  exit 0
}
catch {
  Write-Error "[command-center] Failed to create desktop shortcuts: $($_.Exception.Message)"
  exit 1
}
