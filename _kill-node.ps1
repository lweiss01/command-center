Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500
Write-Host DONE
