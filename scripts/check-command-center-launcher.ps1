[CmdletBinding()]
param(
  [int[]]$Ports = @(3001, 5173)
)

$ErrorActionPreference = 'Stop'

$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Status,
    [string]$Check,
    [string]$Details,
    [string]$Recommendation = ''
  )

  $results.Add([PSCustomObject]@{
      Status         = $Status
      Check          = $Check
      Details        = $Details
      Recommendation = $Recommendation
    }) | Out-Null
}

function Resolve-PowerShellHost {
  $pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
  if ($pwshCommand) {
    return $pwshCommand.Source
  }

  $powershellCommand = Get-Command powershell -ErrorAction SilentlyContinue
  if ($powershellCommand) {
    return $powershellCommand.Source
  }

  return $null
}

function Test-Shortcut {
  param(
    [string]$Path,
    [string]$ExpectedScriptPath
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return @{ Status = 'FAIL'; Details = "Missing shortcut: $Path"; Recommendation = 'Run npm run cc:shortcut to regenerate desktop shortcuts.' }
  }

  try {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($Path)

    $targetPath = $shortcut.TargetPath
    $arguments = $shortcut.Arguments

    if (-not $targetPath) {
      return @{ Status = 'FAIL'; Details = "Shortcut has no target: $Path"; Recommendation = 'Recreate shortcut with npm run cc:shortcut.' }
    }

    $expectedScriptName = [System.IO.Path]::GetFileName($ExpectedScriptPath)
    $targetExists = Test-Path -LiteralPath $targetPath
    $scriptReferenced = $arguments -match [Regex]::Escape($expectedScriptName)
    $scriptExists = Test-Path -LiteralPath $ExpectedScriptPath

    if (-not $targetExists) {
      return @{ Status = 'FAIL'; Details = "Shortcut target missing: $targetPath"; Recommendation = 'Install/repair PowerShell and rerun npm run cc:shortcut.' }
    }

    if (-not $scriptExists) {
      return @{ Status = 'FAIL'; Details = "Expected script missing: $ExpectedScriptPath"; Recommendation = 'Restore launcher scripts and rerun npm run cc:shortcut.' }
    }

    if (-not $scriptReferenced) {
      return @{ Status = 'FAIL'; Details = "Shortcut arguments do not reference $expectedScriptName"; Recommendation = 'Run npm run cc:shortcut to rewrite shortcut arguments.' }
    }

    return @{ Status = 'PASS'; Details = "Shortcut valid: $Path -> $targetPath $arguments"; Recommendation = '' }
  }
  catch {
    return @{ Status = 'FAIL'; Details = "Failed to inspect shortcut: $($_.Exception.Message)"; Recommendation = 'Ensure WScript.Shell COM is available and rerun npm run cc:shortcut.' }
  }
}

try {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $startScript = Join-Path $PSScriptRoot 'start-command-center.ps1'
  $stopScript = Join-Path $PSScriptRoot 'stop-command-center.ps1'

  $desktopPath = [Environment]::GetFolderPath('Desktop')
  if ([string]::IsNullOrWhiteSpace($desktopPath)) {
    Add-Result -Status 'FAIL' -Check 'Desktop path' -Details 'Could not resolve desktop path for current user.' -Recommendation 'Confirm user profile is available and retry.'
  }
  else {
    Add-Result -Status 'PASS' -Check 'Desktop path' -Details $desktopPath
  }

  $powerShellHost = Resolve-PowerShellHost
  if ($powerShellHost) {
    Add-Result -Status 'PASS' -Check 'PowerShell host' -Details $powerShellHost
  }
  else {
    Add-Result -Status 'FAIL' -Check 'PowerShell host' -Details 'Neither pwsh nor powershell found in PATH.' -Recommendation 'Install PowerShell and ensure it is available in PATH.'
  }

  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) {
    Add-Result -Status 'PASS' -Check 'Node.js' -Details $nodeCommand.Source
  }
  else {
    Add-Result -Status 'FAIL' -Check 'Node.js' -Details 'node command not found.' -Recommendation 'Install Node.js and reopen terminal.'
  }

  $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
  if ($npmCommand) {
    Add-Result -Status 'PASS' -Check 'npm' -Details $npmCommand.Source
  }
  else {
    Add-Result -Status 'FAIL' -Check 'npm' -Details 'npm command not found.' -Recommendation 'Install Node.js/npm and reopen terminal.'
  }

  foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
      $owners = ($connections | Select-Object -ExpandProperty OwningProcess -Unique) -join ', '
      Add-Result -Status 'WARN' -Check "Port $port" -Details "Port is already in use by PID(s): $owners" -Recommendation 'If launch fails, run npm run cc:stop to clear services before retrying.'
    }
    else {
      Add-Result -Status 'PASS' -Check "Port $port" -Details 'Port is free.'
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($desktopPath)) {
    $launchShortcutPath = Join-Path $desktopPath 'Command Center.lnk'
    $stopShortcutPath = Join-Path $desktopPath 'Command Center (Stop).lnk'

    $launchResult = Test-Shortcut -Path $launchShortcutPath -ExpectedScriptPath $startScript
    Add-Result -Status $launchResult.Status -Check 'Launch shortcut' -Details $launchResult.Details -Recommendation $launchResult.Recommendation

    $stopResult = Test-Shortcut -Path $stopShortcutPath -ExpectedScriptPath $stopScript
    Add-Result -Status $stopResult.Status -Check 'Stop shortcut' -Details $stopResult.Details -Recommendation $stopResult.Recommendation
  }

  $logDir = Join-Path $repoRoot '.logs'
  if (Test-Path -LiteralPath $logDir) {
    Add-Result -Status 'PASS' -Check 'Log directory' -Details $logDir
  }
  else {
    Add-Result -Status 'WARN' -Check 'Log directory' -Details "Missing: $logDir" -Recommendation 'Run npm run cc:launch once to create launcher log files.'
  }

  Write-Host '[command-center] Launcher preflight report:'
  Write-Host ''

  foreach ($result in $results) {
    $line = "[{0}] {1} - {2}" -f $result.Status, $result.Check, $result.Details
    Write-Host $line
    if ($result.Recommendation) {
      Write-Host ("       Recommendation: {0}" -f $result.Recommendation)
    }
  }

  $failures = @($results | Where-Object { $_.Status -eq 'FAIL' })
  $warnings = @($results | Where-Object { $_.Status -eq 'WARN' })

  Write-Host ''
  if ($failures.Count -gt 0) {
    Write-Host ("[command-center] Preflight failed with {0} failure(s) and {1} warning(s)." -f $failures.Count, $warnings.Count)
    exit 1
  }

  Write-Host ("[command-center] Preflight passed with {0} warning(s)." -f $warnings.Count)
  exit 0
}
catch {
  Write-Error "[command-center] Launcher preflight crashed: $($_.Exception.Message)"
  exit 1
}
