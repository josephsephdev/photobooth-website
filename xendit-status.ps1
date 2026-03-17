#!/usr/bin/env pwsh

$configFile = "appwrite/functions/xendit-config.js"

if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw
    if ($content -match "const MODE = '([^']+)'") {
        $mode = $matches[1]
        $icon = if ($mode -eq 'test') { 'TEST' } else { 'LIVE' }
        $color = if ($mode -eq 'test') { 'Green' } else { 'Red' }
        
        Write-Host ""
        Write-Host "[$icon] Xendit is in $($mode.ToUpper()) mode" -ForegroundColor $color
        Write-Host ""
        
        if ($mode -eq 'test') {
            Write-Host "Safe to test! Use test card: 4111 1111 1111 1111" -ForegroundColor Green
        } else {
            Write-Host "WARNING: Using LIVE PRODUCTION KEYS" -ForegroundColor Red
            Write-Host "Real money transactions will be charged!" -ForegroundColor Red
        }
        Write-Host ""
    }
} else {
    Write-Host "Config file not found: $configFile" -ForegroundColor Red
}
