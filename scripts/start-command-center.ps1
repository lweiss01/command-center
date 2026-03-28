[CmdletBinding()]
param(
  [int]$BackendPort = 3001,
  [int]$FrontendPort = 5173,
  [int]$StartupTimeoutSeconds = 90,
  [switch]$NoBrowser
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
    $match = [Regex]::Match($line, '^\s*TCP\s+(\S+)\s+\S+\s+LISTENING\s+(\d+)\s*$')
    if (-not $match.Success) {
      continue
    }

    $localAddress = $match.Groups[1].Value
    if ($localAddress -notmatch [Regex]::Escape($pattern) + '$') {
      continue
    }

    $pidRaw = $match.Groups[2].Value
    $parsedPid = 0
    if ([int]::TryParse($pidRaw, [ref]$parsedPid)) {
      [void]$processIds.Add($parsedPid)
    }
  }

  return @($processIds)
}

function Test-PortListening {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $processIds = Get-ListeningProcessIdsForPort -Port $Port
  return $processIds.Count -gt 0
}

function Wait-ForPort {
  param(
    [int]$Port,
    [string]$ServiceName,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortListening -Port $Port) {
      Write-Status "$ServiceName is ready on port $Port."
      return $true
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Start-ServiceWindow {
  param(
    [string]$ServiceName,
    [string]$Command,
    [int]$Port,
    [string]$RepoRoot,
    [string]$PowerShellHost,
    [string]$LogPath
  )

  if (Test-PortListening -Port $Port) {
    Write-Status "$ServiceName already running on port $Port."
    return $null
  }

  $escapedRepoRoot = $RepoRoot -replace "'", "''"
  $escapedLogPath = $LogPath -replace "'", "''"
  $windowTitle = "Command Center - $ServiceName"
  $windowCommand = @"
Set-Location -LiteralPath '$escapedRepoRoot'
`$Host.UI.RawUI.WindowTitle = '$windowTitle'
`$chcpPath = Join-Path `$env:SystemRoot 'System32\chcp.com'
if (Test-Path -LiteralPath `$chcpPath) {
  & `$chcpPath 65001 | Out-Null
}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
`$OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host '[command-center] Logging to $escapedLogPath'
$Command 2>&1 | Tee-Object -FilePath '$escapedLogPath' -Append
"@

  Write-Status "Starting $ServiceName ($Command) in hidden background process..."
  $process = Start-Process -FilePath $PowerShellHost -ArgumentList @('-ExecutionPolicy', 'Bypass', '-Command', $windowCommand) -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru

  Start-Sleep -Milliseconds 500
  if ($process.HasExited) {
    throw "$ServiceName exited immediately."
  }

  return $process
}

function Resolve-AppBrowserPath {
  $edgeCommand = Get-Command msedge.exe -ErrorAction SilentlyContinue
  if ($edgeCommand) {
    return $edgeCommand.Source
  }

  $chromeCommand = Get-Command chrome.exe -ErrorAction SilentlyContinue
  if ($chromeCommand) {
    return $chromeCommand.Source
  }

  $fallbackCandidates = @(
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
  )

  foreach ($candidate in $fallbackCandidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return $null
}

try {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  Set-Location -LiteralPath $repoRoot

  $pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
  $powershellCommand = Get-Command powershell -ErrorAction SilentlyContinue
  $powerShellHost = if ($pwshCommand) { $pwshCommand.Source } elseif ($powershellCommand) { $powershellCommand.Source } else { throw 'Neither pwsh nor powershell is available in PATH.' }

  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $nodeCommand) { throw 'node is not available in PATH.' }
  if (-not $npmCommand) { throw 'npm is not available in PATH.' }

  $logDir = Join-Path $repoRoot '.logs'
  if (-not (Test-Path -LiteralPath $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
  }

  $backendLogPath = Join-Path $logDir 'command-center-backend.log'
  $frontendLogPath = Join-Path $logDir 'command-center-frontend.log'

  Write-Status "Repo root: $repoRoot"
  Write-Status "PowerShell host: $powerShellHost"
  Write-Status "Backend log: $backendLogPath"
  Write-Status "Frontend log: $frontendLogPath"

  Start-ServiceWindow -ServiceName 'backend' -Command 'node server.js' -Port $BackendPort -RepoRoot $repoRoot -PowerShellHost $powerShellHost -LogPath $backendLogPath | Out-Null
  Start-ServiceWindow -ServiceName 'frontend' -Command 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort' -Port $FrontendPort -RepoRoot $repoRoot -PowerShellHost $powerShellHost -LogPath $frontendLogPath | Out-Null

  if (-not (Wait-ForPort -Port $BackendPort -ServiceName 'backend' -TimeoutSeconds $StartupTimeoutSeconds)) {
    throw "Backend failed to become ready on port $BackendPort within $StartupTimeoutSeconds seconds. Check $backendLogPath"
  }

  if (-not (Wait-ForPort -Port $FrontendPort -ServiceName 'frontend' -TimeoutSeconds $StartupTimeoutSeconds)) {
    throw "Frontend failed to become ready on port $FrontendPort within $StartupTimeoutSeconds seconds. Check $frontendLogPath"
  }

  $url = "http://localhost:$FrontendPort"
  if (-not $NoBrowser) {
    $browserPath = Resolve-AppBrowserPath
    if ($browserPath) {
      Write-Status "Opening dedicated app window at $url"
      $browserProcess = Start-Process -FilePath $browserPath -ArgumentList @('--new-window', "--app=$url") -PassThru

      $stopScriptPath = Join-Path $PSScriptRoot 'stop-command-center.ps1'
      $escapedStopScriptPath = $stopScriptPath -replace "'", "''"
      $watcherCommand = @"
`$ErrorActionPreference = 'SilentlyContinue'
try { Wait-Process -Id $($browserProcess.Id) } catch {}
& '$escapedStopScriptPath' -Ports @($BackendPort, $FrontendPort) | Out-Null
"@

      Start-Process -FilePath $powerShellHost -ArgumentList @('-ExecutionPolicy', 'Bypass', '-Command', $watcherCommand) -WorkingDirectory $repoRoot -WindowStyle Hidden | Out-Null
      Write-Status "Auto-stop watcher armed (browser PID $($browserProcess.Id)). Services will stop when the app window closes."
    }
    else {
      Write-Status "No supported browser executable (msedge/chrome) found for auto-stop mode; opening default browser at $url"
      Write-Status 'Auto-stop is unavailable in this shell. Use npm run cc:stop or the Stop shortcut when done.'
      Start-Process $url | Out-Null
    }
  }
  else {
    Write-Status "NoBrowser switch set; skipping browser open for $url"
  }

  Write-Status 'Startup complete.'
  exit 0
}
catch {
  Write-Error "[command-center] Startup failed: $($_.Exception.Message)"
  exit 1
}
