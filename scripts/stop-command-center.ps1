[CmdletBinding()]
param(
  [int[]]$Ports = @(3001, 5173)
)

$ErrorActionPreference = 'Stop'

function Write-Status {
  param([string]$Message)
  Write-Host "[command-center] $Message"
}

try {
  $stopped = @()
  $alreadyFree = @()

  foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) {
      $alreadyFree += $port
      continue
    }

    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
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
