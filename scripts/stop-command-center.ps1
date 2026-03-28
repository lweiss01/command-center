[CmdletBinding()]
param(
  [int[]]$Ports = @(3001, 5173)
)

$ErrorActionPreference = 'Stop'

function Write-Status {
  param([string]$Message)
  Write-Host "[command-center] $Message"
}

function Get-ListeningProcessIdsForPort {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $netstatCommand = Get-Command netstat.exe -ErrorAction SilentlyContinue
  if ($netstatCommand) {
    $netstatPath = $netstatCommand.Source
  }
  elseif ($env:SystemRoot) {
    $fallbackPath = Join-Path $env:SystemRoot 'System32\netstat.exe'
    if (Test-Path -LiteralPath $fallbackPath) {
      $netstatPath = $fallbackPath
    }
  }

  if (-not $netstatPath) {
    throw 'Could not resolve netstat.exe.'
  }

  $pattern = ":$Port"
  $processIds = New-Object System.Collections.Generic.HashSet[int]

  foreach ($line in & $netstatPath -ano -p tcp) {
    if ($line -notmatch 'LISTENING') {
      continue
    }

    if ($line -notmatch [Regex]::Escape($pattern)) {
      continue
    }

    $parts = $line -split '\s+'
    if ($parts.Count -lt 5) {
      continue
    }

    $localAddress = $parts[1]
    if ($localAddress -notmatch [Regex]::Escape($pattern) + '$') {
      continue
    }

    $pidRaw = $parts[-1]
    $pid = 0
    if ([int]::TryParse($pidRaw, [ref]$pid)) {
      [void]$processIds.Add($pid)
    }
  }

  return @($processIds)
}

try {
  $stopped = @()
  $alreadyFree = @()

  foreach ($port in $Ports) {
    $processIds = Get-ListeningProcessIdsForPort -Port $port
    if ($processIds.Count -eq 0) {
      $alreadyFree += $port
      continue
    }

    foreach ($processId in $processIds) {
      try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        $stopped += [PSCustomObject]@{ Port = $port; ProcessId = $processId }
        Write-Status "Stopped PID $processId on port $port."
      }
      catch {
        throw "Failed stopping PID $processId on port ${port}: $($_.Exception.Message)"
      }
    }
  }

  if ($alreadyFree.Count -gt 0) {
    Write-Status "Already free: $($alreadyFree -join ', ')"
  }

  if ($stopped.Count -eq 0) {
    Write-Status 'No running backend/frontend listeners were found.'
  }
  else {
    Write-Status 'Stop complete.'
  }

  exit 0
}
catch {
  Write-Error "[command-center] Stop failed: $($_.Exception.Message)"
  exit 1
}
