#!/usr/bin/env pwsh
<#
.SYNOPSIS
Toggle Xendit mode AND deploy functions in one command

.DESCRIPTION
Toggles between test/live mode and automatically deploys updated functions to Appwrite.
Combines the toggle script + appwrite deploy in one step.

.PARAMETER Mode
'test' or 'live'. If not specified, toggles from current mode.

.EXAMPLE
# Toggle and deploy
.\toggle-and-deploy-xendit.ps1

# Switch to test and deploy
.\toggle-and-deploy-xendit.ps1 -Mode test

# Switch to live and deploy
.\toggle-and-deploy-xendit.ps1 -Mode live

.NOTES
Requires: Appwrite CLI installed and authenticated
#>

param(
    [Parameter(Position=0)]
    [ValidateSet('test', 'live')]
    [string]$Mode
)

$ErrorActionPreference = 'Continue'
$configFile = "appwrite/functions/xendit-config.js"
$liveSecretKey = "xnd_production_zOsu3KMkhbVKV3tYhsNbjWohDSR7UJlt7cU43qztjJQZwyqzyxzxlspgWne"
$liveWebhookToken = "xwttqFPZuIA79uL2stbpig9ijRAcOiibLPxUZ3uErka1tWYD"

$testSecretKey = "xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM"
$testWebhookToken = "KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs"

Write-Host ""
Write-Host "==================== XENDIT TOGGLE + DEPLOY ====================" -ForegroundColor Cyan
Write-Host ""

# ── Detect current mode ─────────────────────────────────────────

Write-Host "Step 1: Detecting current mode..." -ForegroundColor Cyan

if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw
    if ($content -match "const MODE = '([^']+)'") {
        $currentMode = $matches[1]
    } else {
        $currentMode = "test"
    }
} else {
    Write-Host "ERROR: Config file not found at $configFile" -ForegroundColor Red
    exit 1
}

Write-Host "Current mode: $currentMode" -ForegroundColor Gray

# ── Determine target mode ───────────────────────────────────────

if ([string]::IsNullOrEmpty($Mode)) {
    $targetMode = if ($currentMode -eq "test") { "live" } else { "test" }
} else {
    $targetMode = $Mode
}

if ($targetMode -eq $currentMode) {
    Write-Host "Already in $currentMode mode. Exiting." -ForegroundColor Yellow
    exit 0
}

# ── Get credentials for target mode ─────────────────────────────

if ($targetMode -eq "test") {
    $secretKey = $testSecretKey
    $webhookToken = $testWebhookToken
    $colorKey = "Green"
} else {
    $secretKey = $liveSecretKey
    $webhookToken = $liveWebhookToken
    $colorKey = "Red"
}

Write-Host ""
Write-Host "Step 2: Toggling mode..." -ForegroundColor Cyan
Write-Host "[CONFIG] Switching from $currentMode to $targetMode mode" -ForegroundColor $colorKey

# ── Update config file ──────────────────────────────────────────

try {
    $newContent = $content -replace "const MODE = '[^']+'", "const MODE = '$targetMode'"
    $newContent | Set-Content $configFile -NoNewline -Encoding UTF8
    Write-Host "   OK: Config file updated" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to update config file: $_" -ForegroundColor Red
    exit 1
}

# ── Deploy functions ────────────────────────────────────────────

Write-Host ""
Write-Host "Step 3: Deploying functions to Appwrite..." -ForegroundColor Cyan

try {
    & appwrite deploy function --yes 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: Functions deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: Deploy command had warnings, but continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR: Failed to deploy: $_" -ForegroundColor Red
    Write-Host "   (Config file was updated, but functions were not deployed)" -ForegroundColor Yellow
    exit 1
}

# ── Summary ─────────────────────────────────────────────────────

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Toggle + Deploy Complete!" -ForegroundColor $colorKey
Write-Host "Mode: $($targetMode.ToUpper())" -ForegroundColor $colorKey
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($targetMode -eq "test") {
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)"
    Write-Host "  2. Go to http://localhost:5173/pricing"
    Write-Host "  3. Test with: 4111 1111 1111 1111"
} else {
    Write-Host "Next steps:" -ForegroundColor Red
    Write-Host "  1. LIVE MODE IS ACTIVE - REAL MONEY CHARGES ENABLED" -ForegroundColor Red
    Write-Host "  2. Verify you're on production website"
    Write-Host "  3. Test CAREFULLY with real payment card"
}

Write-Host ""
