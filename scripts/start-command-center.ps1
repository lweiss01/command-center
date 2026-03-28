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

function Test-PortOpen {
  param([int]$Port)

  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $connect = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
    $connectedInTime = $connect.AsyncWaitHandle.WaitOne(300)

    if (-not $connectedInTime) {
      $client.Close()
      return $false
    }

    $client.EndConnect($connect)
    $client.Close()
    return $true
  }
  catch {
    return $false
  }
}

function Wait-ForPort {
  param(
    [int]$Port,
    [string]$ServiceName,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortOpen -Port $Port) {
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

  if (Test-PortOpen -Port $Port) {
    Write-Status "$ServiceName already running on port $Port."
    return $null
  }

  $escapedRepoRoot = $RepoRoot -replace "'", "''"
  $escapedLogPath = $LogPath -replace "'", "''"
  $windowTitle = "Command Center - $ServiceName"
  $windowCommand = @"
Set-Location -LiteralPath '$escapedRepoRoot'
`$Host.UI.RawUI.WindowTitle = '$windowTitle'
Write-Host '[command-center] Logging to $escapedLogPath'
$Command 2>&1 | Tee-Object -FilePath '$escapedLogPath'
"@

  Write-Status "Starting $ServiceName ($Command)..."
  $process = Start-Process -FilePath $PowerShellHost -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $windowCommand) -WorkingDirectory $RepoRoot -PassThru

  Start-Sleep -Milliseconds 500
  if ($process.HasExited) {
    throw "$ServiceName exited immediately."
  }

  return $process
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
    Write-Status "Opening browser at $url"
    Start-Process $url | Out-Null
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
